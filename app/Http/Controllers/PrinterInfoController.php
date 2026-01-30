<?php

namespace App\Http\Controllers;

use App\Models\PrinterDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrinterInfoController extends Controller
{
  public function index()
  {
    return Inertia::render('printers', [
      'printers' => PrinterDetail::all(),
      'primaryPrinter' => PrinterDetail::getPrimary(),
    ]);
  }

  public function setPrimary(string $id)
  {
    PrinterDetail::setAsPrimary($id);

    return redirect()->back();
  }

  public function updatePaperCount(Request $request, string $id)
  {
    $validated = $request->validate([
      'paper_remaining' => ['required', 'integer', 'min:0'],
    ]);

    PrinterDetail::where('id', $id)->update([
      'paper_remaining' => $validated['paper_remaining'],
    ]);

    return redirect()->back();
  }


  public function refreshAndFetchAll()
  {
    self::syncPrinters();
    $printers = PrinterDetail::all();
    return $printers;
  }

  public function syncPrinters()
  {
    PrinterDetail::syncFromEndpoint();
  }

}
