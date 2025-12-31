<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SearchTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'taggable_type',
        'taggable_id',
        'tags',
    ];

    /**
     * Get the owning taggable model
     */
    public function taggable(): MorphTo
    {
        return $this->morphTo();
    }
}
