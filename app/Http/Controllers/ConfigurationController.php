<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\PrinterDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConfigurationController extends Controller
{
  public function index()
  {
    $printerPrimary = PrinterDetail::getPrimary();
    $config = Configuration::configs();
    return Inertia::render('config', [
      'primaryPrinter' => $printerPrimary,
      'configuration' => $config
    ]);
  }

  public function deletePrinter(PrinterDetail $id)
  {
    //
  }




  public function store(Request $request)
  {
    $validated = $request->validate([
      'prices.bnw' => ['required', 'integer', 'min:0'],
      'prices.color' => ['required', 'integer', 'min:0'],
      'prices.full_color' => ['required', 'integer', 'min:0'],
      'temp_duration' => ['required', 'integer', 'min:0'],
      'delete_files' => ['required', 'boolean'],
      'prinserv_endpoint' => ['required', 'string', 'min:5'],
      'whatsappbot_endpoint' => ['nullable', 'string', 'min:5'],
      'mobilekiosk_endpoint' => ['nullable', 'string', 'min:5'],
      'colorserv_endpoint' => ['nullable', 'string', 'min:5'],
    ]);

    $primary = Configuration::getPrimary();
    $values = $primary?->values ?? [];

    $changes = array_merge($values, [
      'prices' => array_merge($values['prices'] ?? [], [
        'bnw'   => $validated['prices']['bnw'],
        'color' => $validated['prices']['color'],
        'full_color' => $validated['prices']['full_color'],
      ]),
      'temp_duration' => $validated['temp_duration'],
      'delete_files' => $validated['delete_files'],
      'prinserv_endpoint' => $validated['prinserv_endpoint'],
      'colorserv_endpoint' => $validated['colorserv_endpoint'],
      'whatsappbot_endpoint' => $validated['whatsappbot_endpoint'],
      'mobilekiosk_endpoint' => $validated['mobilekiosk_endpoint'],
    ]);

    DB::transaction(function () use ($changes) {
      Configuration::unsetPrimary();

      Configuration::create([
        'values' => $changes,
        'primary' => true,
      ]);
    });

    Cache::forget('configs');

    return redirect()->back()->with('success', 'Configuration updated');
  }
}
