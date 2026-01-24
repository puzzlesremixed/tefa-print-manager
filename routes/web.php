<?php

use App\Http\Controllers\HistoryController;
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

  Route::get('config', function () {
    return Inertia::render('config');
  })->name('config');

  Route::get(
    'print-job/{id}',
    [PrintJobController::class, 'show']
  )->name('printJob.detail');

  Route::get('/queue', [QueueController::class, 'index'])->name('queue');
  Route::get('/history', [HistoryController::class, 'index'])->name('history');
  // Route::get('/history', [HistoryController::class, 'index'])->name('history');
});

require __DIR__ . '/settings.php';
