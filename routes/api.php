<?php

use App\Http\Controllers\Api\PrinterWebhookController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

// Create a New Order
Route::post('/print-job', [PrintJobController::class, 'store'])->name('print-jobs.store');

// Get a Specific Print Job
Route::get('/print-job/{printJob}', [App\Http\Controllers\PrintJobController::class, 'show'])->name('print-jobs.show');

// Mark Order as Paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('print-jobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('print-jobs.cancelPrintJob');

// Dispatch Print Job
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
  ->name('print-jobs.dispatch');

// Get Printer List
Route::get('/printers', [PrinterController::class, 'index'])->name('printers.index');

// Webhook for status
Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
  ->name('api.printer.webhook');
