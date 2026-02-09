<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\PrinterDetail;
use App\Models\PrintJob;
use App\Models\PrintJobDetail;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrintJobController extends Controller
{
  public function store(Request $request)
  {
    try {
      $pageRangeRule = function ($attribute, $value, $fail) {
        $parts = explode(',', $value);
        foreach ($parts as $part) {
          $part = trim($part);
          if (!preg_match('/^[1-9]\d*(-[1-9]\d*)?$/', $part)) {
            $fail($attribute . ' contains an invalid page or page range format. Use formats like "1", "1-10", or "1,5,10-12".');
            return;
          }
          if (str_contains($part, '-')) {
            list($start, $end) = explode('-', $part);
            if (intval($start) >= intval($end)) {
              $fail($attribute . ' has an invalid range where start (' . $start . ') is greater than or equal to end (' . $end . '): ' . $part);
              return;
            }
          }
        }
      };

      $colorRule = function ($attribute, $value, $fail) use ($pageRangeRule) {
        if (in_array(strtolower($value), ['color', 'bnw', 'full_color'])) {
          return;
        }
        $pageRangeRule($attribute, $value, $fail);
      };

      $request->validate([
        'customer_name' => 'required|string|max:255',
        'customer_number' => 'required|string|max:255',
        'total_price' => 'required|integer|min:1',
        'total_pages' => 'required|integer|min:1',
        'items' => 'required|array',
        'items.*.file' => 'required|file',
        'items.*.color' => ['required', 'string', $colorRule],
        'items.*.needs_edit' => 'nullable',
        'items.*.pages' => 'required',
        'items.*.copies' => 'required|integer|min:1',
        'items.*.price' => 'required|integer|min:1',
        'items.*.paper_size' => 'sometimes|string|max:255',
        'items.*.scale' => 'sometimes|string|in:fit,noscale,shrink',
        'items.*.side' => 'sometimes|string|in:duplex,duplexshort,duplexlong,simplex',
        'items.*.pages_to_print' => ['sometimes', 'string', 'max:255', $pageRangeRule],
        'items.*.edit_notes' => 'nullable|string',
      ]);

      $printJob = DB::transaction(function () use ($request) {
        $atleastOneNeedsEdit = array_any(
          $request->items,
          fn($item) =>
          isset($item['needs_edit']) && $item['needs_edit'] == 'true'
        );


        $job = PrintJob::create([
          'customer_name' => $request->customer_name,
          'customer_number' => $request->customer_number,
          'total_price' => $request->total_price,
          'total_pages' => $request->total_pages,
          'status' =>  $atleastOneNeedsEdit ? 'request_edit' : 'pending_payment',
        ]);

        foreach ($request->items as $item) {
          $uploadedFile = $item['file'];
          $colorMode = $item['color'];
          $copies = $item['copies'] ?? 1;
          $editNote = $item['edit_notes'] ?? null;
          $needsEdit = $item['needs_edit'] == "true" ? true : false;

          $path = $uploadedFile->store('print_uploads', 'local');

          $totalFilePages = $this->countPages($uploadedFile->getRealPath(), $uploadedFile->getClientOriginalName());

          Log::info("Processing file: " . $uploadedFile->getClientOriginalName() . " | Initial Pages: " . $totalFilePages);

          $originalName = $uploadedFile->getClientOriginalName();
          $filenameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);

          $asset = Asset::create([
            'basename' => $originalName,
            'filename' => $filenameWithoutExt,
            'path' => $path,
            'extension' => $uploadedFile->extension(),
            'pages' => $totalFilePages,
          ]);
             
          $dbColorMode = $colorMode;
          $monochromePages = null;

          $detail = PrintJobDetail::create([
            'parent_id' => $job->id,
            'asset_id' => $asset->id,
            'print_color' => $dbColorMode,
            'price' => $item['price'],
            'status' => $needsEdit ? 'request_edit' : 'pending',
            'copies' => $copies,
            'edit_notes' => $editNote,
            'paper_size' => $item['paper_size'] ?? null,
            'paper_count' => $item['pages'] ?? null,
            'scale' => $item['scale'] ?? null,
            'side' => $item['side'] ?? null,
            'pages_to_print' => $item['pages_to_print'] ?? null,
            'monochrome_pages' => $monochromePages,
          ]);

          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'File uploaded, waiting for payment'
          ]);
        }

        return $job;
      });

      return response()->json([
        'message' => 'Order created successfully',
        'order_id' => $printJob->id,
      ], 201);
    } catch (\Exception $e) {
      Log::error("Print Job Store Error: " . $e->getMessage());
      return response()->json(['error' => 'Create failed', 'details' => $e->getMessage()], 500);
    }
  }

  public function show(PrintJob $printJob, Request $request)
  {
    $printJob->load('details.asset');
    if ($request->inertia() | ! $request->is('api/*')) {
      return Inertia::render(
        'print-job/print-detail',
        ['detail' => $printJob]
      );
    }

    return response()->json([
      'detail' => $printJob
    ]);
  }

  public function simulatePayment(PrintJob $printJob, Request $req)
  {
    if ($printJob->status !== 'pending_payment') {

      if (request()->wantsJson() && !request()->header('X-Inertia') && request()->is('api/*')) {
        return response()->json([
          'error' => 'Invalid Request',
          'message' => 'This order is not awaiting payment. Current status: ' . $printJob->status
        ], 400);
      }

      return back()->with('message', 'This order is not awaiting payment.');
    }

    try {
      DB::transaction(function () use ($printJob) {
        $printJob->update([
          'status' => 'pending',
          'paid_at' => now()
        ]);

        foreach ($printJob->details as $detail) {
          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'Payment received successfully. Waiting for print command.'
          ]);
        }
      });

      if ($req->inertia()) {
        return back()->with('message', 'Order marked as paid.');
      }

      return response()->json([
        'message' => 'Payment successful',
        'status' => $printJob->fresh()->status
      ]);
    } catch (\Exception $e) {
      if (request()->is('api/*')) {
        return response()->json(['error' => 'Payment processing failed', 'details' => $e->getMessage()], 500);
      }
      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  public function cancelPrintJob(PrintJob $printJob, Request $req)
  {
    if ($printJob->status == 'failed' || $printJob->status == 'completed' || $printJob->status == 'partially_failed') {

      if ($req->inertia()) {
        return back()->with('message', 'You cannot cancel this print job.');
      }
      return response()->json([
        'error' => 'Invalid Request',
        'message' => 'You cannot cancel this print job. Current status: ' . $printJob->status
      ], 400);
    }

    try {
      DB::transaction(function () use ($printJob) {
        $printJob->update([
          'status' => 'cancelled'
        ]);

        foreach ($printJob->details as $detail) {
          $detail->logs()->create([
            'status' => 'cancelled',
            'message' => 'Print job cancelled by admin.'
          ]);
        }
      });

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Print job cancelled.',
          'status' => $printJob->fresh()->status
        ]);
      }

      return back()->with('message', 'Print job cancelled.');
    } catch (\Exception $e) {
      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json(['error' => 'Fail to cancel the print job', 'details' => $e->getMessage()], 500);
      }
      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  public function dispatchJob(PrintJob $printJob, \App\Services\PrinterService $printerService, Request $req)
  {
    try {
      if ($printJob->status === 'pending') {
        $printJob->dispatchToQueue();
      } elseif ($printJob->status !== 'queued') {
        $msg = "Job cannot be queued. Current status: {$printJob->status}. Required: pending or queued.";
        if ($req->inertia()) {
          return back()->withErrors(['status' => $msg]);
        }
        return response()->json([
          'error' => 'Dispatch failed',
          'message' => $msg
        ], 500);
      }

      if (PrinterDetail::getPrimaryPaperCount()<$printJob->total_pages ) {
        $msg = "The printer is currently low on paper.";
        if ($req->inertia()) {
          return back()->withErrors(['status' => $msg]);
        }
        return response()->json([
          'error' => 'Dispatch failed',
          'message' => $msg
        ], 500);
      }


      $printerService->processNextItem();

      if ($req->inertia()) {
        return back()->with('message', 'Print job started successfully!');
      }

      PrinterDetail::reducePaperCount($printJob->total_pages);

      return response()->json([
        'message' => 'Job successfully queued',
        'status' => 'queued'
      ]);
    } catch (\Exception $e) {

      $statusCode = 400;

      if ($req->inertia()) {
        return back()->withErrors(['status' => $e->getMessage()]);
      }
      return response()->json([
        'error' => 'Dispatch failed',
        'message' => $e->getMessage()
      ], $statusCode);
    }
  }


  public function refreshQueue(PrintJob $printJob, \App\Services\PrinterService $printerService, Request $req)
  {
    try {
      $printerService->processNextItem();
      if ($req->inertia()) {
        return back();
      }

      return response()->json([
        'message' => "Refreshed."
      ]);
    } catch (Exception $e) {
      if ($req->inertia()) {
        return back()->withErrors(['status' => $e->getMessage()]);
      }
      return response()->json([
        'error' => 'Dispatch failed',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  private function detectColorsAndPrices($filePath, $originalName)
  {
    try {
      $response = Http::timeout(30)
        ->attach('files', file_get_contents($filePath), $originalName)
        ->post('http://localhost:5000/detect');

      if ($response->successful()) {
        $json = $response->json();
        if (isset($json['data']) && count($json['data']) > 0) {
          return $json['data'][0];
        }
      }
      return null;
    } catch (\Exception $e) {
      Log::error("Detect Colors failed: " . $e->getMessage());
      return null;
    }
  }

  private function countPages($filePath, $originalName): int
  {
    try {
      $printerServerUrl = GetConfigs::printServEnpoint() . '/count-pages';

      $response = Http::timeout(5)->attach(
        'file',
        file_get_contents($filePath),
        $originalName
      )->post($printerServerUrl);

      if ($response->successful()) {
        return (int) $response->json('pages');
      }

      return 1;
    } catch (\Exception $e) {
      Log::error("Count Pages failed: " . $e->getMessage());
      return 1;
    }
  }

  private function parsePageRanges(string $rangeString): array
  {
    $pages = [];
    $parts = explode(',', $rangeString);

    foreach ($parts as $part) {
      $part = trim($part);
      if (strpos($part, '-') !== false) {
        list($start, $end) = explode('-', $part, 2);
        $start = intval(trim($start));
        $end = intval(trim($end));
        if ($start > 0 && $end >= $start) {
          $pages = array_merge($pages, range($start, $end));
        }
      } else {
        $page = intval($part);
        if ($page > 0) {
          $pages[] = $page;
        }
      }
    }

    return array_unique($pages);
  }
}
