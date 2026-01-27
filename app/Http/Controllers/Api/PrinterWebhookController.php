<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintJobDetail;
use App\Services\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrinterWebhookController extends Controller
{
  public function handle(Request $request, PrinterService $printerService)
  {
    $validated = $request->validate([
      'job_detail_id' => 'required|exists:print_job_details,id', // Matches standard ID or customized payload
      'status' => 'required|in:completed,failed,cancelled',
      'message' => 'nullable|string'
    ]);

    $detail = PrintJobDetail::find($validated['job_detail_id']);

    if (!$detail) {
        return response()->json(['message' => 'Job not found'], 404);
    }

    // Only update if it's currently printing or queued (avoid overwriting final states)
    if (in_array($detail->status, ['printing', 'queued'])) {
        $detail->setStatus($validated['status'], $validated['message'] ?? 'Update from Print Server');
        
        // Update the parent job status based on this new detail status
        $detail->job->updateAggregatedStatus();

        Log::info("Job {$detail->id} webhook update: {$validated['status']}");

        // Trigger next item in queue
        $printerService->processNextItem();
    }

    return response()->json(['message' => 'Status updated, next job triggered']);
  }
}
