<?php

namespace App\Http\Controllers;

use App\Models\PrinterInfo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrinterInfoController extends Controller
{
    public function index()
    {
        return Inertia::render('printers', [
            'printers' => PrinterInfo::all(),
            'primaryPrinter' => PrinterInfo::getPrimary(),
        ]);
    }

    public function setPrimary(string $id)
    {
        PrinterInfo::setAsPrimary($id);

        return redirect()->back();
    }

    public function updatePaperCount(Request $request, string $id)
    {
        $validated = $request->validate([
            'paper_remaining' => ['required', 'integer', 'min:0'],
        ]);

        PrinterInfo::where('id', $id)->update([
            'paper_remaining' => $validated['paper_remaining'],
        ]);

        return redirect()->back();
    }


    public function refreshAndFetchAll(){
        self::syncPrinters();
        $printers = PrinterInfo::all();
        return $printers;
    }

    public function syncPrinters(){
        PrinterInfo::syncFromEndpoint();
    }
    
}
