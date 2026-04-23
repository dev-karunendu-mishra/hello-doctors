<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GuestAbuseMonitorService
{
    /**
     * Check if an operation should be blocked due to abuse detection
     *
     * @param string $ip IP address
     * @param string $operation Operation type (e.g., 'booking_attempt', 'cancellation_init')
     * @param array $context Additional context (email, phone, etc.)
     * @return array ['blocked' => bool, 'reason' => string|null]
     */
    public function shouldBlock(string $ip, string $operation, array $context = []): array
    {
        $checks = [
            'ip_rate_limit' => $this->checkIpRateLimit($ip, $operation),
            'rapid_attempts' => $this->checkRapidAttempts($ip, $context),
            'suspicious_pattern' => $this->checkSuspiciousPattern($ip, $context),
        ];

        foreach ($checks as $checkName => $result) {
            if ($result['blocked']) {
                Log::warning("Guest abuse detected: {$checkName}", [
                    'ip' => $ip,
                    'operation' => $operation,
                    'context' => $context,
                    'reason' => $result['reason'],
                ]);

                return $result;
            }
        }

        return ['blocked' => false, 'reason' => null];
    }

    /**
     * Log a guest operation for monitoring and abuse detection
     *
     * @param string $ip IP address
     * @param string $operation Operation type
     * @param array $context Additional context
     * @param bool $successful Whether the operation was successful
     */
    public function logOperation(string $ip, string $operation, array $context = [], bool $successful = true): void
    {
        $key = "guest_operation:{$ip}:{$operation}";

        // Increment operation count for this IP+operation combo
        Cache::increment($key, 1, now()->addMinutes(15)->diffInMinutes(now()));

        try {
            DB::table('guest_activity_logs')->insert([
                'ip_address' => $ip,
                'operation' => $operation,
                'email' => $context['email'] ?? null,
                'phone' => $context['phone'] ?? null,
                'booking_type' => $context['booking_type'] ?? null,
                'successful' => $successful,
                'error_reason' => $context['error'] ?? null,
                'user_agent' => request()?->userAgent(),
                'referrer' => request()?->referrer(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log guest activity', [
                'error' => $e->getMessage(),
                'ip' => $ip,
            ]);
        }
    }

    /**
     * Check if IP has exceeded rate limit
     *
     * More restrictive than throttle middleware for sensitive operations
     * Allows 5 booking attempts per 15 minutes per IP
     * Allows 10 verification attempts per 15 minutes per IP
     */
    private function checkIpRateLimit(string $ip, string $operation): array
    {
        $limits = [
            'booking_attempt' => 5,
            'cancellation_init' => 10,
            'cancellation_verify' => 10,
        ];

        $limit = $limits[$operation] ?? 5;
        $key = "guest_ratelimit:{$ip}:{$operation}";
        $attempts = (int) Cache::get($key, 0);

        if ($attempts >= $limit) {
            return [
                'blocked' => true,
                'reason' => 'Too many attempts from your IP. Please try again later.',
            ];
        }

        return ['blocked' => false];
    }

    /**
     * Check for rapid sequential attempts (likely bot behavior)
     */
    private function checkRapidAttempts(string $ip, array $context): array
    {
        // Check if same IP made more than 3 attempts in last 2 minutes
        $recentAttempts = DB::table('guest_activity_logs')
            ->where('ip_address', $ip)
            ->where('created_at', '>', now()->subMinutes(2))
            ->count();

        if ($recentAttempts > 3) {
            return [
                'blocked' => true,
                'reason' => 'Multiple rapid requests detected. Please slow down and try again.',
            ];
        }

        return ['blocked' => false];
    }

    /**
     * Check for suspicious patterns (email/phone spam, enumeration attempts)
     */
    private function checkSuspiciousPattern(string $ip, array $context): array
    {
        $email = $context['email'] ?? null;
        $phone = $context['phone'] ?? null;

        // Check if same email/phone is being tested from multiple IPs rapidly
        if ($email) {
            $emailAttempts = DB::table('guest_activity_logs')
                ->where('email', $email)
                ->where('created_at', '>', now()->subMinutes(5))
                ->distinct('ip_address')
                ->count('ip_address');

            if ($emailAttempts > 5) {
                return [
                    'blocked' => true,
                    'reason' => 'This email is being tested from multiple locations. Please verify your access.',
                ];
            }
        }

        if ($phone) {
            $phoneAttempts = DB::table('guest_activity_logs')
                ->where('phone', $phone)
                ->where('created_at', '>', now()->subMinutes(5))
                ->distinct('ip_address')
                ->count('ip_address');

            if ($phoneAttempts > 5) {
                return [
                    'blocked' => true,
                    'reason' => 'This phone is being tested from multiple locations. Please verify your access.',
                ];
            }
        }

        return ['blocked' => false];
    }

    /**
     * Get abuse report for an IP
     */
    public function getIpReport(string $ip): array
    {
        $operations = DB::table('guest_activity_logs')
            ->where('ip_address', $ip)
            ->where('created_at', '>', now()->subDays(7))
            ->selectRaw('operation, COUNT(*) as attempts, SUM(CASE WHEN successful THEN 1 ELSE 0 END) as successful')
            ->groupBy('operation')
            ->get()
            ->keyBy('operation')
            ->toArray();

        $uniqueContacts = DB::table('guest_activity_logs')
            ->where('ip_address', $ip)
            ->where('created_at', '>', now()->subDays(7))
            ->selectRaw('COUNT(DISTINCT email) as unique_emails, COUNT(DISTINCT phone) as unique_phones')
            ->first();

        return [
            'ip' => $ip,
            'total_operations_7d' => collect($operations)->sum('attempts'),
            'operations' => $operations,
            'unique_contacts' => [
                'emails' => $uniqueContacts->unique_emails ?? 0,
                'phones' => $uniqueContacts->unique_phones ?? 0,
            ],
            'flagged' => collect($operations)->sum('attempts') > 50,
        ];
    }
}
