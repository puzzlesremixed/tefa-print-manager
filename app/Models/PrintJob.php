<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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

  public function scopeReadyToPrint($query)
  {
    return $query->where('status', 'queued')
      ->whereNull('locked_at')
      ->orderBy('priority', 'desc')
      ->orderBy('created_at', 'asc');
  }

  /**
   * Check if all files in this order are finished.
   */
  public function isCompletelyFinished(): bool
  {
    return $this->details->every(function ($detail) {
      return in_array($detail->status, ['completed', 'cancelled']);
    });
  }


  /**
   * Dispatch the job to the printer queue.
   * Moves status from 'pending' to 'queued'.
   *
   * @throws Exception
   */
  public function dispatchToQueue(): void
  {
    if ($this->status !== 'pending') {
      throw new Exception("Job cannot be queued. Current status: {$this->status}. Required: pending.");
    }

    DB::transaction(function () {
      $this->update(['status' => 'queued']);

      foreach ($this->details as $detail) {
        if ($detail->status === 'pending') {
          $detail->setStatus('queued', 'Queued for printing.');
        }
      }
    });
  }
}
