<?php

namespace App\Http\Controllers;

use App\Models\PrinterDetail;
use App\Models\Configuration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PrinterInfoController extends Controller
{
  public function index()
  {
    $printerPrimary = PrinterDetail::getPrimary();
    $printers = PrinterDetail::getAllWithoutPrimary();
    $excludedPrinters = Configuration::configs()['excluded_printers'] ?? [];
    $endpoint = GetConfigs::printServEnpoint();
    return Inertia::render('config/printers', [
      'primaryPrinter' => $printerPrimary,
      'printers' => $printers,
      'excludedPrinters' => $excludedPrinters,
      'endpoint' => $endpoint,
    ]);
  }

  public function addPrinterExclusion(Request $request)
  {
    $values = Configuration::configs();
    $validated = $request->validate([
      'printer_name' => ['required', 'string'],
    ]);
    $printer_name = $validated['printer_name'];

    // normalize
    $excluded = $values['excluded_printers'] ?? [];

    // avoid duplicates
    if (!in_array($printer_name, $excluded, true)) {
      $excluded[] = $printer_name;
    }

    DB::transaction(function () use ($values, $excluded, $printer_name) {
      // demote current primary
      if ($values) {
        Configuration::unsetPrimary();
      }

      // create new config with updated exclusion list
      Configuration::create([
        'values' => array_merge($values, [
          'excluded_printers' => $excluded,
        ]),
        'primary' => true,
      ]);

      $printer = PrinterDetail::where('name', $printer_name)->first();
      if ($printer) {
        // if primary, just delete — no primary remains
        $printer->delete();
      }
    });

    Cache::forget('configs');

    return redirect()->back()->with('success', 'Printer excluded successfully.');
  }


  public function deletePrinterExclusion(string $printer_name, Request $request)
  {
    $values = Configuration::configs();

    $excluded = $values['excluded_printers'] ?? [];

    // remove printer
    $excluded = array_values(
      array_filter($excluded, fn($p) => $p !== $printer_name)
    );

    DB::transaction(function () use ($values, $excluded) {
      // demote current primary
      if ($values) {
        Configuration::unsetPrimary();
      }

      // create new config with updated exclusion list
      Configuration::create([
        'values' => array_merge($values, [
          'excluded_printers' => $excluded,
        ]),
        'primary' => true,
      ]);
    });

    Cache::forget('configs');

    return redirect()->back()->with('success', 'Printer exclusion removed.');
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

    return redirect()->back()->with('success', 'Paper count updated.');
  }
  
  public function reducePaperCount(Request $request)
  {
    $validated = $request->validate([
      'count' => ['required', 'integer', 'min:0'],
    ]);

    PrinterDetail::reducePaperCount($validated['count']);
    return redirect()->back()->with('success', 'Paper count updated.');
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
    return back()->with('success', 'Printers synced successfully from Printer Server endpoint.');
  }
}
