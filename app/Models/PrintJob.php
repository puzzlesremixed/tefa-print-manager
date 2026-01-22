<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrintJob extends Model
{
    protected $fillable = [
        'customer_number',
        'customer_name',
        'total_price',
        'status',
    ];

    public function details(): HasMany
    {
        // Note: Foreign key is 'parent_id' per your schema
        return $this->hasMany(PrintJobDetail::class, 'parent_id');
    }

    /**
     * Check if all files in this order are finished.
     */
    public function isCompletelyFinished(): bool
    {
        return $this->details->every(function ($detail) {
            return in_array($detail->status, ['completed', 'canceled']);
        });
    }
}