<?php

namespace App\Models;

use App\Http\Controllers\GetConfigs;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;

class PrinterDetail extends Model
{
  protected $fillable = [
    'name',
    'paper_remaining',
    'paper_sizes',
    'status',
    'primary',
  ];

  protected $casts = [
    'primary' => 'boolean',
    'paper_sizes' => 'array',
  ];

  // fetch db

  public static function fetchAll()
  {
    return self::all();
  }
  
  public static function reducePaperCount(int $count) : void
  {
    $printer =  self::getPrimary();
    $papers = $printer->paper_remaining;
    $printer->update([
      'paper_remaining' => $papers - $count,
    ]);
    return;
  }

  public static function getPrimary()
  {
    $printer = self::where('primary', true)->first();
    if ($printer) {

      return $printer;
    } else {
      return null;
    }
  }

  public static function getPrimaryPaperCount()
  {
    $printer = self::where('primary', true)->first();
    if ($printer) {

      return $printer->paper_remaining;
    } else {
      return null;
    }
  }

  public static function getAllWithoutPrimary()
  {
    $printer = self::where('primary', false)->get();
    if ($printer) {

      return $printer;
    } else {
      return null;
    }
  }


  public static function setAsPrimary(string $id): void
  {
    self::query()->update(['primary' => false]);

    self::where('id', $id)->update([
      'primary' => true,
    ]);
  }

  public static function unsetPrimary(): void
  {
    self::where('primary', true)
        ->update(['primary' => false]);
  }

  public function getIsLowPaperAttribute(): bool
  {
    return $this->paper_remaining !== null && $this->paper_remaining < 10;
  }


  public static function syncFromEndpoint()
  {
    $response = Http::get(url(GetConfigs::printServEnpoint() . '/printers'));

    if (!$response->successful()) {
      return back()->with('error', 'Failed to sync printers from PrinServ endpoint.');
    }
    $printers = $response->json('printers', []);

    foreach ($printers as $printer) {
      $excludedPrinters = GetConfigs::excludedPrinters();

      if (!in_array($printer['name'], $excludedPrinters, true)) {
        self::firstOrCreate(
          ['name' => $printer['name']],
          [
            'paper_remaining' => 0,
            'paper_sizes' => $printer['paperSizes'] ?? [],
            'status' => 'offline',
            'primary' => false,
          ]
        );
      }
    }
    return;
  }
}
