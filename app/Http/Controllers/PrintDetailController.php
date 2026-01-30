<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrintDetailController extends Controller
{
    public function show(PrintJob $printJob)
    {
        $printJob->load('details');
        return Inertia::render('print-job/print-detail',
            ['detail' => $printJob]
        );

    }
}
