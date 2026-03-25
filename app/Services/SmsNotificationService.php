<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SmsNotificationService
{
    public function send(?string $phone, string $message): void
    {
        if (!$phone) {
            return;
        }

        // Stub for SMS provider integration (Twilio, MSG91, etc.).
        Log::info('SMS notification queued', [
            'phone' => $phone,
            'message' => $message,
        ]);
    }
}
