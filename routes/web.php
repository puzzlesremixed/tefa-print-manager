<?php

use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrintJobController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\QueueController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/queue', [QueueController::class, 'index'])->name('queue');
    Route::get('/history', [HistoryController::class, 'index'])->name('history');

    Route::get('print-job/{id}', [PrintJobController::class, 'show'])->name('printJob.detail');

    // Configurations
    Route::get('config', [ConfigurationController::class, 'index'])->name('config');
    Route::post('/config', [ConfigurationController::class, 'store'])
        ->name('config.store');
    Route::get('/config/printers', [PrinterInfoController::class, 'index'])->name('printers.index');
});

require __DIR__ . '/settings.php';
