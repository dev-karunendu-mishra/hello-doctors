<?php

namespace App\Services;

use App\Models\HomeServiceBooking;
use App\Models\SiteSetting;
use App\Notifications\HomeServiceBookedNotification;
use Illuminate\Notifications\Notification;

class HomeServiceNotificationService
{
    public function __construct(private readonly SmsNotificationService $sms)
    {
    }

    public function sendBookingNotifications(HomeServiceBooking $booking): void
    {
        $booking->loadMissing(['user', 'service', 'provider.user', 'address.city']);

        $patient = $booking->user;
        $providerUser = $booking->provider?->user;

        if ($patient) {
            $this->sendEmailNotification($patient, new HomeServiceBookedNotification($booking));
            $this->sms->send($patient->phone, sprintf(
                'Home service %s booked for %s %s.',
                $booking->booking_number,
                $booking->service_date?->format('Y-m-d') ?? '-',
                substr((string) $booking->service_time, 0, 5)
            ));
        }

        if ($providerUser) {
            $this->sendEmailNotification($providerUser, new HomeServiceBookedNotification($booking));
            $this->sms->send($providerUser->phone, sprintf(
                'New home service booking %s assigned.',
                $booking->booking_number,
            ));
        }
    }

    private function sendEmailNotification(object $notifiable, Notification $notification): void
    {
        $mode = SiteSetting::get('email_delivery_mode', 'async');

        if ($mode === 'sync' && method_exists($notifiable, 'notifyNow')) {
            $notifiable->notifyNow($notification);
            return;
        }

        if (method_exists($notifiable, 'notify')) {
            $notifiable->notify($notification);
        }
    }
}
