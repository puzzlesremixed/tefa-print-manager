<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePrintJobRequest;
use App\Models\Asset;
use App\Models\PrintJob;
use App\Models\PrintJobDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class PrintJobController extends Controller
{
  // TODO : Create an interface for editing this
  const PRICE_BNW = 500;
  const PRICE_COLOR = 1000;

  public function store(StorePrintJobRequest $request)
  {
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

          $path = $uploadedFile->store('print_uploads');

          $pages = $this->countPages($uploadedFile->getRealPath(), $uploadedFile->extension());

          $asset = Asset::create([
            'basename' => $uploadedFile->getClientOriginalName(),
            'filename' => $uploadedFile->hashName(),
            'path' => $path,
            'extension' => $uploadedFile->extension(),
            'pages' => $pages,
          ]);

          $pricePerSheet = ($colorMode === 'color') ? self::PRICE_COLOR : self::PRICE_BNW;
          $itemPrice = $pages * $pricePerSheet;
          $runningTotal += $itemPrice;

          $detail = PrintJobDetail::create([
            'parent_id' => $job->id,
            'asset_id' => $asset->id,
            'print_color' => $colorMode,
            'price' => $itemPrice,
            'status' => 'pending',
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
      $printJob->dispatchToQueue();
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
}
