<?php

namespace App\Http\Controllers;

use App\Models\PrinterInfo;
use App\Models\PrintJob;
use Inertia\Inertia;

class QueueController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $queuedFiles = (clone $query)
      ->whereIn('status', ['queued']) 
      ->orderBy('created_at', 'asc')
      ->get();

    $pendingFiles = (clone $query)
      ->where('status', 'pending')
      ->orderBy('created_at', 'asc')
      ->get();

    $waitingPaymentFiles = (clone $query)
      ->where('status', 'pending_payment')
      ->orderBy('created_at', 'desc')
      ->get();

  $primaryPrinter = PrinterInfo::getPrimary();

    return Inertia::render('queue', [
      'queuedFiles' => $queuedFiles,
      'pendingFiles' => $pendingFiles,
      'waitingPaymentFiles' => $waitingPaymentFiles,
      'primaryPrinter' => $primaryPrinter 
    ]);
  }
}