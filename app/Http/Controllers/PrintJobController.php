<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\PrintJob;
use App\Models\PrintJobDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use setasign\Fpdi\Fpdi;

class PrintJobController extends Controller
{
  // TODO : Create an interface for editing this
  const PRICE_BNW = 500;
  const PRICE_COLOR = 1000;

  public function store(Request $request)
  {
    $pageRangeRule = function ($attribute, $value, $fail) {
      $parts = explode(',', $value);
      foreach ($parts as $part) {
        $part = trim($part);
        // Regex to validate a number or a number-range
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
      if (in_array(strtolower($value), ['color', 'bnw', 'auto'])) {
        return;
      }
      // If not a keyword, it must be a page range for monochrome pages
      $pageRangeRule($attribute, $value, $fail);
    };

    $validator = $request->validate([
      'customer_name' => 'required|string|max:255',
      'customer_number' => 'required|string|max:255',
      'items' => 'required|array',
      'items.*.file' => 'required|file',
      'items.*.color' => ['required', 'string', $colorRule],
      'items.*.copies' => 'sometimes|integer|min:1',
      'items.*.paper_size' => 'sometimes|string|max:255',
      'items.*.scale' => 'sometimes|string|in:fit,noscale,shrink',
      'items.*.side' => 'sometimes|string|in:duplex,duplexshort,duplexlong,simplex',
      'items.*.pages' => ['sometimes', 'string', 'max:255', $pageRangeRule],
    ]);

    try {

      $printJob = DB::transaction(function () use ($request) {

        $job = PrintJob::create([
          'customer_name' => $request->customer_name,
          'customer_number' => $request->customer_number,
          'total_price' => 0,
          'status' => 'pending_payment',
        ]);

        $runningTotal = 0;

        foreach ($request->items as $item) {
          $uploadedFile = $item['file'];
          $colorMode = $item['color'];

          // Force 'local' disk to ensure consistency with Asset model
          $path = $uploadedFile->store('print_uploads', 'local');

          $pages = $this->countPages($uploadedFile->getRealPath(), $uploadedFile->extension());

          $asset = Asset::create([
            'basename' => $uploadedFile->getClientOriginalName(),
            'filename' => $uploadedFile->hashName(),
            'path' => $path,
            'extension' => $uploadedFile->extension(),
            'pages' => $pages,
          ]);

          $numBnWPages = 0;
          $numColorPages = 0;
          $dbColorMode = $colorMode;
          $monochromePages = null;

          switch (strtolower($colorMode)) {
            case 'color':
              $numColorPages = $pages;
              $dbColorMode = 'color';
              break;
            case 'bnw':
              $numBnWPages = $pages;
              $dbColorMode = 'bnw';
              break;
            case 'auto':
              $numBnWPages = $pages;
              $dbColorMode = 'bnw';
              break;
            default:
              // Assumes a page range for B&W pages, rest are color
              $monochromePages = $colorMode;
              $bnwPagesArray = $this->parsePageRanges($colorMode);
              $bnwPageCount = 0;
              foreach ($bnwPagesArray as $page) {
                if ($page <= $pages) {
                  $bnwPageCount++;
                }
              }
              $numBnWPages = $bnwPageCount;
              $numColorPages = $pages - $numBnWPages;

              if ($numColorPages > 0) {
                $dbColorMode = 'color';
              } else {
                $dbColorMode = 'bnw';
              }
              break;
          }

          $itemPrice = ($numBnWPages * self::PRICE_BNW) + ($numColorPages * self::PRICE_COLOR);
          $runningTotal += $itemPrice;

          $detail = PrintJobDetail::create([
            'parent_id' => $job->id,
            'asset_id' => $asset->id,
            'print_color' => $dbColorMode,
            'price' => $itemPrice,
            'status' => 'pending',
            'copies' => $item['copies'] ?? 1,
            'paper_size' => $item['paper_size'] ?? null,
            'scale' => $item['scale'] ?? null,
            'side' => $item['side'] ?? null,
            'pages_to_print' => $item['pages'] ?? null,
            'monochrome_pages' => $monochromePages,
          ]);

          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'File uploaded, waiting for payment'
          ]);
        }

        $job->update(['total_price' => $runningTotal]);

        return $job;
      });

      return response()->json([
        'message' => 'Order created successfully',
        'order_id' => $printJob->id,
        'total_price' => $printJob->total_price,
      ], 201);
    } catch (\Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }

  public function show(PrintJob $printJob)
  {
    // if (request()->wantsJson() && !request()->header('X-Inertia')) {
      return response()->json([
        'success' => true,
        'data' => $printJob->load(['details.asset', 'details.logs']),
      ]);
    // }
    // return Inertia::render('print-job/print-detail', [
    //   'detail' => $query
    // ]);
  }

  public function simulatePayment(PrintJob $printJob)
  {
    if ($printJob->status !== 'pending_payment') {

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
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
          'status' => 'pending'
        ]);

        foreach ($printJob->details as $detail) {
          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'Payment received successfully. Waiting for print command.'
          ]);
        }
      });

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Payment successful',
          'status' => $printJob->fresh()->status
        ]);
      }

      return back()->with('message', 'Order marked as paid.');
    } catch (\Exception $e) {
      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json(['error' => 'Payment processing failed', 'details' => $e->getMessage()], 500);
      }
      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  public function cancelPrintJob(PrintJob $printJob)
  {
    if ($printJob->status == 'running' || $printJob->status ==  'failed' || $printJob->status == 'completed' || $printJob->status ==  'partially_failed') {

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'error' => 'Invalid Request',
          'message' => 'You cannot candel this print job. Current status: ' . $printJob->status
        ], 400);
      }

      return back()->with('message', 'You cannot candel this print job.');
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

  public function dispatchJob(PrintJob $printJob,  \App\Services\PrinterService $printerService)
  {
    try {
      // If pending, dispatch it. If queued, it's fine. Otherwise error.
      if ($printJob->status === 'pending') {
        $printJob->dispatchToQueue();
      } elseif ($printJob->status !== 'queued') {
        throw new \Exception("Job cannot be queued. Current status: {$printJob->status}. Required: pending or queued.");
      }

      $printerService->processNextItem();

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Job successfully queued',
          'status' => 'queued'
        ]);
      }

      return back()->with('message', 'Print job started successfully!');
    } catch (\Exception $e) {

      $statusCode = 400;

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'error' => 'Dispatch failed',
          'message' => $e->getMessage()
        ], $statusCode);
      }

      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  // Helper functions idk
  private function countPages($filePath, $extension): int
  {
    if (strtolower($extension) !== 'pdf') {
      return 1;
    }

    try {
      $pdf = new Fpdi();
      $pdf->setSourceFile($filePath);
      return $pdf->setSourceFile($filePath);
    } catch (\Exception $e) {
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
