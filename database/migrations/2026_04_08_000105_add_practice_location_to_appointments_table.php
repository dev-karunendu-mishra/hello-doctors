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
        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('doctor_practice_location_id')
                ->nullable()
                ->after('doctor_hospital_clinic_id')
                ->constrained('doctor_practice_locations')
                ->nullOnDelete();

            $table->json('appointment_address_snapshot')->nullable()->after('doctor_practice_location_id');
            $table->string('appointment_contact_phone', 20)->nullable()->after('appointment_address_snapshot');
            $table->string('appointment_contact_email', 100)->nullable()->after('appointment_contact_phone');

            $table->index('doctor_practice_location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['doctor_practice_location_id']);
            $table->dropConstrainedForeignId('doctor_practice_location_id');
            $table->dropColumn([
                'appointment_address_snapshot',
                'appointment_contact_phone',
                'appointment_contact_email',
            ]);
        });
    }
};
