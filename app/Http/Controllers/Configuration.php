<?php

namespace App\Http\Controllers;

use App\Models\PrinterInfo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Configuration extends Controller
{
    public function index()
    {
        $printerPrimary = PrinterInfo::getPrimary();
        return Inertia::render('config', [
            'primaryPrinter' =>  $printerPrimary
        ]);
    }
}
