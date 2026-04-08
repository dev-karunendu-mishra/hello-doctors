<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'addressable_type',
        'addressable_id',
        'label',
        'line1',
        'line2',
        'landmark',
        'city',
        'city_id',
        'state',
        'pincode',
        'latitude',
        'longitude',
        'is_primary',
        'meta',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_primary' => 'boolean',
        'meta' => 'array',
    ];

    public function addressable(): MorphTo
    {
        return $this->morphTo();
    }

    public function cityRecord(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function practiceLocations(): HasMany
    {
        return $this->hasMany(DoctorPracticeLocation::class, 'address_id');
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
