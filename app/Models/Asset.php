<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
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
        // TODO : change file store
        return storage_path('app/' . $this->path);
    }

    public function printJobDetails(): HasMany
    {
        return $this->hasMany(PrintJobDetail::class);
    }
}