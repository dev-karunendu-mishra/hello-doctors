<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorScheduleSlot extends Model
{
    use HasFactory;

    protected $table = 'doctor_schedule_slots';

    protected $fillable = [
        'doctor_hospital_clinic_id',
        'day_of_week',
        'opening_time',
        'closing_time',
        'break_start_time',
        'break_end_time',
        'slot_duration_minutes',
        'max_appointments_per_slot',
        'is_available',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_available' => 'boolean',
        'slot_duration_minutes' => 'integer',
        'max_appointments_per_slot' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Day of week names for reference
     */
    public const DAYS_OF_WEEK = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    /**
     * Get the clinic that owns this schedule slot
     */
    public function doctorHospitalClinic(): BelongsTo
    {
        return $this->belongsTo(DoctorHospitalClinic::class, 'doctor_hospital_clinic_id');
    }

    /**
     * Get the day name (e.g., "Monday")
     */
    public function getDayName(): string
    {
        return self::DAYS_OF_WEEK[$this->day_of_week] ?? 'Unknown';
    }

    /**
     * Check if break time is configured
     */
    public function hasBreakTime(): bool
    {
        return $this->break_start_time !== null && $this->break_end_time !== null;
    }

    /**
     * Validate schedule times
     */
    public function isValidSchedule(): bool
    {
        if (!$this->opening_time || !$this->closing_time) {
            return false;
        }

        $opening = \Carbon\Carbon::parse($this->opening_time);
        $closing = \Carbon\Carbon::parse($this->closing_time);

        if ($opening->greaterThanOrEqualTo($closing)) {
            return false;
        }

        // If break times are set, validate them
        if ($this->hasBreakTime()) {
            $breakStart = \Carbon\Carbon::parse($this->break_start_time);
            $breakEnd = \Carbon\Carbon::parse($this->break_end_time);

            // Break should be within opening hours
            if ($breakStart->lessThan($opening) || $breakEnd->greaterThan($closing)) {
                return false;
            }

            // Break start should be before break end
            if ($breakStart->greaterThanOrEqualTo($breakEnd)) {
                return false;
            }

            // Break should not end at or after closing time
            if ($breakEnd->greaterThanOrEqualTo($closing)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate total working minutes for the day (excluding breaks)
     */
    public function getWorkingMinutes(): int
    {
        if (!$this->is_available) {
            return 0;
        }

        $opening = \Carbon\Carbon::parse($this->opening_time);
        $closing = \Carbon\Carbon::parse($this->closing_time);

        $totalMinutes = $closing->diffInMinutes($opening);

        // Subtract break time if applicable
        if ($this->hasBreakTime()) {
            $breakStart = \Carbon\Carbon::parse($this->break_start_time);
            $breakEnd = \Carbon\Carbon::parse($this->break_end_time);
            $breakMinutes = $breakEnd->diffInMinutes($breakStart);
            $totalMinutes -= $breakMinutes;
        }

        return $totalMinutes;
    }

    /**
     * Calculate expected number of slots for the day
     */
    public function getExpectedSlotCount(): int
    {
        if (!$this->slot_duration_minutes || $this->slot_duration_minutes <= 0) {
            return 0;
        }

        return (int) ceil($this->getWorkingMinutes() / $this->slot_duration_minutes);
    }

    /**
     * Scope: filter by day of week
     */
    public function scopeForDay($query, int $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    /**
     * Scope: only available days
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Scope: for specific clinic
     */
    public function scopeForClinic($query, $clinicId)
    {
        return $query->where('doctor_hospital_clinic_id', $clinicId);
    }

    /**
     * Get the time range as string (e.g., "09:00 - 17:00")
     */
    public function getTimeRange(): string
    {
        $range = "{$this->opening_time} - {$this->closing_time}";

        if ($this->hasBreakTime()) {
            $range .= " (Break: {$this->break_start_time} - {$this->break_end_time})";
        }

        return $range;
    }
}
