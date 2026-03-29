<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','doctor','patient','home_service_provider') DEFAULT 'patient'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','doctor','patient') DEFAULT 'patient'");
    }
};
