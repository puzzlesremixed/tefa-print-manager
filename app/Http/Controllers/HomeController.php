<?php

namespace App\Http\Controllers;

use App\Models\PrinterDetail;
use App\Models\PrintJob;
use Inertia\Inertia;

class HomeController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $allFiles = (clone $query)
      ->whereIn('status', ['queued', 'running', 'pending', 'pending_payment'])
      ->orderBy('created_at', 'desc')
      ->get();

    $primaryPrinter = PrinterDetail::getPrimary();

    return Inertia::render('home', [
      'allFiles' => $allFiles,
      'printer' => $primaryPrinter
    ]);
  }
}
