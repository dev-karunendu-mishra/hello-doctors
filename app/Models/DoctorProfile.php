<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class DoctorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialization_id',
        'license_number',
        'qualification',
        'experience_years',
        'consultation_fee',
        'bio',
        'profile_image',
        'website',
        'is_verified',
        'is_available_online',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'consultation_fee' => 'decimal:2',
        'is_verified' => 'boolean',
        'is_available_online' => 'boolean',
    ];

    protected $appends = ['profile_image_url'];

    /**
     * Get the user that owns the doctor profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the specialty of the doctor
     */
    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class, 'specialization_id');
    }

    /**
     * Get cities where doctor practices
     */
    public function cities(): BelongsToMany
    {
        return $this->belongsToMany(City::class, 'doctor_cities')
            ->withPivot('address', 'landmarks', 'latitude', 'longitude')
            ->withTimestamps();
    }

    /**
     * Get working hours
     */
    public function workingHours(): HasMany
    {
        return $this->hasMany(DoctorWorkingHour::class);
    }

    /**
     * Get search tags
     */
    public function searchTag(): MorphOne
    {
        return $this->morphOne(SearchTag::class, 'taggable');
    }

    /**
     * Get profile image URL
     */
    public function getProfileImageUrlAttribute(): ?string
    {
        if (!$this->profile_image) {
            return null;
        }

        // If it's already a full URL
        if (filter_var($this->profile_image, FILTER_VALIDATE_URL)) {
            return $this->profile_image;
        }

        // If path starts with 'images/' (public folder)
        if (str_starts_with($this->profile_image, 'images/')) {
            return asset($this->profile_image);
        }

        // Otherwise use Laravel storage
        return Storage::disk('public')->url($this->profile_image);
    }

    /**
     * Scope to get only verified doctors
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope to get only active doctors
     */
    public function scopeActive($query)
    {
        return $query->whereHas('user', function ($q) {
            $q->where('is_active', true);
        });
    }

    /**
     * Scope to filter by city
     */
    public function scopeByCity($query, $cityId)
    {
        return $query->whereHas('cities', function ($q) use ($cityId) {
            $q->where('cities.id', $cityId);
        });
    }

    /**
     * Scope to filter by specialty
     */
    public function scopeBySpecialty($query, $specialtyId)
    {
        return $query->where('specialization_id', $specialtyId);
    }
}
