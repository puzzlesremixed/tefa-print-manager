<?php

use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrinterWebhookController;
use Illuminate\Support\Facades\Route;

// Create a new order
Route::post('/print-job/create', [PrintJobController::class, 'store'])->name('print-jobs.store');

// Get a specific print job
Route::get('/print-job/{printJob}', [App\Http\Controllers\PrintJobController::class, 'show'])->name('print-jobs.show');

// TODO : dummy routes!! disable this on prod
// Mark order as paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('print-jobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('print-jobs.cancelPrintJob');

// Dispatch print job
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
  ->name('print-jobs.dispatch');

Route::post('/print-job/refresh', [PrintJobController::class,   'refreshQueue'])
  ->name('print-jobs.dispatch');

// Get printer list
Route::get('/printers', [PrinterController::class, 'index'])->name('printers.index');
Route::post('/printers/{id}/primary', [PrinterInfoController::class, 'setPrimary']);
Route::post('/printers/sync', [PrinterInfoController::class, 'syncPrinters']);
Route::post('/printers/{id}/paper', [PrinterInfoController::class, 'updatePaperCount']);

Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])->name('printer.webhook');
