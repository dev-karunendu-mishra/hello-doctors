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
            $table->dropForeign(['patient_id']);
            $table->foreignId('patient_id')->nullable()->change();
            $table->foreign('patient_id')->references('id')->on('users')->nullOnDelete();

            $table->boolean('is_guest')->default(false)->after('patient_id')->index();
            $table->string('guest_name')->nullable()->after('is_guest');
            $table->string('guest_email')->nullable()->after('guest_name')->index();
            $table->string('guest_phone', 20)->nullable()->after('guest_email')->index();
            $table->string('guest_access_token_hash')->nullable()->after('guest_phone');
            $table->timestamp('guest_token_expires_at')->nullable()->after('guest_access_token_hash');
            $table->timestamp('guest_cancel_verified_at')->nullable()->after('guest_token_expires_at');
        });

        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['address_id']);

            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('address_id')->nullable()->change();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('address_id')->references('id')->on('home_service_addresses')->nullOnDelete();

            $table->boolean('is_guest')->default(false)->after('user_id')->index();
            $table->string('guest_name')->nullable()->after('is_guest');
            $table->string('guest_email')->nullable()->after('guest_name')->index();
            $table->string('guest_phone', 20)->nullable()->after('guest_email')->index();
            $table->string('guest_access_token_hash')->nullable()->after('guest_phone');
            $table->timestamp('guest_token_expires_at')->nullable()->after('guest_access_token_hash');
            $table->timestamp('guest_cancel_verified_at')->nullable()->after('guest_token_expires_at');

            $table->string('guest_line1')->nullable()->after('address_id');
            $table->string('guest_line2')->nullable()->after('guest_line1');
            $table->string('guest_landmark')->nullable()->after('guest_line2');
            $table->foreignId('guest_city_id')->nullable()->after('guest_landmark')->constrained('cities')->nullOnDelete();
            $table->string('guest_pincode', 10)->nullable()->after('guest_city_id');
            $table->decimal('guest_latitude', 10, 7)->nullable()->after('guest_pincode');
            $table->decimal('guest_longitude', 10, 7)->nullable()->after('guest_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_service_bookings', function (Blueprint $table) {
            $table->dropForeign(['guest_city_id']);
            $table->dropColumn([
                'is_guest',
                'guest_name',
                'guest_email',
                'guest_phone',
                'guest_access_token_hash',
                'guest_token_expires_at',
                'guest_cancel_verified_at',
                'guest_line1',
                'guest_line2',
                'guest_landmark',
                'guest_city_id',
                'guest_pincode',
                'guest_latitude',
                'guest_longitude',
            ]);

            $table->dropForeign(['user_id']);
            $table->dropForeign(['address_id']);

            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreignId('address_id')->nullable(false)->change();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('address_id')->references('id')->on('home_service_addresses')->cascadeOnDelete();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'is_guest',
                'guest_name',
                'guest_email',
                'guest_phone',
                'guest_access_token_hash',
                'guest_token_expires_at',
                'guest_cancel_verified_at',
            ]);

            $table->dropForeign(['patient_id']);
            $table->foreignId('patient_id')->nullable(false)->change();
            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
