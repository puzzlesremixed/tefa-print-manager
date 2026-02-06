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
          'cancelled',
          'request_edit' // one of the file needs edit
        ]
      );
      $table->timestamps();
    });

    Schema::create('print_job_details', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->foreignUuid('parent_id')->constrained('print_jobs')->onDelete('cascade');
      $table->foreignUuid('asset_id')->constrained('assets');
      // TODO : get paper count from bot
      $table->integer('paper_count')->nullable();
      $table->integer('copies')->default(1)->after('price');
      $table->string('paper_size')->nullable()->after('copies');
      $table->string('scale')->nullable()->after('paper_size'); // fit, noscale, shrink
      $table->string('side')->nullable()->after('scale'); // duplex, duplexshort, duplexlong, simplex
      $table->string('pages_to_print')->nullable()->after('side'); // e.g. "1,3-5"
      $table->string('monochrome_pages')->nullable()->after('pages_to_print'); // e.g. "1,3-5"
      $table->enum('print_color', ['color', 'bnw', 'full_color']);
      $table->integer('price');
      $table->string('edit_notes')->nullable();
      $table->enum('status', ['pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'request_edit'])->default('pending');
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
