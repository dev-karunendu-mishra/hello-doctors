<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class HomeServiceBooking extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';

    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';
    public const PAYMENT_REFUNDED = 'refunded';

    public const PAYMENT_METHOD_ONLINE = 'online';
    public const PAYMENT_METHOD_COD = 'cod';

    protected $fillable = [
        'booking_number',
        'user_id',
        'home_service_id',
        'provider_id',
        'address_id',
        'unified_address_id',
        'service_address_snapshot',
        'service_date',
        'service_time',
        'duration_minutes',
        'price',
        'travel_fee',
        'discount_amount',
        'total_amount',
        'payment_status',
        'payment_method',
        'refund_amount',
        'refund_percentage',
        'refunded_at',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'razorpay_refund_id',
        'status',
        'special_instructions',
        'cancel_reason',
        'cancelled_at',
        'completed_at',
    ];

    protected $casts = [
        'service_date' => 'date',
        'service_address_snapshot' => 'array',
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
        'travel_fee' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (self $booking) {
            if (!$booking->booking_number) {
                $booking->booking_number = self::generateBookingNumber();
            }
        });

        static::updated(function (self $booking) {
            if ($booking->wasChanged('status')) {
                $booking->statusLogs()->create([
                    'old_status' => $booking->getOriginal('status'),
                    'new_status' => $booking->status,
                    'changed_by_user_id' => Auth::id(),
                ]);
            }
        });
    }

    public static function generateBookingNumber(): string
    {
        $year = now()->format('Y');
        $count = self::whereYear('created_at', $year)->count() + 1;

        return sprintf('HSB-%s-%06d', $year, $count);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(HomeService::class, 'home_service_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(HomeServiceProvider::class, 'provider_id');
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(HomeServiceAddress::class, 'address_id');
    }

    public function unifiedAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'unified_address_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(HomeServiceBookingStatusLog::class, 'booking_id');
    }

    public function scopeUpcoming($query)
    {
        return $query->whereDate('service_date', '>=', today())
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_ASSIGNED, self::STATUS_CONFIRMED, self::STATUS_IN_PROGRESS])
            ->orderBy('service_date')
            ->orderBy('service_time');
    }

    public function canBeCancelled(): bool
    {
        if (!in_array($this->status, [self::STATUS_PENDING, self::STATUS_ASSIGNED, self::STATUS_CONFIRMED], true)) {
            return false;
        }

        return now()->lt($this->service_date->copy()->setTimeFromTimeString($this->service_time));
    }
}
