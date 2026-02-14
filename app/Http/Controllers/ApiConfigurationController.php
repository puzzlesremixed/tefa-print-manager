<?php

namespace App\Http\Controllers;

class ApiConfigurationController extends Controller
{
    public function pricing()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'prices' => [
                    'bnw' => GetConfigs::bnw() ?? null,
                    'color' => GetConfigs::color() ?? null,
                    'full_color' => GetConfigs::full_color() ?? null,
                ]
            ]
        ]);
    }
}
