<?php

use App\Http\Controllers\Configuration;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PrintDetailController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrintJobController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\QueueController;

Route::get('/test', fn() => dd('ok'));

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
    Route::get('/config', [Configuration::class, 'index'])->name('config');


    Route::get('/printers', [PrinterInfoController::class, 'index']);
    Route::get('/print-job/{printJob}/show', [PrintDetailController::class, 'show'])->name('printJob.show');
});

require __DIR__ . '/settings.php';
