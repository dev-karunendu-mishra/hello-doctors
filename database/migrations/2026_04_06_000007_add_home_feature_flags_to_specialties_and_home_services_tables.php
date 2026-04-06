<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('specialties', function (Blueprint $table) {
            $table->boolean('is_featured_on_home')->default(false)->index();
        });

        Schema::table('home_services', function (Blueprint $table) {
            $table->boolean('is_featured_on_home')->default(false)->index();
        });
    }

    public function down(): void
    {
        Schema::table('specialties', function (Blueprint $table) {
            $table->dropColumn('is_featured_on_home');
        });

        Schema::table('home_services', function (Blueprint $table) {
            $table->dropColumn('is_featured_on_home');
        });
    }
};
