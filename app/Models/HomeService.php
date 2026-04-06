<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HomeService extends Model
{
    use HasFactory;

    public const PRICE_FIXED = 'fixed';
    public const PRICE_HOURLY = 'hourly';
    public const PRICE_PACKAGE = 'package';

    protected $fillable = [
        'category_id',
        'code',
        'name',
        'description',
        'duration_minutes',
        'base_price',
        'price_type',
        'buffer_minutes',
        'requires_certification',
        'is_active',
        'is_featured_on_home',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'duration_minutes' => 'integer',
        'buffer_minutes' => 'integer',
        'requires_certification' => 'boolean',
        'is_active' => 'boolean',
        'is_featured_on_home' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(HomeServiceCategory::class, 'category_id');
    }

    public function providerLinks(): HasMany
    {
        return $this->hasMany(HomeServiceProviderService::class, 'home_service_id');
    }

    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(HomeServiceProvider::class, 'home_service_provider_services', 'home_service_id', 'provider_id')
            ->withPivot(['custom_price', 'is_active'])
            ->withTimestamps();
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(HomeServiceBooking::class, 'home_service_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
