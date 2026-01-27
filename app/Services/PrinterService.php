<?php

namespace App\Services;

use App\Models\PrintJobDetail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrinterService
{
    /**
     * Check if the printer is free and there are items waiting.
     * If so, send the next one.
     */
    public function processNextItem(): void
    {
        // Check if there is physically a job marked as 'printing' (busy)
        // This prevents double dispatching if we want strict serial printing.
        $isBusy = PrintJobDetail::where('status', 'printing')->exists();

        if ($isBusy) {
            return; 
        }

        // Get the next queued item
        $nextItem = PrintJobDetail::readyToPrint()
            ->lockForUpdate() 
            ->first();

        if (!$nextItem) {
            return; 
        }

        $this->sendToExternalPrinter($nextItem);
    }

    private function sendToExternalPrinter(PrintJobDetail $detail): void
    {
        // Mark as printing immediately so lockForUpdate logic works for other threads
        $detail->setStatus('printing', 'Sent to print server');
        $detail->job->updateAggregatedStatus();

        try {
            $printerApiUrl = 'http://localhost:8080/print'; // Should be in config
            $filePath = $detail->asset->full_path;

            if (!file_exists($filePath)) {
                throw new \Exception("File not found at path: {$filePath}");
            }

            // The Node server implementation provided is synchronous (await print).
            // It returns 200 OK only after the job is sent to the printer spooler.
            $response = Http::asMultipart()
                ->attach(
                    'files',
                    file_get_contents($filePath),
                    $detail->asset->basename
                )
                ->post($printerApiUrl, [
                    'monochrome' => $detail->print_color === 'bnw',
                    'copies' => 1,
                    // 'callback_url' => route('api.printer.webhook') // Node code doesn't support this yet
                ]);

            if ($response->successful()) {
                // Since Node server returns success after spooling, we mark as completed here.
                // If the Node server supports webhooks in the future, we would leave it as 'printing'
                // and wait for the webhook. But for now, avoiding the stuck queue is priority.
                $detail->setStatus('completed', 'Successfully processed by Print Server');
                $detail->job->updateAggregatedStatus();

                // Recursively trigger the next item in the queue
                $this->processNextItem();

            } else {
                // Handle failure response
                $errorMessage = 'Print Server rejected request: ' . $response->status();
                if ($response->json('message')) {
                    $errorMessage .= ' - ' . $response->json('message');
                } elseif ($response->json('error')) {
                    $errorMessage .= ' - ' . $response->json('error');
                } elseif ($response->json('errors')) {
                     $errorMessage .= ' - ' . json_encode($response->json('errors'));
                }

                $detail->setStatus('failed', $errorMessage);
                $detail->job->updateAggregatedStatus();

                // Even if failed, try the next one
                $this->processNextItem();
            }

        } catch (\Exception $e) {
            $detail->setStatus('failed', 'Connection to Print Server failed: ' . $e->getMessage());
            $detail->job->updateAggregatedStatus();
            Log::error('Print Server Error: ' . $e->getMessage());
            
            // Retry next item? Maybe pause? 
            // For now, let's try processing the next one to avoid blocking the whole queue on one bad file.
            $this->processNextItem();
        }
    }
}
