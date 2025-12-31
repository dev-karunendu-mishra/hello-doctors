<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_tags', function (Blueprint $table) {
            $table->id();
            $table->morphs('taggable'); // polymorphic relationship (automatically creates index)
            $table->text('tags'); // searchable keywords
            $table->timestamps();

            $table->fullText('tags'); // for full-text search
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_tags');
    }
};
