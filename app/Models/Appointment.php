<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'appointments';

    protected $fillable = [
        'appointment_number',
        'patient_id',
        'is_guest',
        'guest_name',
        'guest_email',
        'guest_phone',
        'guest_access_token_hash',
        'guest_token_expires_at',
        'guest_cancel_verified_at',
        'doctor_hospital_clinic_id',
        'appointment_date',
        'appointment_time',
        'status',
        'consultation_type',
        'reason_for_visit',
        'notes',
        'cancellation_reason',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
        'payment_status',
        'payment_method',
        'payment_amount',
        'discount_amount',
        'refund_amount',
        'refund_percentage',
        'refunded_at',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'razorpay_refund_id',
    ];

    protected $casts = [
        'is_guest' => 'boolean',
        'appointment_date' => 'date',
        'guest_token_expires_at' => 'datetime',
        'guest_cancel_verified_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'payment_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'refunded_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no-show';

    /**
     * Consultation type constants
     */
    public const CONSULTATION_IN_PERSON = 'in-person';
    public const CONSULTATION_ONLINE = 'online';
    public const CONSULTATION_PHONE = 'phone';

    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';
    public const PAYMENT_REFUNDED = 'refunded';

    public const PAYMENT_METHOD_ONLINE = 'online';
    public const PAYMENT_METHOD_COD = 'cod';

    /**
     * Get the patient (user) who booked this appointment
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor's clinic where appointment is scheduled
     */
    public function doctorHospitalClinic(): BelongsTo
    {
        return $this->belongsTo(DoctorHospitalClinic::class, 'doctor_hospital_clinic_id');
    }

    /**
     * Generate next appointment number in format APT-YYYY-XXXXXX
     */
    public static function generateAppointmentNumber(): string
    {
        $year = date('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('APT-%s-%06d', $year, $count);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate appointment number before creating
        static::creating(function ($model) {
            if (!$model->appointment_number) {
                $model->appointment_number = self::generateAppointmentNumber();
            }
        });
    }

    /**
     * Scope: Get upcoming appointments (in future)
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('appointment_date', '>=', today())
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_CONFIRMED])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time');
    }

    /**
     * Scope: Get past appointments
     */
    public function scopePast(Builder $query): Builder
    {
        return $query->where('appointment_date', '<', today())
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time');
    }

    /**
     * Scope: Get appointments for a specific date
     */
    public function scopeOnDate(Builder $query, $date): Builder
    {
        return $query->where('appointment_date', $date);
    }

    /**
     * Scope: Get appointments for a date range
     */
    public function scopeBetweenDates(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('appointment_date', [$startDate, $endDate]);
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Get confirmed or pending (active bookings)
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_CONFIRMED]);
    }

    /**
     * Scope: Get completed appointments
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope: Get cancelled appointments
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Check if appointment is in the future
     */
    public function isFuture(): bool
    {
        return $this->getAppointmentDateTime()->isFuture();
    }

    /**
     * Check if appointment is in the past
     */
    public function isPast(): bool
    {
        return !$this->isFuture();
    }

    /**
     * Mark appointment as confirmed
     */
    public function confirm(): bool
    {
        return $this->update([
            'status' => self::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Mark appointment as completed
     */
    public function complete(): bool
    {
        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark appointment as no-show
     */
    public function markNoShow(): bool
    {
        return $this->update([
            'status' => self::STATUS_NO_SHOW,
            'completed_at' => now(),
        ]);
    }

    /**
     * Cancel appointment with reason
     */
    public function cancel(string $reason = null): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancellation_reason' => $reason,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Check if appointment can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED]) && $this->isFuture();
    }

    /**
     * Get appointment datetime as a Carbon instance
     */
    public function getAppointmentDateTime()
    {
        return \Carbon\Carbon::parse(
            $this->appointment_date->format('Y-m-d') . ' ' . $this->appointment_time
        );
    }

    /**
     * Get formatted appointment time (e.g., "3:30 PM")
     */
    public function getFormattedTime(): string
    {
        return \Carbon\Carbon::parse($this->appointment_time)
            ->format('g:i A');
    }

    /**
     * Get formatted appointment date (e.g., "April 1, 2026")
     */
    public function getFormattedDate(): string
    {
        return $this->appointment_date->format('F j, Y');
    }

    /**
     * Get full appointment datetime formatted (e.g., "April 1, 2026 at 3:30 PM")
     */
    public function getFormattedDateTime(): string
    {
        return $this->getFormattedDate() . ' at ' . $this->getFormattedTime();
    }

    /**
     * Get status badge text
     */
    public function getStatusBadge(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_CONFIRMED => 'Confirmed',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_NO_SHOW => 'No Show',
            default => 'Unknown',
        };
    }

    /**
     * Get status color for UI (Tailwind or similar)
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'yellow',
            self::STATUS_CONFIRMED => 'green',
            self::STATUS_COMPLETED => 'blue',
            self::STATUS_CANCELLED => 'red',
            self::STATUS_NO_SHOW => 'gray',
            default => 'gray',
        };
    }
}
