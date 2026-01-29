<?php

use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrinterWebhookController;
use Illuminate\Support\Facades\Route;

// Create a New Order
Route::post('/print-job/create', [PrintJobController::class, 'store'])->name('apiPrintJobs.store');

// Get a Specific Print Job
Route::get('/print-job/{printJob}', [PrintJobController::class, 'show'])->name('apiPrintJobs.show');

// Mark Order as Paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('apiPrintjobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('apiPrintjobs.cancelPrintJob');

// Dispatch Queued Print Job (Typically called by the WhatsApp Bot API)
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
    ->name('printjobs.dispatch');

Route::post('/print-job/refresh', [PrintJobController::class, 'refreshQueue'])
    ->name('printjobs.refresh');

// Get printer list

// Get Printer List
Route::get('/printers', [PrinterController::class, 'index'])->name('printers.index');
Route::post('/printers/{id}/primary', [PrinterInfoController::class, 'setPrimary']);
Route::post('/printers/sync', [PrinterInfoController::class, 'syncPrinters']);
Route::post('/printers/{id}/paper', [PrinterInfoController::class, 'updatePaperCount']);

// Webhook for status
Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
    ->name('apiPrinter.webhook');
