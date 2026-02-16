<?php

use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PrinterInfoController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\EditRequestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\PrintDetailController;
use App\Http\Controllers\PrinterController;

// Route::get('/', function () {
//     return Inertia::render('home', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

  // views
  Route::get('dashboard', function () {
    return Inertia::render('dashboard');
  })->name('dashboard');
  Route::get('/queue', [QueueController::class, 'index'])->name('queue');
  Route::get('/history', [HistoryController::class, 'index'])->name('history');
  Route::get('/logs', [LogController::class, 'index'])->name('logs');
  Route::get('/config', [ConfigurationController::class, 'index'])->name('config');
  Route::get('/config/printers', [PrinterInfoController::class, 'index'])->name('printers.index');

  // logs/details
  Route::get('/logs/{activity}', [LogController::class, 'show'])->name('logs.detail');

  // print-job/details
  Route::get('print-job/{printJob}', [PrintDetailController::class, 'show'])->name('printJob.detail');
  // mark edit request as done
  Route::post('print-job/{printJob}/done', [EditRequestController::class, 'markAsDone'])->name('printJob.markDone');
  // mark order as paid
  Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('printJob.simulatePayment');
  // cancel order
  Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('printJob.cancelPrintJob');
  // dispatch queued job
  Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])->name('printJob.dispatch');
  // refresh list
  Route::post('/print-job/refresh', [PrintJobController::class, 'refreshQueue'])->name('printJob.refresh');
  // Uplaod file for an edit request
  Route::post('/queue/details/{detail}/upload', [EditRequestController::class, 'upload'])->name('edit-request.upload');

  // asset download
  Route::get('/assets/{asset}/download', [AssetController::class, 'download'])->name('assets.download');

  // config
  Route::post('/config', [ConfigurationController::class, 'store'])->name('config.store');

  // printers
  Route::post('/printers/{id}/primary', [PrinterInfoController::class, 'setPrimary'])->name('printers.setPrimary');
  Route::post('/printers/sync', [PrinterInfoController::class, 'syncPrinters'])->name('printers.sync');
  Route::post('/printers/{id}/paper', [PrinterInfoController::class, 'updatePaperCount']);
  // Exclude printers
  Route::post('/config/printers/exclude/add', [PrinterInfoController::class, 'addPrinterExclusion'])->name('printers.exclude.add');
  Route::post('/config/printers/exclude/remove/{printer_name}', [PrinterInfoController::class, 'deletePrinterExclusion'])->name('printers.exclude.remove');


  // Tetsing redirect routes
  Route::get('/trigger-error', function () {
    return back()->with('error', 'this is an error maybe');
  })->name('testing.error');
  Route::get('/trigger-success', function () {
    return back()->with('success', 'this is an success maybe');
  })->name('testing.success');
  Route::get('/trigger-info', function () {
    return back()->with('info', 'this is an info maybe');
  })->name('testing.info');
  Route::get('/trigger-warning', function () {
    return back()->with('warning', 'this is an warning maybe');
  })->name('testing.warning');

});

require __DIR__ . '/settings.php';
