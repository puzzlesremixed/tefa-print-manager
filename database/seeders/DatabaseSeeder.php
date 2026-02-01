<?php

namespace Database\Seeders;

use App\Models\Configuration;
use App\Models\User;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
  /**
   * Seed the application's database.
   */
  public function run(): void
  {
    Configuration::create([
      'values' => [
        'auto_dispatch' => true,
        'prices' => [
          'bnw' => 500,
          'color' => 1000,
        ],
        'prinserv_endpoint' => "http://localhost:8080",
        'prinkiosk_endpoint' => "http://localhost:8080",
        'whatsappbot_endpoint' => "http://localhost:8080",
        'temp_duration' => 60000,
        'excluded_printers' => [
          'Microsoft Print to PDF',
          'OneNote for Windows 10',
          'OneNote (Desktop)',
        ],
      ],
      'primary' => true
    ]);

    User::factory()->create([
      'name' => 'Test User',
      'email' => 'test@example.com',
    ]);
  }
}
