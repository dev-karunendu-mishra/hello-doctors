<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HomeServiceAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'contact_name',
        'contact_phone',
        'line1',
        'line2',
        'landmark',
        'city_id',
        'pincode',
        'latitude',
        'longitude',
        'is_default',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(HomeServiceBooking::class, 'address_id');
    }
}
