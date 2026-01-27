<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Asset extends Model
{
    use HasUuids;

    protected $fillable = [
        'basename', 
        'filename', 
        'path', 
        'extension', 
        'pages'
    ];

    /**
     * Get the full path to the file for the printing service.
     */
    public function getFullPathAttribute(): string
    {
        // Explicitly using local disk to match controller
        return Storage::disk('local')->path($this->path);
    }

    public function printJobDetails(): HasMany
    {
        return $this->hasMany(PrintJobDetail::class);
    }
}
