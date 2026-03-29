<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DoctorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'slug',
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
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'consultation_fee' => 'decimal:2',
        'is_verified' => 'boolean',
        'is_available_online' => 'boolean',
    ];

    protected $appends = ['profile_image_url'];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($doctor) {
            if (empty($doctor->slug)) {
                $name = static::resolveDoctorNameForSlug($doctor);
                $doctor->slug = static::generateUniqueSlug($name);
            }
        });

        static::updating(function ($doctor) {
            if (empty($doctor->slug)) {
                $name = static::resolveDoctorNameForSlug($doctor);
                $doctor->slug = static::generateUniqueSlug($name, $doctor->id);
            }
        });
    }

    /**
     * Resolve a consistent name source for slug generation.
     */
    protected static function resolveDoctorNameForSlug(self $doctor): string
    {
        if ($doctor->relationLoaded('user') && $doctor->user) {
            return $doctor->user->name;
        }

        if ($doctor->user) {
            return $doctor->user->name;
        }

        if ($doctor->user_id) {
            $name = User::whereKey($doctor->user_id)->value('name');
            if (!empty($name)) {
                return $name;
            }
        }

        return 'doctor-' . ($doctor->id ?? Str::random(6));
    }

    /**
     * Generate a unique slug for the doctor
     */
    public static function generateUniqueSlug($name, $ignoreId = null)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (static::slugExists($slug, $ignoreId)) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        return $slug;
    }

    /**
     * Check if slug exists
     */
    protected static function slugExists($slug, $ignoreId = null)
    {
        $query = static::where('slug', $slug);
        
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        
        return $query->exists();
    }

    /**
     * Get the route key for the model
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }

    /**
     * Resolve route binding and support both slug and numeric id for admin URLs.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field !== null) {
            return $this->where($field, $value)->first();
        }

        $bySlug = $this->where('slug', $value)->first();
        if ($bySlug) {
            return $bySlug;
        }

        if (is_numeric($value)) {
            return $this->whereKey((int) $value)->first();
        }

        return null;
    }

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
     * Get hospital/clinics managed by this doctor
     */
    public function hospitalClinics(): HasMany
    {
        return $this->hasMany(DoctorHospitalClinic::class, 'doctor_profile_id');
    }

    /**
     * Get all appointments for this doctor across all clinics
     */
    public function appointments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Appointment::class,
            DoctorHospitalClinic::class,
            'doctor_profile_id',
            'doctor_hospital_clinic_id'
        );
    }

    /**
     * Get upcoming appointments
     */
    public function upcomingAppointments()
    {
        return $this->appointments()
            ->where('appointment_date', '>=', today())
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time');
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
