<?php

use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrinterWebhookController;
use Illuminate\Support\Facades\Route;

// Create a New Order
Route::post('/print-job', [PrintJobController::class, 'store'])->name('print-jobs.store');

// Get a Specific Print Job
Route::get('/print-job/{printJob}', [App\Http\Controllers\PrintJobController::class, 'show'])->name('print-jobs.show');

// Mark Order as Paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('print-jobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('print-jobs.cancelPrintJob');

// Dispatch Queued Print Job (Typically called by the WhatsApp Bot API)
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
  ->name('print-jobs.dispatch');

Route::post('/print-job/refresh', [PrintJobController::class,   'refreshQueue'])
  ->name('print-jobs.dispatch');

// Get printer list

// Dispatch All Queued Print Jobs (Typically called by the Admin panel)
Route::post('/print-job-all/dispatch', [PrintJobController::class, 'dispatchAllJob'])
  ->name('print-jobs.dispatch-all');


// Get Printer List
Route::get('/printers', [PrinterController::class, 'index'])->name('printers.index');
Route::post('/printers/{id}/primary', [PrinterInfoController::class, 'setPrimary']);
Route::post('/printers/sync', [PrinterInfoController::class, 'syncPrinters']);
Route::post('/printers/{id}/paper', [PrinterInfoController::class, 'updatePaperCount']);

// Webhook for status
Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
  ->name('api.printer.webhook');
