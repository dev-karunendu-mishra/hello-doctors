<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\DoctorHospitalClinic;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailableAppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'specialty_id' => ['nullable', 'integer', 'exists:specialties,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $dateFrom = isset($validated['date_from']) ? Carbon::parse($validated['date_from']) : now()->startOfDay();
        $dateTo = isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : now()->copy()->addDays(14)->endOfDay();

        // Prevent unbounded heavy searches.
        if ($dateFrom->diffInDays($dateTo) > 60) {
            return response()->json([
                'message' => 'Date range cannot exceed 60 days.',
            ], 422);
        }

        $clinics = DoctorHospitalClinic::query()
            ->with(['city', 'doctorProfile.user', 'doctorProfile.specialty'])
            ->active()
            ->whereHas('doctorProfile', function ($q) use ($validated) {
                $q->verified()
                    ->active()
                    ->when(isset($validated['specialty_id']), function ($inner) use ($validated) {
                        $inner->where('specialization_id', $validated['specialty_id']);
                    });
            })
            ->when(isset($validated['city_id']), function ($q) use ($validated) {
                $q->where('city_id', $validated['city_id']);
            })
            ->get();

        $data = [];
        $period = CarbonPeriod::create($dateFrom->copy()->startOfDay(), '1 day', $dateTo->copy()->startOfDay());

        foreach ($clinics as $clinic) {
            $availableDates = [];

            foreach ($period as $date) {
                $slots = $clinic->getAvailableSlotsForDate($date);

                if (!empty($slots)) {
                    $availableDates[] = [
                        'date' => $date->format('Y-m-d'),
                        'slots' => $slots,
                    ];
                }
            }

            if (empty($availableDates)) {
                continue;
            }

            $data[] = [
                'doctor' => [
                    'id' => $clinic->doctorProfile->id,
                    'name' => $clinic->doctorProfile->user->name,
                    'specialty' => $clinic->doctorProfile->specialty?->name,
                    'experience_years' => $clinic->doctorProfile->experience_years,
                ],
                'clinic' => [
                    'id' => $clinic->id,
                    'hospital_clinic_name' => $clinic->hospital_clinic_name,
                    'city' => $clinic->city?->name,
                    'address' => $clinic->address,
                    'landmarks' => $clinic->landmarks,
                    'consultation_fee' => $clinic->getConsultationFee(),
                    'phone' => $clinic->phone,
                ],
                'available_dates' => $availableDates,
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function slots(Request $request, DoctorHospitalClinic $clinic): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
        ]);

        if (!$clinic->is_active) {
            return response()->json(['slots' => []]);
        }

        $clinic->loadMissing('doctorProfile.user');
        if (!$clinic->doctorProfile || !$clinic->doctorProfile->is_verified || !$clinic->doctorProfile->user?->is_active) {
            return response()->json(['slots' => []]);
        }

        $date = Carbon::parse($validated['date']);

        return response()->json([
            'clinic_id' => $clinic->id,
            'date' => $date->toDateString(),
            'slots' => $clinic->getAvailableSlotsForDate($date),
        ]);
    }
}
