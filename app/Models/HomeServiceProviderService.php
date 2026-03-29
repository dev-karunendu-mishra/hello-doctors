<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeServiceProviderService extends Model
{
    use HasFactory;

    protected $table = 'home_service_provider_services';

    protected $fillable = [
        'provider_id',
        'home_service_id',
        'custom_price',
        'is_active',
    ];

    protected $casts = [
        'custom_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(HomeServiceProvider::class, 'provider_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(HomeService::class, 'home_service_id');
    }
}
