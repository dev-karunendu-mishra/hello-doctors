<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('payment_method')->default('cod')->after('payment_status');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('payment_amount');
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->string('payment_method')->default('cod')->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'discount_amount']);
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_method']);
        });
    }
};
