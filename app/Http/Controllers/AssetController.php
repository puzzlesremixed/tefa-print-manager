<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    public function download(Asset $asset)
    {
        abort_unless(
            Storage::disk('local')->exists($asset->path),
            404,
            'File not found'
        );

        return Storage::download($asset->path, $asset->basename);
    }
}
