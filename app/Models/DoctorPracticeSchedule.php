<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorPracticeSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_practice_location_id',
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
        'slot_duration_minutes' => 'integer',
        'max_appointments_per_slot' => 'integer',
        'is_available' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const DAYS_OF_WEEK = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    public function practiceLocation(): BelongsTo
    {
        return $this->belongsTo(DoctorPracticeLocation::class, 'doctor_practice_location_id');
    }

    public function getDayName(): string
    {
        return self::DAYS_OF_WEEK[$this->day_of_week] ?? 'Unknown';
    }

    public function hasBreakTime(): bool
    {
        return $this->break_start_time !== null && $this->break_end_time !== null;
    }

    public function isValidSchedule(): bool
    {
        if (!$this->opening_time || !$this->closing_time) {
            return false;
        }

        $opening = Carbon::parse($this->opening_time);
        $closing = Carbon::parse($this->closing_time);

        if ($opening->greaterThanOrEqualTo($closing)) {
            return false;
        }

        if ($this->hasBreakTime()) {
            $breakStart = Carbon::parse($this->break_start_time);
            $breakEnd = Carbon::parse($this->break_end_time);

            if ($breakStart->lessThan($opening) || $breakEnd->greaterThan($closing)) {
                return false;
            }

            if ($breakStart->greaterThanOrEqualTo($breakEnd)) {
                return false;
            }

            if ($breakEnd->greaterThanOrEqualTo($closing)) {
                return false;
            }
        }

        return true;
    }

    public function getWorkingMinutes(): int
    {
        if (!$this->is_available || !$this->opening_time || !$this->closing_time) {
            return 0;
        }

        $opening = Carbon::parse($this->opening_time);
        $closing = Carbon::parse($this->closing_time);
        $totalMinutes = $closing->diffInMinutes($opening);

        if ($this->hasBreakTime()) {
            $breakStart = Carbon::parse($this->break_start_time);
            $breakEnd = Carbon::parse($this->break_end_time);
            $totalMinutes -= $breakEnd->diffInMinutes($breakStart);
        }

        return $totalMinutes;
    }

    public function getExpectedSlotCount(): int
    {
        if (!$this->slot_duration_minutes || $this->slot_duration_minutes <= 0) {
            return 0;
        }

        return (int) ceil($this->getWorkingMinutes() / $this->slot_duration_minutes);
    }

    public function scopeForDay($query, int $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
