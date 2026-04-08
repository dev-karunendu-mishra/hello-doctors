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
        Schema::create('doctor_practice_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_practice_location_id')
                ->constrained('doctor_practice_locations')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->time('break_start_time')->nullable();
            $table->time('break_end_time')->nullable();
            $table->unsignedInteger('slot_duration_minutes')->default(30);
            $table->unsignedInteger('max_appointments_per_slot')->default(1);
            $table->boolean('is_available')->default(true)->index();
            $table->timestamps();

            $table->unique(['doctor_practice_location_id', 'day_of_week'], 'uniq_location_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_practice_schedules');
    }
};
