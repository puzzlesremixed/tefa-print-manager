<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\PrintJobDetail;
use App\Models\PrintJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;

class EditRequestController extends Controller
{
    /**
     * Handle the upload of a modified file for a print job detail.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\PrintJobDetail  $detail
     * @return \Illuminate\Http\RedirectResponse
     */
    public function upload(Request $request, PrintJobDetail $detail)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png', 'max:20480'], // Max 20MB
        ]);

        if ($detail->status !== 'request_edit') {
            return back()->with('error', 'This item is not awaiting an edit.');
        }

        $uploadedFile = $request->file('file');

        $originalName = $uploadedFile->getClientOriginalName();
        $filenameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
        $extension = $uploadedFile->extension();
        $newFilename = Str::uuid() . '.' . $extension;

        $path = $uploadedFile->store('print_uploads', 'local');

        // TODO get file count
        $totalFilePages = // get from the api;

        $asset = Asset::create([
            'basename' => $originalName,
            'filename' => $filenameWithoutExt,
            'path' => $path,
            'extension' => $extension,
            'pages' => $totalFilePages,
        ]);

        $detail->update([
            'modified_asset_id' => $asset->id,
            ]);

        // $detail->logs()->create([
        //     'status' => 'pending',
        //     'message' => 'New file uploaded by admin, waiting for payment.'
        // ]);

        $parentPrint = PrintJob::where('id', $detail->parent_id)->firstOrFail();
        $parentPrint->update([
            'price' = // ...
        ])
        $parentPrint->updateAggregatedStatus();

        // TODO : recalculate the price here if it changes with the new file.

        return back()->with('success', 'File uploaded and job updated successfully.');
    }

    public function markAsDone(){
        
        $detail->update([
            'modified_asset_id' => $asset->id,
            ]);

            return back()->with('success', 'File uploaded and job updated successfully.');

    }


}
