<?php

namespace App\Http\Controllers;

use App\Models\PrinterDetail;
use App\Models\PrintJob;
use Inertia\Inertia;

class QueueController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $queuedFiles = (clone $query)
      ->whereIn('status', ['queued'])
      ->orderBy('created_at', 'desc')
      ->get();

    $runningFiles = (clone $query)
      ->whereIn('status', ['running'])
      ->orderBy('created_at', 'desc')
      ->first();

    $pendingFiles = (clone $query)
      ->where('status', 'pending')
      ->orderBy('created_at', 'desc')
      ->get();

    $waitingPaymentFiles = (clone $query)
      ->where('status', 'pending_payment')
      ->orderBy('created_at', 'desc')
      ->get();

      $requestEditFiles = (clone $query)
      ->where('status', 'request_edit')
      ->orderBy('created_at', 'desc')
      ->get();

    $primaryPrinter = PrinterDetail::getPrimary();

    return Inertia::render('queue', [
      'queuedFiles' => $queuedFiles,
      'pendingFiles' => $pendingFiles,
      'runningFiles' => $runningFiles,
      'requestEditFiles' => $requestEditFiles,
      'waitingPaymentFiles' => $waitingPaymentFiles,
      'printer' => $primaryPrinter
    ]);
  }
}
