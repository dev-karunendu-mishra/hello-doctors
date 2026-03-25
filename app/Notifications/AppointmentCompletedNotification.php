<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Appointment $appointment)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment->fresh(['patient', 'doctorHospitalClinic.doctorProfile.user']);

        return (new MailMessage)
            ->subject('Appointment Completed: ' . $appointment->appointment_number)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('The appointment has been marked as completed.')
            ->line('Appointment No: ' . $appointment->appointment_number)
            ->line('Date: ' . $appointment->appointment_date->format('Y-m-d'))
            ->line('Time: ' . substr((string) $appointment->appointment_time, 0, 5));
    }
}
