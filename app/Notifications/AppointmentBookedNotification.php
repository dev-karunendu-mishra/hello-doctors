<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentBookedNotification extends Notification
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
        $appointment = $this->appointment->fresh(['patient', 'doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user']);
        $doctorName = $appointment->doctorHospitalClinic?->doctorProfile?->user?->name ?? 'Doctor';
        $clinicName = $appointment->doctorHospitalClinic?->hospital_clinic_name ?? 'Clinic';

        return (new MailMessage)
            ->subject('Appointment Booked: ' . $appointment->appointment_number)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('An appointment has been booked successfully.')
            ->line('Appointment No: ' . $appointment->appointment_number)
            ->line('Doctor: ' . $doctorName)
            ->line('Clinic: ' . $clinicName)
            ->line('Date: ' . $appointment->appointment_date->format('Y-m-d'))
            ->line('Time: ' . substr((string) $appointment->appointment_time, 0, 5));
    }
}
