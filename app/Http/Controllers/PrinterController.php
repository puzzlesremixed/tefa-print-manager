<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class PrinterController extends Controller
{
    // Removing Type Hint to match Parent::index()
    public function index()
    {
        try {
            $printerApiUrl = 'http://localhost:8080/printers'; // Should be in config
            $response = Http::timeout(5)->get($printerApiUrl);

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch printer list from the print server.',
                    'details' => $response->json() ?? $response->body(),
                ], $response->status());
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to the print server.',
                'error' => $e->getMessage(),
            ], 503); // Service Unavailable
        }
    }
}
