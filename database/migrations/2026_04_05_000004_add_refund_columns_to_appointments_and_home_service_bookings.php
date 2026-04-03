<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->decimal('refund_amount', 10, 2)->default(0)->after('discount_amount');
            $table->unsignedTinyInteger('refund_percentage')->default(0)->after('refund_amount');
            $table->timestamp('refunded_at')->nullable()->after('refund_percentage');
            $table->string('razorpay_refund_id')->nullable()->after('razorpay_signature');
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->decimal('refund_amount', 10, 2)->default(0)->after('discount_amount');
            $table->unsignedTinyInteger('refund_percentage')->default(0)->after('refund_amount');
            $table->timestamp('refunded_at')->nullable()->after('completed_at');
            $table->string('razorpay_refund_id')->nullable()->after('razorpay_signature');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['refund_amount', 'refund_percentage', 'refunded_at', 'razorpay_refund_id']);
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->dropColumn(['refund_amount', 'refund_percentage', 'refunded_at', 'razorpay_refund_id']);
        });
    }
};
