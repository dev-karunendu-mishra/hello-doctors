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
        Schema::create('doctor_schedule_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_hospital_clinic_id')
                ->constrained('doctor_hospital_clinics')
                ->onDelete('cascade');
            
            // Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
            $table->tinyInteger('day_of_week')->comment('0=Sun, 1=Mon, ..., 6=Sat');
            
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            
            $table->time('break_start_time')->nullable();
            $table->time('break_end_time')->nullable();
            $table->comment('Break time (e.g., lunch break) within opening hours');
            
            $table->unsignedInteger('slot_duration_minutes')->default(30);
            $table->comment('Duration of each appointment slot (15, 30, 60, etc.)');
            
            $table->unsignedInteger('max_appointments_per_slot')->default(1);
            $table->comment('Allow concurrent bookings per slot (e.g., 2 for group consultation)');
            
            $table->boolean('is_available')->default(true);
            $table->comment('Mark day as OFF (unavailable) when false');
            
            $table->timestamps();
            
            // Indexes
            $table->index('doctor_hospital_clinic_id');
            $table->index('day_of_week');
            $table->index('is_available');
            
            // Unique constraint: only one schedule per day per clinic
            $table->unique(
                ['doctor_hospital_clinic_id', 'day_of_week'],
                'unique_clinic_day_schedule'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_schedule_slots');
    }
};
