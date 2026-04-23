<?php

namespace App\Http\Middleware;

use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GuestOperationRateLimiter
{
    public function __construct(private readonly RateLimiter $limiter)
    {
    }

    public function handle(Request $request, $next)
    {
        $ip = $request->ip();
        $operation = $this->getOperationName($request);

        // Different limits for different operations
        $limits = [
            'guest.data.appointments.store' => 3,// 3 booking attempts per 15 minutes
            'guest.data.home-service-bookings.store' => 3,
            'guest.data.cancellations.init' => 5,  // 5 cancellation initiations per 15 minutes
            'guest.data.cancellations.verify' => 10,  // 10 verification attempts per 15 minutes
            'guest.data.appointments.cancel' => 5,
            'guest.data.home-service-bookings.cancel' => 5,
        ];

        $maxAttempts = $limits[$operation] ?? 5;
        $decayMinutes = 15;

        $key = "guest_rate_limit:{$ip}:{$operation}";

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = $this->limiter->availableIn($key);

            return response()->json([
                'message' => "Too many {$operation} attempts. Please try again in {$retryAfter} seconds.",
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', $retryAfter);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        return $next($request);
    }

    private function getOperationName(Request $request): string
    {
        $routeName = $request->route()?->getName();

        return $routeName ?? 'unknown';
    }
}
