<?php

namespace App\Notifications;

use App\Models\HomeServiceBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class HomeServiceBookedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(private readonly HomeServiceBooking $booking)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->fresh(['user', 'service', 'provider.user', 'address.city']);
        $serviceName = $booking->service?->name ?? 'Home service';
        $providerName = $booking->provider?->user?->name;
        $serviceDate = $booking->service_date?->format('Y-m-d') ?? '-';
        $serviceTime = substr((string) $booking->service_time, 0, 5);
        $address = collect([
            $booking->address?->line1,
            $booking->address?->city?->name,
            $booking->address?->pincode,
        ])->filter()->implode(', ');

        $intro = (int) ($notifiable->id ?? 0) === (int) $booking->user_id
            ? 'Your home service booking has been confirmed successfully.'
            : 'A new home service booking has been assigned successfully.';

        $mail = (new MailMessage)
            ->subject('Home Service Booked: ' . $booking->booking_number)
            ->greeting('Hello ' . ($notifiable->name ?? 'there') . ',')
            ->line($intro)
            ->line('Booking No: ' . $booking->booking_number)
            ->line('Service: ' . $serviceName)
            ->line('Date: ' . $serviceDate)
            ->line('Time: ' . $serviceTime)
            ->line('Payment Method: ' . strtoupper((string) ($booking->payment_method ?? HomeServiceBooking::PAYMENT_METHOD_COD)))
            ->line('Amount: ₹' . number_format((float) ($booking->total_amount ?? 0), 2));

        if ($providerName) {
            $mail->line('Provider: ' . $providerName);
        } else {
            $mail->line('Provider assignment is currently pending.');
        }

        if ($address !== '') {
            $mail->line('Address: ' . $address);
        }

        return $mail->line('Thank you for choosing Hello Doctors.');
    }
}
