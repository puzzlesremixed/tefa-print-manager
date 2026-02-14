<?php

namespace Database\Seeders;

use App\Models\Configuration;
use App\Models\PrinterDetail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
  /**
   * Seed the application's database.
   */
  public function run(): void
  {
    DB::transaction(function () {
      Configuration::create([
        'values' => [
          'auto_dispatch' => true,
          'prices' => [
            'bnw' => 500,
            'color' => 1000,
            'full_color' => 1500,
          ],
          'prinserv_endpoint' => "http://localhost:8080",
          'prinkiosk_endpoint' => "http://localhost:8080",
          'colorserv_endpoint' => "http://localhost:5000/detect",
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

      PrinterDetail::create([
        'name' => "EPSON L210 Series",
        'paper_sizes' => [],
        'paper_remaining' => 0,
        'primary' => true,
        'status' => 'offline'
      ]);

      User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
      ]);
    });
  }
}
