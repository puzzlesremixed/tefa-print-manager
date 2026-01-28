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
            return;
        }

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
        $detail->setStatus('printing', 'Sent to print server');
        $detail->job->updateAggregatedStatus();

        try {
            $printerApiUrl = 'http://localhost:8080/print';
            $filePath = $detail->asset->full_path;

            if (!file_exists($filePath)) {
                throw new \Exception("File not found at path: {$filePath}");
            }

            $payload = [
                'copies' => $detail->copies,
            ];

            if ($detail->monochrome_pages) {
                $payload['monorange'] = $detail->monochrome_pages;
            } else {
                $payload['monochrome'] = $detail->print_color === 'bnw';
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
                $detail->setStatus('completed', 'Successfully processed by Print Server');
                $detail->job->updateAggregatedStatus();

                $this->processNextItem();

            } else {
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
