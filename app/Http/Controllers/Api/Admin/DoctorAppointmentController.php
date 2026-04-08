<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorAppointmentController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $validStatuses = 'pending,confirmed,completed,cancelled,no-show';
        $validTypes = 'in-person,online,home-visit';

        $request->validate([
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'clinic_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'array'],
            'status.*' => ['in:' . $validStatuses],
            'type' => ['nullable', 'array'],
            'type.*' => ['in:' . $validTypes],
            'payment_status' => ['nullable', 'array'],
            'payment_status.*' => ['in:pending,paid,failed,refunded'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort_by' => ['nullable', 'in:appointment_date,appointment_number'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $sortBy = $request->input('sort_by', 'appointment_date');
        $sortDir = $request->input('sort_dir', 'desc');

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
            ->orderBy($sortBy, $sortDir)
            ->orderBy('appointment_time', $sortDir);

        if ($request->filled('doctor_id')) {
            $doctorUserId = $request->integer('doctor_id');

            $query->where(function (Builder $inner) use ($doctorUserId) {
                $inner->whereHas('doctorPracticeLocation.doctorProfile', function (Builder $query) use ($doctorUserId) {
                    $query->where('user_id', $doctorUserId);
                })->orWhereHas('doctorHospitalClinic.doctorProfile', function (Builder $query) use ($doctorUserId) {
                    $query->where('user_id', $doctorUserId);
                });
            });
        }

        if ($request->filled('clinic_id')) {
            $this->applyClinicFilter($query, $request->integer('clinic_id'));
        }

        if ($request->filled('status')) {
            $query->whereIn('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->whereIn('consultation_type', $request->input('type'));
        }

        if ($request->filled('payment_status')) {
            $query->whereIn('payment_status', $request->input('payment_status'));
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

    public function index(Request $request, User $doctor): JsonResponse
    {
        abort_unless($doctor->isDoctor(), 422, 'Selected user is not a doctor.');
        abort_unless($doctor->doctorProfile, 422, 'Doctor profile is missing.');

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
            ->where(function (Builder $query) use ($doctor) {
                $query->whereHas('doctorPracticeLocation', function (Builder $inner) use ($doctor) {
                    $inner->where('doctor_profile_id', $doctor->doctorProfile->id);
                })->orWhereHas('doctorHospitalClinic', function (Builder $inner) use ($doctor) {
                    $inner->where('doctor_profile_id', $doctor->doctorProfile->id);
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
