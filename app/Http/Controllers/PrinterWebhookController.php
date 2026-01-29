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
    $validated = $request->validate([
      'job_detail_id' => 'required|exists:print_job_details,id',
      'status' => 'required|in:running,completed,failed,cancelled',
      'message' => 'nullable|string',
      'pages_printed' => 'nullable|integer'
    ]);

    $detail = PrintJobDetail::find($validated['job_detail_id']);
    Log::error('webhook id job not found' . $detail);
    if (!$detail) {
      return response()->json(['message' => 'Job not found'], 404);
    }

    $currentStatus = $detail->status;
    $newStatus = $validated['status'];
    $message = $validated['message'] ?? 'Update from Print Server';

    if ($newStatus === 'running') {
      $newStatus = 'printing';
    }

    if (!in_array($currentStatus, ['completed', 'cancelled'])) {

      $detail->setStatus($newStatus, $message);

      if (isset($validated['pages_printed'])) {
        Log::info("Job {$detail->id} printed {$validated['pages_printed']} pages.");
      }

      $detail->job->updateAggregatedStatus();

      Log::info("Webhook: Job {$detail->id} updated to {$newStatus}");

      if (in_array($newStatus, ['completed', 'failed', 'cancelled'])) {
        $printerService->processNextItem();
      }
    }

    return response()->json(['message' => 'Status updated']);
  }
}
