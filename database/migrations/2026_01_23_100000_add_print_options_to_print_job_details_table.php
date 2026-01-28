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
        Schema::table('print_job_details', function (Blueprint $table) {
            $table->integer('copies')->default(1)->after('price');
            $table->string('paper_size')->nullable()->after('copies');
            $table->string('scale')->nullable()->after('paper_size'); // fit, noscale, shrink
            $table->string('side')->nullable()->after('scale'); // duplex, duplexshort, duplexlong, simplex
            $table->string('pages_to_print')->nullable()->after('side'); // e.g. "1,3-5"
            $table->string('monochrome_pages')->nullable()->after('pages_to_print'); // e.g. "1,3-5"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_job_details', function (Blueprint $table) {
            $table->dropColumn(['copies', 'paper_size', 'scale', 'side', 'pages_to_print', 'monochrome_pages']);
        });
    }
};
