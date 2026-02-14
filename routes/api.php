<?php

use App\Http\Controllers\ApiConfigurationController;
use App\Http\Controllers\EditRequestController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrinterWebhookController;
use Illuminate\Support\Facades\Route;

// Config
Route::get('/config/pricing', [ApiConfigurationController::class, 'pricing'])->name('api.config.pricing');

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

// Get Printer List
Route::get('/printers', [PrinterController::class, 'index'])->name('api.printers.index');

Route::post('/printers/{id}/primary', [PrinterInfoController::class, 'setPrimary'])->name('printers.setPrimary');
Route::post('/printers/sync', [PrinterInfoController::class, 'syncPrinters'])->name('printers.sync');
Route::post('/printers/{id}/paper', [PrinterInfoController::class, 'updatePaperCount']);

// Exclude printers
Route::post('/config/printers/exclude/add', [PrinterInfoController::class, 'addPrinterExclusion'])->name('printers.exclude.add');
Route::post('/config/printers/exclude/remove/{printer_name}', [PrinterInfoController::class, 'deletePrinterExclusion'])->name('printers.exclude.remove');

// Webhook for status
Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
    ->name('apiPrinter.webhook');

// Mark a edit request as done
Route::post('/pricing-preview', [EditRequestController::class, 'getPricing'])
  ->name('pricing.preview');
