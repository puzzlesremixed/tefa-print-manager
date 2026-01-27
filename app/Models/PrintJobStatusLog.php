<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJobStatusLog extends Model
{
    use HasUuids;

    public $timestamps = false; 

    protected $fillable = [
        'detail_id',
        'status',
        'message',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function detail(): BelongsTo
    {
        return $this->belongsTo(PrintJobDetail::class, 'detail_id');
    }
}
