<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('guest_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45)->index(); // IPv4 and IPv6
            $table->string('operation', 50)->index(); // 'booking_attempt', 'cancellation_init', etc.
            $table->string('email', 255)->nullable()->index();
            $table->string('phone', 20)->nullable()->index();
            $table->string('booking_type', 50)->nullable(); // 'appointment', 'home_service'
            $table->boolean('successful')->default(true);
            $table->string('error_reason', 255)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referrer', 500)->nullable();
            $table->timestamp('created_at')->nullable()->index();

            // Composite indexes for common queries
            $table->index(['ip_address', 'created_at']);
            $table->index(['email', 'created_at']);
            $table->index(['phone', 'created_at']);
            $table->index(['operation', 'ip_address', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_activity_logs');
    }
};
