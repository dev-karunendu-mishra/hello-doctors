<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'abha_number',
            'abha_address',
            'abha_status',
            'abha_reference_id',
            'abha_verified_at',
            'abha_last_synced_at',
            'abha_payload',
        ];

        $existingColumns = array_values(array_filter($columns, fn (string $column) => Schema::hasColumn('users', $column)));

        if ($existingColumns === []) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($existingColumns) {
            $table->dropColumn($existingColumns);
        });
    }

    public function down(): void
    {
        $missingColumns = [
            'abha_number' => !Schema::hasColumn('users', 'abha_number'),
            'abha_address' => !Schema::hasColumn('users', 'abha_address'),
            'abha_status' => !Schema::hasColumn('users', 'abha_status'),
            'abha_reference_id' => !Schema::hasColumn('users', 'abha_reference_id'),
            'abha_verified_at' => !Schema::hasColumn('users', 'abha_verified_at'),
            'abha_last_synced_at' => !Schema::hasColumn('users', 'abha_last_synced_at'),
            'abha_payload' => !Schema::hasColumn('users', 'abha_payload'),
        ];

        if (!in_array(true, $missingColumns, true)) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($missingColumns) {
            if ($missingColumns['abha_number']) {
                $table->string('abha_number')->nullable()->after('license_number');
            }

            if ($missingColumns['abha_address']) {
                $table->string('abha_address')->nullable()->after('abha_number');
            }

            if ($missingColumns['abha_status']) {
                $table->string('abha_status')->default('not_linked')->after('abha_address');
            }

            if ($missingColumns['abha_reference_id']) {
                $table->string('abha_reference_id')->nullable()->after('abha_status');
            }

            if ($missingColumns['abha_verified_at']) {
                $table->timestamp('abha_verified_at')->nullable()->after('abha_reference_id');
            }

            if ($missingColumns['abha_last_synced_at']) {
                $table->timestamp('abha_last_synced_at')->nullable()->after('abha_verified_at');
            }

            if ($missingColumns['abha_payload']) {
                $table->json('abha_payload')->nullable()->after('abha_last_synced_at');
            }
        });
    }
};
