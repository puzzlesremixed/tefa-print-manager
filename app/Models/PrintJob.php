<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class PrintJob extends Model
{
  use HasUuids;

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
      return in_array($detail->status, ['completed', 'cancelled', 'failed']);
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

  /**
   * Re-evaluate the status of the PrintJob based on its details.
   */
  public function updateAggregatedStatus(): void
  {
    $this->load('details');
    $details = $this->details;

    if ($details->isEmpty()) {
      return;
    }

    $total = $details->count();
    $queued = $details->whereIn('status', ['queued', 'pending'])->count();
    $printing = $details->where('status', 'printing')->count();
    $completed = $details->where('status', 'completed')->count();
    $failed = $details->where('status', 'failed')->count();
    $cancelled = $details->where('status', 'cancelled')->count();

    // If any item is currently printing, the job is running
    if ($printing > 0) {
      if ($this->status !== 'running') {
        $this->update(['status' => 'running']);
      }
      return;
    }

    // If all items are processed (completed, failed, or cancelled)
    if (($completed + $failed + $cancelled) === $total) {
      if ($completed === $total) {
        $this->update(['status' => 'completed']);
      } elseif ($failed === $total) {
        $this->update(['status' => 'failed']);
      } elseif ($cancelled === $total) {
        $this->update(['status' => 'cancelled']);
      } else {
        // Mixed results
        $this->update(['status' => 'partially_failed']);
      }
      return;
    }

    // If we have some completed/failed items but still some queued, it's running
    if (($completed > 0 || $failed > 0) && $queued > 0) {
      if ($this->status !== 'running') {
        $this->update(['status' => 'running']);
      }
      return;
    }
  }
}
