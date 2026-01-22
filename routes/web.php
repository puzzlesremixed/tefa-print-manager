<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('queue', function () {
        return Inertia::render('queue');
    })->name('queue');

    Route::get('history', function () {
        return Inertia::render('history');
    })->name('history');
});

require __DIR__.'/settings.php';
