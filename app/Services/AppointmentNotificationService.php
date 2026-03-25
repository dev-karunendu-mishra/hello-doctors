<?php

namespace App\Services;

use App\Models\Appointment;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Notifications\AppointmentCompletedNotification;

class AppointmentNotificationService
{
    public function __construct(private readonly SmsNotificationService $sms)
    {
    }

    public function sendBookingNotifications(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctorHospitalClinic.doctorProfile.user']);

        $patient = $appointment->patient;
        $doctorUser = $appointment->doctorHospitalClinic?->doctorProfile?->user;

        if ($patient) {
            $patient->notify(new AppointmentBookedNotification($appointment));
            $this->sms->send($patient->phone, sprintf(
                'Appointment %s booked for %s %s.',
                $appointment->appointment_number,
                $appointment->appointment_date->format('Y-m-d'),
                substr((string) $appointment->appointment_time, 0, 5)
            ));
        }

        if ($doctorUser) {
            $doctorUser->notify(new AppointmentBookedNotification($appointment));
            $this->sms->send($doctorUser->phone, sprintf(
                'New appointment %s booked.',
                $appointment->appointment_number
            ));
        }
    }

    public function sendCancellationNotifications(Appointment $appointment, ?string $reason = null, string $actor = 'system'): void
    {
        $appointment->loadMissing(['patient', 'doctorHospitalClinic.doctorProfile.user']);

        $patient = $appointment->patient;
        $doctorUser = $appointment->doctorHospitalClinic?->doctorProfile?->user;

        if ($patient) {
            $patient->notify(new AppointmentCancelledNotification($appointment, $reason, $actor));
            $this->sms->send($patient->phone, sprintf(
                'Appointment %s cancelled.',
                $appointment->appointment_number
            ));
        }

        if ($doctorUser) {
            $doctorUser->notify(new AppointmentCancelledNotification($appointment, $reason, $actor));
            $this->sms->send($doctorUser->phone, sprintf(
                'Appointment %s cancelled.',
                $appointment->appointment_number
            ));
        }
    }

    public function sendCompletionNotifications(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctorHospitalClinic.doctorProfile.user']);

        $patient = $appointment->patient;
        $doctorUser = $appointment->doctorHospitalClinic?->doctorProfile?->user;

        if ($patient) {
            $patient->notify(new AppointmentCompletedNotification($appointment));
            $this->sms->send($patient->phone, sprintf(
                'Appointment %s marked completed.',
                $appointment->appointment_number
            ));
        }

        if ($doctorUser) {
            $doctorUser->notify(new AppointmentCompletedNotification($appointment));
            $this->sms->send($doctorUser->phone, sprintf(
                'Appointment %s marked completed.',
                $appointment->appointment_number
            ));
        }
    }
}
