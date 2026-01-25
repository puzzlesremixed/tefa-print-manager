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
        $isBusy = PrintJobDetail::where('status', 'printing')->exists();

        if ($isBusy) {
            
            return; // Printer is busy
        }
        $nextItem = PrintJobDetail::readyToPrint()
            ->lockForUpdate() 
            ->first();

        if (!$nextItem) {
            Log::info("no next item");
            return; 
        }

        $this->sendToExternalPrinter($nextItem);
    }

    private function sendToExternalPrinter(PrintJobDetail $detail): void
    {
        $detail->setStatus('printing', 'Sent to print server');

        try {
            $printerApiUrl = 'http://localhost:8080/print'; // Should be in config
            $filePath = $detail->asset->full_path;

            if (!file_exists($filePath)) {
                throw new \Exception("File not found at path: {$filePath}");
            }

            $response = Http::asMultipart()
                ->attach(
                    'files',
                    file_get_contents($filePath),
                    $detail->asset->basename
                )
                ->post($printerApiUrl, [
                    'monochrome' => $detail->print_color === 'bnw',
                    'copies' => 1,
                ]);

            if ($response->failed()) {
                $errorMessage = 'Print Server rejected request: ' . $response->status();
                Log::info("rejected");
                if ($response->json('message')) {
                    $errorMessage .= ' - ' . $response->json('message');
                } elseif ($response->json('error')) {
                    $errorMessage .= ' - ' . $response->json('error');
                }
                $detail->setStatus('failed', $errorMessage);
                $this->processNextItem(); // skips this entry
            }

            Log::info($response->json('message'));
        } catch (\Exception $e) {
            $detail->setStatus('failed', 'Connection to Print Server failed: ' . $e->getMessage());
            Log::error('Print Server Error: ' . $e->getMessage());
        }
    }
}
