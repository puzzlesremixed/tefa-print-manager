<?php

namespace App\Http\Controllers;

use App\Models\Configuration;

class ApiConfigurationController extends Controller
{
    public function index()
    {
        $prices = Configuration::configs('prices', []);

        return response()->json([
            'success' => true,
            'data' => [
                'prices' => [
                    'bnw' => $prices['bnw'] ?? null,
                    'color' => $prices['color'] ?? null,
                ]
            ]
        ]);
    }
}
