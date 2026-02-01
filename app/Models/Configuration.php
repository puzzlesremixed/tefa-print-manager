<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
  use HasUuids;

  protected $fillable = [
    'values',
    'primary'
  ];

  protected $casts = [
    'values' => 'array',
    'primary' => 'boolean',
  ];


  public static function configs($key = null, $default = null)
  {
    $configs = cache()->rememberForever('configs', function () {
      return optional(self::where('primary', true)->first())->values ?? [];
    });

    return $key
      ? data_get($configs, $key, $default)
      : $configs;
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

  public static function setAsPrimary(string $id): void
  {
    self::where('id', '!=', $id)
      ->where('primary', true)
      ->update(['primary' => false]);

    self::where('id', $id)->update([
      'primary' => true,
    ]);
  }

  public static function priceBnw(): int
  {
    return Configuration::configs('price.bnw');
  }


  public static function unsetPrimary(): void
  {
    self::where('primary', true)
        ->update(['primary' => false]);
  }


}

