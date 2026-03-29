<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorHospitalClinic extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'doctor_hospital_clinics';

    protected $fillable = [
        'doctor_profile_id',
        'hospital_clinic_name',
        'address',
        'latitude',
        'longitude',
        'landmarks',
        'city_id',
        'consultation_fee',
        'phone',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'consultation_fee' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the doctor profile that owns this clinic
     */
    public function doctorProfile(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_profile_id');
    }

    /**
     * Get the city where this clinic is located
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get all schedule slots for this clinic (day-wise)
     */
    public function scheduleSlots(): HasMany
    {
        return $this->hasMany(DoctorScheduleSlot::class, 'doctor_hospital_clinic_id');
    }

    /**
     * Get all appointments booked at this clinic
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_hospital_clinic_id');
    }

    /**
     * Get schedule for a specific day of week (0-6, where 0=Sunday)
     */
    public function getDaySchedule(int $dayOfWeek): ?DoctorScheduleSlot
    {
        return $this->scheduleSlots()
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->first();
    }

    /**
     * Generate available time slots for a given date
     * Returns array of available time slots with booking count
     */
    public function getAvailableSlotsForDate(\DateTime $date): array
    {
        $dayOfWeek = (int) $date->format('w'); // 0=Sunday, 6=Saturday
        
        $schedule = $this->getDaySchedule($dayOfWeek);
        if (!$schedule || !$schedule->is_available) {
            return [];
        }

        $slots = [];
        $currentTime = \Carbon\Carbon::parse($schedule->opening_time);
        $closingTime = \Carbon\Carbon::parse($schedule->closing_time);
        $breakStart = $schedule->break_start_time ? \Carbon\Carbon::parse($schedule->break_start_time) : null;
        $breakEnd = $schedule->break_end_time ? \Carbon\Carbon::parse($schedule->break_end_time) : null;
        $slotDuration = $schedule->slot_duration_minutes;

        while ($currentTime < $closingTime) {
            // Skip break times
            if ($breakStart && $currentTime >= $breakStart && $currentTime < $breakEnd) {
                $currentTime->addMinutes($slotDuration);
                continue;
            }

            $slotEndTime = clone $currentTime;
            $slotEndTime->addMinutes($slotDuration);

            // Don't create slot if it would end after closing time
            if ($slotEndTime > $closingTime) {
                break;
            }

            // Count existing appointments for this slot
            $bookingCount = $this->appointments()
                ->where('appointment_date', $date->format('Y-m-d'))
                ->where('appointment_time', $currentTime->format('H:i:00'))
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();

            // Add slot if we haven't reached max appointments per slot
            if ($bookingCount < $schedule->max_appointments_per_slot) {
                $slots[] = [
                    'time' => $currentTime->format('H:i'),
                    'bookings' => $bookingCount,
                    'available' => $bookingCount < $schedule->max_appointments_per_slot,
                ];
            }

            $currentTime->addMinutes($slotDuration);
        }

        return $slots;
    }

    /**
     * Check if a specific time slot is available for booking
     */
    public function isSlotAvailable(\DateTime $date, string $time): bool
    {
        $dayOfWeek = (int) $date->format('w');
        $schedule = $this->getDaySchedule($dayOfWeek);

        if (!$schedule) {
            return false;
        }

        $normalizedTime = \Carbon\Carbon::parse($time)->format('H:i:s');

        // Check max appointments for this slot
        $bookingCount = $this->appointments()
            ->where('appointment_date', $date->format('Y-m-d'))
            ->where('appointment_time', $normalizedTime)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        return $bookingCount < $schedule->max_appointments_per_slot;
    }

    /**
     * Get the consultation fee (with fallback to doctor's default)
     */
    public function getConsultationFee(): float
    {
        if ($this->consultation_fee) {
            return (float) $this->consultation_fee;
        }

        // Fallback to doctor's default fee
        return (float) ($this->doctorProfile->consultation_fee ?? 0);
    }

    /**
     * Scope: only active clinics
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: filter by city
     */
    public function scopeInCity($query, $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    /**
     * Scope: filter by doctor
     */
    public function scopeForDoctor($query, $doctorProfileId)
    {
        return $query->where('doctor_profile_id', $doctorProfileId);
    }
}
