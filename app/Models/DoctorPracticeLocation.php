<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DoctorPracticeLocation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'doctor_profile_id',
        'clinic_id',
        'address_id',
        'display_name',
        'consultation_fee',
        'contact_phone',
        'contact_email',
        'is_primary',
        'is_active',
    ];

    protected $casts = [
        'consultation_fee' => 'decimal:2',
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function doctorProfile(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_profile_id');
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'address_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorPracticeSchedule::class, 'doctor_practice_location_id');
    }

    public function getResolvedConsultationFeeAttribute(): float
    {
        return (float) ($this->consultation_fee ?? $this->doctorProfile?->consultation_fee ?? 0);
    }

    public function getResolvedContactPhoneAttribute(): ?string
    {
        return $this->contact_phone ?: $this->clinic?->phone;
    }

    public function getResolvedContactEmailAttribute(): ?string
    {
        return $this->contact_email ?: $this->clinic?->email;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
