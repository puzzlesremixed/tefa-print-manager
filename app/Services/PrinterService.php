<?php

namespace App\Services;

use App\Http\Controllers\GetConfigs;
use App\Models\PrinterDetail;
use App\Models\PrintJobDetail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class PrinterService
{
  /**
   * Check if the printer is free and there are items waiting.
   * If so, send the next one.
   */
  public function processNextItem()
  {
    $isBusy = PrintJobDetail::where('status', 'printing')
      ->orWhere('status', 'running')
      ->exists();

    Log::alert('Process next item' . $isBusy);

    if ($isBusy) {
      return response()->json([
        'message' => "Refreshed."
      ]);
    }

    $nextItem = PrintJobDetail::readyToPrint()
      ->first();

    if (!$nextItem) {
      return;
    }

    $this->sendToExternalPrinter($nextItem);
  }

  private function sendToExternalPrinter(PrintJobDetail $detail): void
  {

    $detail->setStatus('printing', 'Sent to print server');
    $detail->job->updateAggregatedStatus();

    try {
      $printerApiUrl = GetConfigs::printServEnpoint() . '/print';
      $webhookUrl = route('apiPrinter.webhook');
      $filePath = $detail->asset->full_path;

      Log::info('Filepath' . $filePath);

      if (!file_exists($filePath)) {
        throw new \Exception("File not found at path: {$filePath}");
      }

      $payload = [
        'job_detail_id' => $detail->id,
        'webhook_url' => $webhookUrl,
        'copies' => $detail->copies,
        'printer' => PrinterDetail::getPrimary()->name,
      ];

      if ($detail->monochrome_pages) {
        $payload['monorange'] = $detail->monochrome_pages;
      } else {
        $payload['monochrome'] = $detail->print_color === 'bnw';
      }

      if ($detail->copies) {
        $payload['copies'] = $detail->copies;
      }

      if ($detail->paper_size) {
        $payload['paperSize'] = $detail->paper_size;
      }
      if ($detail->scale) {
        $payload['scale'] = $detail->scale;
      }
      if ($detail->side) {
        $payload['side'] = $detail->side;
      }
      if ($detail->pages_to_print) {
        $payload['pages'] = $detail->pages_to_print;
      }

      $response = Http::asMultipart()
        ->attach(
          'files',
          file_get_contents($filePath),
          $detail->asset->basename
        )
        ->post($printerApiUrl, $payload);

      if ($response->successful()) {
        Log::info("Job {$detail->id} sent to spooler.");
      } else {
        $errorMessage = 'Print Server rejected request: ' . $response->status();
        if ($response->json('message')) {
          $errorMessage .= ' - ' . $response->json('message');
        }

        $detail->setStatus('failed', $errorMessage);
        $detail->job->updateAggregatedStatus();
        $this->processNextItem();
      }
    } catch (\Exception $e) {
      $detail->setStatus('failed', 'Connection to Print Server failed: ' . $e->getMessage());
      $detail->job->updateAggregatedStatus();
      Log::error('Print Server Error: ' . $e->getMessage());
      $this->processNextItem();
    }
  }
}
