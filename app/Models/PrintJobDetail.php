<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrintJobDetail extends Model
{
  use HasUuids;

  protected $table = 'print_job_details';

  protected $fillable = [
    'parent_id',
    'asset_id',
    'print_color',
    'price',
    'copies',
    'paper_size',
    'scale',
    'side',
    'pages_to_print',
    'monochrome_pages',
    'status',
    'priority',
    'attempts',
    'locked_at',
  ];

  protected $casts = [
    'locked_at' => 'datetime',
  ];

  // relationships

  public function job(): BelongsTo
  {
    return $this->belongsTo(PrintJob::class, 'parent_id');
  }

  public function asset(): BelongsTo
  {
    return $this->belongsTo(Asset::class);
  }

  public function logs(): HasMany
  {
    return $this->hasMany(PrintJobStatusLog::class, 'detail_id')->orderByDesc('created_at');
  }


  /**
   * Scope to find jobs that are ready to print.
   * Use: PrintJobDetail::readyToPrint()->first();
   */
  public function scopeReadyToPrint(Builder $query): void
  {
    $query->where('status', 'queued')
      ->orWhere('status', 'failed')
      ->whereNull('locked_at') // Ensure no other worker is holding it
      ->orderBy('priority', 'desc')
      ->orderBy('created_at', 'asc');
  }


  /**
   * Update status and automatically create a log entry.
   */
  public function setStatus(string $newStatus, ?string $message = null): void
  {
    $this->update([
      'status' => $newStatus,
      'attempts' => $newStatus === 'failed' ? $this->attempts + 1 : $this->attempts,
      'locked_at' => in_array($newStatus, ['completed', 'failed', 'cancelled']) ? null : $this->locked_at,
    ]);

    // Create the history log
    $this->logs()->create([
      'status' => $newStatus,
      'message' => $message
    ]);
  }
}