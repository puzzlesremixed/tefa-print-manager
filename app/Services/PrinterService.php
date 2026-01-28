<?php

namespace App\Services;

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
    public function processNextItem(): void
    {
        $isBusy = PrintJobDetail::where('status', 'printing')
            ->orWhere('status', 'running')
            ->exists();

        Log::alert('Process next item' . $isBusy);

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
            $webhookUrl = route('api.printer.webhook');
            $filePath = $detail->asset->full_path;

            if (!file_exists($filePath)) {
                throw new \Exception("File not found at path: {$filePath}");
            }

            $payload = [
                'job_detail_id' => $detail->id,
                'webhook_url' => $webhookUrl,
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