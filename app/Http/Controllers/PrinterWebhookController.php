<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PrintJobDetail;
use App\Services\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// TODO : Work in progress
class PrinterWebhookController extends Controller
{
  public function handle(Request $request, PrinterService $printerService)
  {
    $detail = PrintJobDetail::find($printerService['job_detail_id']);

    $validated = [
      'job_detail_id' => $detail->id,
      'webhook_url'   => route('printer.webhook'),
      'copies'        => $detail->copies,
    ];


    if (!$detail) {
      return response()->json(['message' => 'Job not found'], 404);
    }

    if (in_array($detail->status, ['printing', 'queued'])) {
      $detail->setStatus($validated['status'], $validated['message'] ?? 'Update from Print Server');

      $detail->job->updateAggregatedStatus();

      Log::info("Job {$detail->id} webhook update: {$validated['status']}");

      $printerService->processNextItem();
    }

    return response()->json(['message' => 'Status updated, next job triggered']);
  }
}
