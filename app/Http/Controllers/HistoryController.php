<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PrintJob;
use Illuminate\Auth\Events\Failed;
use Inertia\Inertia;

class HistoryController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $pastFiles = (clone $query)
      ->whereIn('status', ['cancelled', 'completed', 'partially_failed', 'failed',])
      ->orderBy('created_at', 'desc')
      ->get();

    return Inertia::render('history', [
      'pastFiles' => $pastFiles,
    ]);
  }
}
