<?php

namespace App\Http\Controllers\Api;

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
      'job_id' => 'required|exists:print_job_details,id',
      'status' => 'required|in:completed,failed,cancelled', // Status from the printer
      'message' => 'nullable|string'
    ]);

    $detail = PrintJobDetail::find($validated['job_id']);

    // This marks the item as done, which means the "isBusy" check in the Service 
    $detail->setStatus($validated['status'], $validated['message'] ?? 'Update from Print Server');

    Log::info("Job {$detail->id} finished with status: {$validated['status']}");

    $printerService->processNextItem();

    return response()->json(['message' => 'Status updated, next job triggered']);
  }
}
