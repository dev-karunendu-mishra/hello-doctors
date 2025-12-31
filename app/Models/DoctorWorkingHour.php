<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorWorkingHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_profile_id',
        'city_id',
        'timing_text',
        'day_of_week',
        'opening_time',
        'closing_time',
        'is_available',
    ];

    protected $casts = [
        'opening_time' => 'datetime:H:i',
        'closing_time' => 'datetime:H:i',
        'is_available' => 'boolean',
    ];

    /**
     * Get the doctor profile
     */
    public function doctorProfile(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class);
    }

    /**
     * Get the city
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
