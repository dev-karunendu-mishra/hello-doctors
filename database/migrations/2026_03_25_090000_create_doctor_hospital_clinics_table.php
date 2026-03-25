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
        Schema::create('doctor_hospital_clinics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_profile_id')
                ->constrained('doctor_profiles')
                ->onDelete('cascade');
            
            $table->string('hospital_clinic_name', 100);
            $table->text('address');
            $table->string('landmarks', 255)->nullable();
            
            $table->foreignId('city_id')
                ->constrained('cities')
                ->onDelete('restrict');
            
            $table->decimal('consultation_fee', 10, 2)->nullable();
            $table->comment('Location-specific fee; NULL falls back to doctor_profiles.consultation_fee');
            
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('doctor_profile_id');
            $table->index('city_id');
            $table->index('is_active');
            $table->index('created_at');
            
            // Unique constraint to prevent duplicate clinic entries
            $table->unique(
                ['doctor_profile_id', 'hospital_clinic_name', 'city_id'],
                'unique_doctor_hospital_city'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_hospital_clinics');
    }
};
