<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorHospitalClinic;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:pending,confirmed,completed,cancelled,no-show,upcoming,past'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Appointment::query()
            ->with(['doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user', 'doctorHospitalClinic.doctorProfile.specialty'])
            ->where('patient_id', Auth::id())
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time');

        if ($request->filled('status')) {
            $status = $request->string('status')->value();

            if ($status === 'upcoming') {
                $query->upcoming();
            } elseif ($status === 'past') {
                $query->past();
            } else {
                $query->where('status', $status);
            }
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'doctor_hospital_clinic_id' => ['required', 'exists:doctor_hospital_clinics,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'consultation_type' => ['nullable', 'in:in-person,online,phone'],
            'reason_for_visit' => ['nullable', 'string'],
        ]);

        $clinic = DoctorHospitalClinic::with('doctorProfile.user')->findOrFail($validated['doctor_hospital_clinic_id']);

        if (!$clinic->is_active || !$clinic->doctorProfile || !$clinic->doctorProfile->is_verified || !$clinic->doctorProfile->user?->is_active) {
            return response()->json([
                'message' => 'Doctor clinic is not available for booking.',
            ], 422);
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        // Ensure slot exists and has capacity before creating appointment.
        if (!$clinic->isSlotAvailable($appointmentDate, $appointmentTime)) {
            return response()->json([
                'message' => 'Selected slot is no longer available.',
            ], 422);
        }

        try {
            $appointment = DB::transaction(function () use ($validated, $appointmentDate, $appointmentTime) {
                return Appointment::create([
                    'patient_id' => Auth::id(),
                    'doctor_hospital_clinic_id' => $validated['doctor_hospital_clinic_id'],
                    'appointment_date' => $appointmentDate->toDateString(),
                    'appointment_time' => $appointmentTime,
                    'consultation_type' => $validated['consultation_type'] ?? Appointment::CONSULTATION_IN_PERSON,
                    'reason_for_visit' => $validated['reason_for_visit'] ?? null,
                    'status' => Appointment::STATUS_PENDING,
                ]);
            });
        } catch (QueryException $e) {
            // Handles race conditions against unique_clinic_slot.
            if ((int) $e->getCode() === 23000) {
                return response()->json([
                    'message' => 'Selected slot is no longer available.',
                ], 422);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'data' => $appointment->load(['doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user']),
        ], 201);
    }

    public function cancel(Request $request, Appointment $appointment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        abort_unless((int) $appointment->patient_id === (int) Auth::id(), 403, 'Unauthorized appointment access.');

        if (!$appointment->canBeCancelled()) {
            return response()->json([
                'message' => 'Appointment cannot be cancelled now.',
            ], 422);
        }

        $appointment->cancel($validated['reason'] ?? null);

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'data' => $appointment->fresh(['doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user']),
        ]);
    }
}
