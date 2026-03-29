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
        Schema::create('home_service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('home_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('home_service_categories')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->decimal('base_price', 10, 2)->default(0);
            $table->enum('price_type', ['fixed', 'hourly', 'package'])->default('fixed');
            $table->unsignedInteger('buffer_minutes')->default(15);
            $table->boolean('requires_certification')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('home_service_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('provider_type', ['nurse', 'attendant', 'lab_tech', 'field_exec']);
            $table->string('license_number')->nullable();
            $table->unsignedInteger('experience_years')->default(0);
            $table->foreignId('city_id')->constrained('cities')->cascadeOnDelete();
            $table->decimal('service_radius_km', 5, 2)->nullable();
            $table->boolean('is_verified')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->unique('user_id');
        });

        Schema::create('home_service_provider_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('home_service_providers')->cascadeOnDelete();
            $table->foreignId('home_service_id')->constrained('home_services')->cascadeOnDelete();
            $table->decimal('custom_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->unique(['provider_id', 'home_service_id'], 'uniq_provider_service');
        });

        Schema::create('home_service_provider_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('home_service_providers')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sunday, 6=Saturday
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->time('break_start_time')->nullable();
            $table->time('break_end_time')->nullable();
            $table->unsignedInteger('slot_duration_minutes')->default(30);
            $table->unsignedInteger('max_bookings_per_slot')->default(1);
            $table->boolean('is_available')->default(true)->index();
            $table->timestamps();

            $table->unique(['provider_id', 'day_of_week'], 'uniq_provider_day');
            $table->index(['provider_id', 'is_available'], 'idx_provider_available');
        });

        Schema::create('home_service_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label', 30)->default('Home');
            $table->string('contact_name');
            $table->string('contact_phone', 20);
            $table->string('line1');
            $table->string('line2')->nullable();
            $table->string('landmark')->nullable();
            $table->foreignId('city_id')->constrained('cities')->cascadeOnDelete();
            $table->string('pincode', 10);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();

            $table->index(['user_id', 'city_id'], 'idx_user_city');
        });

        Schema::create('home_service_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('home_service_id')->constrained('home_services')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('home_service_providers')->nullOnDelete();
            $table->foreignId('address_id')->constrained('home_service_addresses')->cascadeOnDelete();
            $table->date('service_date');
            $table->time('service_time');
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('travel_fee', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending')->index();
            $table->enum('status', ['pending', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
                ->default('pending')
                ->index();
            $table->text('special_instructions')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['home_service_id', 'service_date'], 'idx_service_date');
            $table->index(['provider_id', 'service_date'], 'idx_provider_date');
            $table->unique(['provider_id', 'service_date', 'service_time'], 'uniq_provider_slot');
        });

        Schema::create('home_service_booking_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('home_service_bookings')->cascadeOnDelete();
            $table->string('old_status', 30)->nullable();
            $table->string('new_status', 30);
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'created_at'], 'idx_booking_status_log');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('home_service_booking_status_logs');
        Schema::dropIfExists('home_service_bookings');
        Schema::dropIfExists('home_service_addresses');
        Schema::dropIfExists('home_service_provider_availability');
        Schema::dropIfExists('home_service_provider_services');
        Schema::dropIfExists('home_service_providers');
        Schema::dropIfExists('home_services');
        Schema::dropIfExists('home_service_categories');
    }
};
