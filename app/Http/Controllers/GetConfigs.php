<?php

namespace App\Http\Controllers;

use App\Models\Configuration;

class GetConfigs
{
  public static function bnw(): int
  {
    return Configuration::configs('prices.bnw');
  }

  public static function color(): int
  {
    return Configuration::configs('prices.color');
  }

  
  public static function printServEnpoint()
  {
    return Configuration::configs('prinserv_endpoint');
  }
  public static function excludedPrinters(): array
  {
    return Configuration::configs('excluded_printers');
  }
}
