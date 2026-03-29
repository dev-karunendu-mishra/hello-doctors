<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeServiceBookingStatusLog extends Model
{
    use HasFactory;

    protected $table = 'home_service_booking_status_logs';

    protected $fillable = [
        'booking_id',
        'old_status',
        'new_status',
        'changed_by_user_id',
        'notes',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(HomeServiceBooking::class, 'booking_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
