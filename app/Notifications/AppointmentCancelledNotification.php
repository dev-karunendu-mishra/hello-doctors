<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class AppointmentCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        private readonly Appointment $appointment,
        private readonly ?string $reason = null,
        private readonly string $actor = 'system'
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment->fresh(['patient', 'doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user']);
        $doctorName = $appointment->doctorHospitalClinic?->doctorProfile?->user?->name ?? 'Doctor';

        $mail = (new MailMessage)
            ->subject('Appointment Cancelled: ' . $appointment->appointment_number)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('An appointment has been cancelled by ' . $this->actor . '.')
            ->line('Appointment No: ' . $appointment->appointment_number)
            ->line('Doctor: ' . $doctorName)
            ->line('Date: ' . $appointment->appointment_date->format('Y-m-d'))
            ->line('Time: ' . substr((string) $appointment->appointment_time, 0, 5));

        if ($this->reason) {
            $mail->line('Reason: ' . $this->reason);
        }

        return $mail;
    }
}
