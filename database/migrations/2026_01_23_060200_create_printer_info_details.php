<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('printer_details', function (Blueprint $table) {
      $table->id();
      $table->string("name");
      $table->integer("paper_remaining")->nullable();
      $table->enum("status", ["ready", "offline", "busy"]);
      $table->boolean('primary')->default(false);
      $table->timestamps();
    });
  }

  /**
   *
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('printer_details');
  }
};
