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
        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->foreignId('unified_address_id')
                ->nullable()
                ->after('address_id')
                ->constrained('addresses')
                ->nullOnDelete();

            $table->json('service_address_snapshot')->nullable()->after('unified_address_id');
        });

        Schema::table('home_service_providers', function (Blueprint $table) {
            $table->foreignId('base_address_id')
                ->nullable()
                ->after('city_id')
                ->constrained('addresses')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_service_providers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('base_address_id');
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('unified_address_id');
            $table->dropColumn('service_address_snapshot');
        });
    }
};
