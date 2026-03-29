<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HomeServiceProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider_type',
        'license_number',
        'experience_years',
        'city_id',
        'service_radius_km',
        'is_verified',
        'is_active',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'service_radius_km' => 'decimal:2',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function serviceLinks(): HasMany
    {
        return $this->hasMany(HomeServiceProviderService::class, 'provider_id');
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(HomeService::class, 'home_service_provider_services', 'provider_id', 'home_service_id')
            ->withPivot(['custom_price', 'is_active'])
            ->withTimestamps();
    }

    public function availability(): HasMany
    {
        return $this->hasMany(HomeServiceProviderAvailability::class, 'provider_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(HomeServiceBooking::class, 'provider_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function getDaySchedule(int $dayOfWeek): ?HomeServiceProviderAvailability
    {
        return $this->availability()
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->first();
    }

    public function supportsService(int $serviceId): bool
    {
        return $this->serviceLinks()
            ->where('home_service_id', $serviceId)
            ->where('is_active', true)
            ->exists();
    }

    public function getAvailableSlotsForDate($date, int $serviceId, int $durationMinutes = 30): array
    {
        $dateObj = $date instanceof Carbon ? $date : Carbon::parse($date);
        $schedule = $this->getDaySchedule((int) $dateObj->format('w'));

        if (!$schedule || !$this->supportsService($serviceId)) {
            return [];
        }

        $slots = [];
        $currentTime = Carbon::parse($schedule->opening_time);
        $closingTime = Carbon::parse($schedule->closing_time);
        $breakStart = $schedule->break_start_time ? Carbon::parse($schedule->break_start_time) : null;
        $breakEnd = $schedule->break_end_time ? Carbon::parse($schedule->break_end_time) : null;
        $stepMinutes = max((int) $schedule->slot_duration_minutes, 5);
        $effectiveDuration = max($durationMinutes, $stepMinutes);

        while ($currentTime < $closingTime) {
            if ($breakStart && $currentTime >= $breakStart && $currentTime < $breakEnd) {
                $currentTime->addMinutes($stepMinutes);
                continue;
            }

            $slotEndTime = (clone $currentTime)->addMinutes($effectiveDuration);
            if ($slotEndTime > $closingTime) {
                break;
            }

            $bookingCount = $this->bookings()
                ->whereDate('service_date', $dateObj->toDateString())
                ->where('service_time', $currentTime->format('H:i:s'))
                ->whereIn('status', [
                    HomeServiceBooking::STATUS_PENDING,
                    HomeServiceBooking::STATUS_ASSIGNED,
                    HomeServiceBooking::STATUS_CONFIRMED,
                    HomeServiceBooking::STATUS_IN_PROGRESS,
                ])
                ->count();

            if ($bookingCount < $schedule->max_bookings_per_slot) {
                $slots[] = [
                    'time' => $currentTime->format('H:i'),
                    'bookings' => $bookingCount,
                    'available' => true,
                ];
            }

            $currentTime->addMinutes($stepMinutes);
        }

        return $slots;
    }
}
