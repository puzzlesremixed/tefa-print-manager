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

  protected $keyType = 'string';
  public $incrementing = false;
  protected $fillable = [
    'customer_number',
    'customer_name',
    'total_price',
    'total_pages',
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
    if ($this->status === 'pending') {
      DB::transaction(function () {
        $this->update(['status' => 'queued']);

        // Eager load details to avoid N+1 query problem inside the loop
        $this->load('details');

        foreach ($this->details as $detail) {
          if ($detail->status === 'pending') {
            $detail->setStatus('queued', 'Queued for printing.');
          }
        }
      });
    } else {
      throw new Exception("Job cannot be queued. Current status: {$this->status}. Required: pending.");
    }
  }

  /**
   * Retry and dispatch the job to the printer queue.
   * Duplicate existing data into a new job and queue it.
   * Must be 'completed', 'partially_failed', 'failed', or 'cancelled' and will be turned into 'queued'.
   *
   * @throws Exception
   */
  public function retryAndQueue(): void
  {
    $allowed_statuses = ['completed', 'partially_failed', 'failed', 'cancelled'];

    if (in_array($this->status, $allowed_statuses)) {
      DB::transaction(function () {
        // Replicate the current job instance.
        // The replicate() method creates a copy of the model instance without the id, created_at, and updated_at.
        $newJob = $this->replicate();

        // Set the new job's status to 'queued'.
        $newJob->status = 'queued';

        // Save the new job to the database to get its new ID.
        $newJob->save();

        // Now, iterate through the original job's details and replicate them for the new job.
        foreach ($this->details as $detail) {
          $newDetail = $detail->replicate();

          // Associate the new detail with the new parent job.
          $newDetail->parent_id = $newJob->id;

          // Reset the status and other relevant fields for the new detail.
          $newDetail->status = 'queued';
          $newDetail->attempts = 0;
          $newDetail->locked_at = null;

          $newDetail->save();

          // Optionally, create an initial status log for the new detail.
          $newDetail->logs()->create([
            'status' => 'queued',
            'message' => 'Retried job, queued for printing.'
          ]);
        }
      });
    } else {
      throw new Exception("Job cannot be retried. Current status: {$this->status}. Required: completed, partially_failed, failed, or cancelled.");
    }
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
    $printing = $details->where('status', 'printing')->count();
    $completed = $details->where('status', 'completed')->count();
    $failed = $details->where('status', 'failed')->count();
    $cancelled = $details->where('status', 'cancelled')->count();
    $queued = $details->whereIn('status', ['queued', 'pending'])->count();
    $request_edit = $details->where('status', 'request_edit')->count();


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

    // If we don't have any file that requests an edit, goes to unpaid
    if ($request_edit == 0) {
      if ($this->status == 'request_edit') {
        $this->update(['status' => 'pending_payment']);
      }
      return;
    }
  }
}