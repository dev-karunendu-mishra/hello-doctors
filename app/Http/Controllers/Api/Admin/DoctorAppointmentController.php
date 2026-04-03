<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorAppointmentController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $validStatuses = 'pending,confirmed,completed,cancelled,no-show';
        $validTypes    = 'in-person,online,home-visit';

        $request->validate([
            'doctor_id'      => ['nullable', 'integer', 'exists:users,id'],
            'clinic_id'      => ['nullable', 'integer', 'exists:doctor_hospital_clinics,id'],
            'status'         => ['nullable', 'array'],
            'status.*'       => ['in:' . $validStatuses],
            'type'           => ['nullable', 'array'],
            'type.*'         => ['in:' . $validTypes],
            'payment_status' => ['nullable', 'array'],
            'payment_status.*' => ['in:pending,paid,failed,refunded'],
            'date'           => ['nullable', 'date'],
            'date_from'      => ['nullable', 'date'],
            'date_to'        => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort_by'        => ['nullable', 'in:appointment_date,appointment_number'],
            'sort_dir'       => ['nullable', 'in:asc,desc'],
        ]);

        $sortBy  = $request->input('sort_by', 'appointment_date');
        $sortDir = $request->input('sort_dir', 'desc');

        $query = Appointment::query()
            ->with(['patient:id,name,email,phone', 'doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user:id,name,email'])
            ->orderBy($sortBy, $sortDir)
            ->orderBy('appointment_time', $sortDir);

        if ($request->filled('doctor_id')) {
            $query->whereHas('doctorHospitalClinic.doctorProfile', function ($q) use ($request) {
                $q->where('user_id', $request->integer('doctor_id'));
            });
        }

        if ($request->filled('clinic_id')) {
            $query->where('doctor_hospital_clinic_id', $request->integer('clinic_id'));
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

        return response()->json([
            'data' => $query->paginate(20),
        ]);
    }

    public function index(Request $request, User $doctor): JsonResponse
    {
        abort_unless($doctor->isDoctor(), 422, 'Selected user is not a doctor.');
        abort_unless($doctor->doctorProfile, 422, 'Doctor profile is missing.');

        $request->validate([
            'clinic_id' => ['nullable', 'integer', 'exists:doctor_hospital_clinics,id'],
            'status' => ['nullable', 'in:pending,confirmed,completed,cancelled,no-show'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Appointment::query()
            ->with(['patient:id,name,email,phone', 'doctorHospitalClinic.city'])
            ->whereHas('doctorHospitalClinic', function ($q) use ($doctor) {
                $q->where('doctor_profile_id', $doctor->doctorProfile->id);
            })
            ->orderBy('appointment_date')
            ->orderBy('appointment_time');

        if ($request->filled('clinic_id')) {
            $query->where('doctor_hospital_clinic_id', $request->integer('clinic_id'));
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

        return response()->json([
            'data' => $query->paginate(20),
        ]);
    }
}
