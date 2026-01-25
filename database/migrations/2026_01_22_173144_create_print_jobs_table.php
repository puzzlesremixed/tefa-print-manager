<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('print_jobs', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('customer_number');
      $table->string('customer_name')->index();
      $table->integer('total_price');
      $table->timestamp('paid_at')->nullable();

      // aggregate state (if all details are done, this one is done)
      $table->enum(
        'status',
        [
          'pending_payment',  // havent paid
          'pending', // already paid, printing not started yet
          'queued', // already paid, print on queue
          'running', // currently printing
          'completed',
          'partially_failed',
          'failed',
          'cancelled'
        ]
      );
      $table->timestamps();
    });

    Schema::create('print_job_details', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->foreignUuid('parent_id')->constrained('print_jobs')->onDelete('cascade');
      $table->foreignUuid('asset_id')->constrained('assets');

      $table->enum('print_color', ['color', 'bnw']);
      $table->integer('price');

      $table->enum('status', ['pending', 'queued', 'printing', 'completed', 'failed', 'cancelled'])->default('pending');
      $table->integer('priority')->default(0);

      $table->tinyInteger('attempts')->default(0); // track printing attempts, fails the job after certain amount

      $table->timestamp('locked_at')->nullable(); // when the item is get sent to the printer

      $table->timestamps();

      $table->index(['status', 'priority', 'created_at']);
    });

    Schema::create('print_job_status_logs', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->foreignUuid('detail_id')->constrained('print_job_details');
      $table->string('status');
      $table->text('message')->nullable();
      $table->timestamp('created_at')->useCurrent();
    });
  }
  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('print_job_status_logs');
    Schema::dropIfExists('print_job_details');
    Schema::dropIfExists('print_jobs');
  }
};
