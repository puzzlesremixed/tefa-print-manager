<?php

use App\Http\Controllers\Api\PrinterWebhookController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PrintJobController;

// Create a new order
Route::post('/print-job', [PrintJobController::class, 'store'])->name('print-jobs.store');

// TODO : dummy routes!! disable this on prod
// Mark order as paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('print-jobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('print-jobs.cancelPrintJob');

// Dispatch print job
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
  ->name('print-jobs.dispatch');

Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
  ->name('api.printer.webhook');
