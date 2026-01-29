<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;

class PrinterInfo extends Model
{
    protected $table = 'printer_info';
    protected $fillable = [
        'name',
        'paper_remaining',
        'status',
        'primary',
    ];

    protected $casts = [
        'primary' => 'boolean',
    ];

    // fetch db

    public static function fetchAll()
    {
        return self::all();
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
        self::query()->update(['primary' => false]);

        self::where('id', $id)->update([
            'primary' => true,
            'status'  => 'unknown',
        ]);
    }

    public static function unsetPrimary(string $id): void
    {
        self::where('id', $id)->update([
            'primary' => false,
            'status'  => 'unknown',
        ]);
    }

    public function getIsLowPaperAttribute(): bool
    {
        return $this->paper_remaining !== null && $this->paper_remaining < 10;
    }


    public static function syncFromEndpoint(): void
    {
        // TODO : get from config
        $response = Http::get(url('http://localhost:8080/printers'));

        if (!$response->successful()) {
            return;
        }

        $printers = $response->json('printers', []);

        foreach ($printers as $printer) {
            self::updateOrCreate(
                [
                    'name' => $printer['name'],
                ],
                [
                    'paper_remaining' => 0,
                    'status'          => 'unknown',
                    'primary'         => false,
                ]
            );
        }
    }
}
