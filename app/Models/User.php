<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'specialization',
        'license_number',
        'abha_number',
        'abha_address',
        'abha_status',
        'abha_reference_id',
        'abha_verified_at',
        'abha_last_synced_at',
        'abha_payload',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'abha_verified_at' => 'datetime',
            'abha_last_synced_at' => 'datetime',
            'abha_payload' => 'array',
        ];
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user is doctor
     */
    public function isDoctor(): bool
    {
        return $this->role === 'doctor';
    }

    /**
     * Check if user is patient
     */
    public function isPatient(): bool
    {
        return $this->role === 'patient';
    }

    /**
     * Check if user is home service provider
     */
    public function isHomeServiceProvider(): bool
    {
        return $this->role === 'home_service_provider';
    }

    /**
     * Check if user has specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Get the doctor profile for the user
     */
    public function doctorProfile(): HasOne
    {
        return $this->hasOne(DoctorProfile::class);
    }

    /**
     * Get all appointments for this patient
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    /**
     * Get the home service provider profile for this user
     */
    public function homeServiceProviderProfile(): HasOne
    {
        return $this->hasOne(HomeServiceProvider::class, 'user_id');
    }

    /**
     * Get all home service addresses for this user
     */
    public function homeServiceAddresses(): HasMany
    {
        return $this->hasMany(HomeServiceAddress::class, 'user_id');
    }

    /**
     * Get all home service bookings for this user
     */
    public function homeServiceBookings(): HasMany
    {
        return $this->hasMany(HomeServiceBooking::class, 'user_id');
    }

    /**
     * Get upcoming appointments for this patient
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
     * Get past appointments for this patient
     */
    public function pastAppointments()
    {
        return $this->appointments()
            ->where('appointment_date', '<', today())
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time');
    }
}
