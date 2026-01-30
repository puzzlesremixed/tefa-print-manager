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

  public static function printServEnpoint(): string
  {
    return Configuration::configs('prinserv_endpoint');
  }
}
