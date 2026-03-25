<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::create('search_tags', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->morphs('taggable'); // polymorphic relationship (automatically creates index)
            $table->text('tags'); // searchable keywords
            $table->timestamps();

            // SQLite used in tests does not support fulltext index creation via schema grammar.
            if ($driver !== 'sqlite') {
                $table->fullText('tags'); // for full-text search
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_tags');
    }
};
