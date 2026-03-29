<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeServiceProviderAvailability extends Model
{
    use HasFactory;

    protected $table = 'home_service_provider_availability';

    protected $fillable = [
        'provider_id',
        'day_of_week',
        'opening_time',
        'closing_time',
        'break_start_time',
        'break_end_time',
        'slot_duration_minutes',
        'max_bookings_per_slot',
        'is_available',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'slot_duration_minutes' => 'integer',
        'max_bookings_per_slot' => 'integer',
        'is_available' => 'boolean',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(HomeServiceProvider::class, 'provider_id');
    }
}
