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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            
            // Unique appointment number (e.g., APT-2026-000000)
            $table->string('appointment_number', 20)->unique();
            
            $table->foreignId('patient_id')
                ->constrained('users')
                ->onDelete('cascade');
                
            $table->foreignId('doctor_hospital_clinic_id')
                ->constrained('doctor_hospital_clinics')
                ->onDelete('cascade');
            
            // Appointment date and time
            $table->date('appointment_date');
            $table->time('appointment_time');
            
            // Appointment status: pending, confirmed, completed, cancelled, no-show
            $table->enum('status', [
                'pending',
                'confirmed',
                'completed',
                'cancelled',
                'no-show'
            ])->default('pending');
            
            // Consultation type
            $table->enum('consultation_type', [
                'in-person',
                'online',
                'phone'
            ])->default('in-person');
            
            // Appointment details
            $table->text('reason_for_visit')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            // Timestamps for tracking
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            
            // Indexes for efficient querying
            $table->index('patient_id');
            $table->index('doctor_hospital_clinic_id');
            $table->index(['appointment_date', 'appointment_time']);
            $table->index('status');
            $table->index('created_at');
            
            // Composite index for date range queries
            $table->index(['patient_id', 'appointment_date']);
            $table->index(['doctor_hospital_clinic_id', 'appointment_date']);
            
            // Prevent double-booking same slot
            $table->unique(
                ['doctor_hospital_clinic_id', 'appointment_date', 'appointment_time'],
                'unique_clinic_slot'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
