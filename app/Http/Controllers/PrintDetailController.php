<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrintDetailController extends Controller
{
  public function show(Request $request, PrintJob $printJob)
  {
    $printJob->load(['details.asset', 'details.modified_asset']);
    if ($request->inertia() | !$request->is('api/*')) {
      return Inertia::render(
        'print-job/print-detail',
        ['detail' => $printJob]
      );
    }

    return response()->json([
      'detail' => $printJob
    ]);
  }
}
