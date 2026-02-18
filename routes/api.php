<?php

use App\Http\Controllers\ApiConfigurationController;
use App\Http\Controllers\EditRequestController;
use App\Http\Controllers\PrintDetailController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterWebhookController;
use Illuminate\Support\Facades\Route;

// Get pricing
Route::get('/config/pricing', [ApiConfigurationController::class, 'pricing'])->name('api.config.pricing');

// Create a new order
Route::post('/print-job/create', [PrintJobController::class, 'store'])->name('api.printJob.store');

// Get a Specific Print Job
Route::get('/print-job/{printJob}', [PrintDetailController::class, 'show'])->name('api.printJob.show');

// Webhook for status
Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])->name('api.printer.webhook');

// Upload file for initial price estimation
Route::post('/pricing-preview', [EditRequestController::class, 'getPricing'])->name('api.pricing.preview');