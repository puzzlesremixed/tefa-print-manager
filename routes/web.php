<?php

use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\AssetController;

// Route::get('/', function () {
//     return Inertia::render('home', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/queue', [QueueController::class, 'index'])->name('queue');
    Route::get('/history', [HistoryController::class, 'index'])->name('history');

    Route::get('/logs', [LogController::class, 'index'])->name('logs');
    Route::get('/logs/{activity}', [LogController::class, 'show'])->name('logs.detail');

    Route::get('print-job/{printJob}', [PrintJobController::class, 'show'])->name('printJob.detail');

    // Configurations
    Route::get('config', [ConfigurationController::class, 'index'])->name('config');
    Route::post('/config', [ConfigurationController::class, 'store'])
        ->name('config.store');
    Route::get('/config/printers', [PrinterInfoController::class, 'index'])->name('printers.index');

    Route::get('/assets/{asset}/download', [AssetController::class, 'download'])
        ->name('assets.download');
});

require __DIR__ . '/settings.php';
