<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $doctorProfile = Auth::user()?->doctorProfile;
        abort_unless($doctorProfile, 422, 'Doctor profile is missing.');

        $request->validate([
            'clinic_id' => ['nullable', 'integer', 'exists:doctor_hospital_clinics,id'],
            'status' => ['nullable', 'in:pending,confirmed,completed,cancelled,no-show'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Appointment::query()
            ->with(['patient:id,name,email,phone', 'doctorHospitalClinic.city'])
            ->whereHas('doctorHospitalClinic', function ($q) use ($doctorProfile) {
                $q->where('doctor_profile_id', $doctorProfile->id);
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

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $doctorProfile = Auth::user()?->doctorProfile;
        abort_unless($doctorProfile, 422, 'Doctor profile is missing.');

        $appointment->loadMissing('doctorHospitalClinic');
        abort_unless(
            (int) $appointment->doctorHospitalClinic->doctor_profile_id === (int) $doctorProfile->id,
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

        return response()->json([
            'message' => 'Appointment status updated successfully.',
            'data' => $appointment->fresh(['patient:id,name,email,phone', 'doctorHospitalClinic.city']),
        ]);
    }
}
