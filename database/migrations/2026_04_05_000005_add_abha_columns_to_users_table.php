<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('abha_number')->nullable()->after('license_number');
            $table->string('abha_address')->nullable()->after('abha_number');
            $table->string('abha_status')->default('not_linked')->after('abha_address');
            $table->string('abha_reference_id')->nullable()->after('abha_status');
            $table->timestamp('abha_verified_at')->nullable()->after('abha_reference_id');
            $table->timestamp('abha_last_synced_at')->nullable()->after('abha_verified_at');
            $table->json('abha_payload')->nullable()->after('abha_last_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'abha_number',
                'abha_address',
                'abha_status',
                'abha_reference_id',
                'abha_verified_at',
                'abha_last_synced_at',
                'abha_payload',
            ]);
        });
    }
};
