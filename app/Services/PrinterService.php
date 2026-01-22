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
            return; 
        }

        $this->sendToExternalPrinter($nextItem);
    }

    private function sendToExternalPrinter(PrintJobDetail $detail): void
    {
        $detail->setStatus('printing', 'Sent to print server');

        try {
          //TODO : change idk
            $response = Http::timeout(10)->post('http://example.com/', [
                'job_id' => $detail->id, 
                'file_url' => asset('storage/' . $detail->asset->path),
                'color_mode' => $detail->print_color,
                'callback_url' => route('api.printer.webhook'), 
            ]);

            if ($response->failed()) {
                $detail->setStatus('failed', 'Print Server rejected request: ' . $response->status());
                $this->processNextItem(); // skips this entry
            }

        } catch (\Exception $e) {
            $detail->setStatus('failed', 'Connection to Print Server failed');
            Log::error('Print Server Error: ' . $e->getMessage());
        }
    }
}