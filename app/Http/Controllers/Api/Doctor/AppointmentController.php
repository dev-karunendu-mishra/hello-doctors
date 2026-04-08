<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\AppointmentNotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentNotificationService $appointmentNotifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $doctorProfile = Auth::user()?->doctorProfile;
        abort_unless($doctorProfile, 422, 'Doctor profile is missing.');

        $request->validate([
            'clinic_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:pending,confirmed,completed,cancelled,no-show'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Appointment::query()
            ->with([
                'patient:id,name,email,phone',
                'doctorHospitalClinic.city',
                'doctorHospitalClinic.doctorProfile.user:id,name,email',
                'doctorPracticeLocation.address.cityRecord',
                'doctorPracticeLocation.clinic',
                'doctorPracticeLocation.doctorProfile.user:id,name,email',
                'doctorPracticeLocation.doctorProfile.specialty:id,name',
            ])
            ->where(function (Builder $query) use ($doctorProfile) {
                $query->whereHas('doctorPracticeLocation', function (Builder $inner) use ($doctorProfile) {
                    $inner->where('doctor_profile_id', $doctorProfile->id);
                })->orWhereHas('doctorHospitalClinic', function (Builder $inner) use ($doctorProfile) {
                    $inner->where('doctor_profile_id', $doctorProfile->id);
                });
            })
            ->orderBy('appointment_date')
            ->orderBy('appointment_time');

        if ($request->filled('clinic_id')) {
            $this->applyClinicFilter($query, $request->integer('clinic_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->date('date')->toDateString());
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('appointment_date', [
                $request->date('date_from')->toDateString(),
                $request->date('date_to')->toDateString(),
            ]);
        }

        $appointments = $query->paginate(20);
        $appointments->getCollection()->transform(fn(Appointment $appointment) => $appointment->ensureDisplayRelations());

        return response()->json([
            'data' => $appointments,
        ]);
    }

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $doctorProfile = Auth::user()?->doctorProfile;
        abort_unless($doctorProfile, 422, 'Doctor profile is missing.');

        $appointment->loadMissing([
            'doctorHospitalClinic',
            'doctorPracticeLocation',
        ]);

        $resolvedDoctorProfileId = (int) (
            $appointment->doctorPracticeLocation?->doctor_profile_id
            ?: $appointment->doctorHospitalClinic?->doctor_profile_id
        );

        abort_unless(
            $resolvedDoctorProfileId === (int) $doctorProfile->id,
            403,
            'Unauthorized appointment access.'
        );

        $validated = $request->validate([
            'status' => ['required', 'in:confirmed,completed,cancelled,no-show'],
            'cancellation_reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validated['status'] === 'cancelled' && empty($validated['cancellation_reason'])) {
            return response()->json([
                'message' => 'cancellation_reason is required when status is cancelled.',
            ], 422);
        }

        $update = [
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? $appointment->notes,
        ];

        if ($validated['status'] === 'confirmed') {
            $update['confirmed_at'] = now();
        }

        if ($validated['status'] === 'completed' || $validated['status'] === 'no-show') {
            $update['completed_at'] = now();
        }

        if ($validated['status'] === 'cancelled') {
            $update['cancelled_at'] = now();
            $update['cancellation_reason'] = $validated['cancellation_reason'];
        }

        $appointment->update($update);

        if ($validated['status'] === 'cancelled') {
            $this->appointmentNotifications->sendCancellationNotifications(
                $appointment,
                $validated['cancellation_reason'] ?? null,
                'doctor'
            );
        }

        if ($validated['status'] === 'completed') {
            $this->appointmentNotifications->sendCompletionNotifications($appointment);
        }

        $updatedAppointment = $appointment->fresh([
            'patient:id,name,email,phone',
            'doctorHospitalClinic.city',
            'doctorHospitalClinic.doctorProfile.user:id,name,email',
            'doctorPracticeLocation.address.cityRecord',
            'doctorPracticeLocation.clinic',
            'doctorPracticeLocation.doctorProfile.user:id,name,email',
            'doctorPracticeLocation.doctorProfile.specialty:id,name',
        ]);

        return response()->json([
            'message' => 'Appointment status updated successfully.',
            'data' => $updatedAppointment?->ensureDisplayRelations(),
        ]);
    }

    private function applyClinicFilter(Builder $query, int $clinicIdentifier): void
    {
        $query->where(function (Builder $inner) use ($clinicIdentifier) {
            $inner->where('doctor_practice_location_id', $clinicIdentifier)
                ->orWhere('doctor_hospital_clinic_id', $clinicIdentifier)
                ->orWhereHas('doctorPracticeLocation.address', function (Builder $addressQuery) use ($clinicIdentifier) {
                    $addressQuery->where('meta->legacy_source', 'doctor_hospital_clinics')
                        ->where('meta->legacy_id', $clinicIdentifier);
                });
        });
    }
}
