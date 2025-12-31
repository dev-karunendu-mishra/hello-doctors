<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('specialization_id')->nullable()->constrained('specialties')->onDelete('set null');
            $table->string('license_number')->nullable()->unique();
            $table->text('qualification')->nullable();
            $table->integer('experience_years')->nullable();
            $table->decimal('consultation_fee', 10, 2)->nullable();
            $table->text('bio')->nullable();
            $table->string('profile_image')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_available_online')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index('specialization_id');
            $table->index('is_verified');
            $table->index('is_available_online');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
