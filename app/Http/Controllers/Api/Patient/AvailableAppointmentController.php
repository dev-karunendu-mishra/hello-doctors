<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
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

        $practiceLocations = DoctorPracticeLocation::query()
            ->with(['address.cityRecord', 'clinic', 'doctorProfile.user', 'doctorProfile.specialty', 'schedules'])
            ->active()
            ->whereHas('doctorProfile', function ($q) use ($validated) {
                $q->verified()
                    ->active()
                    ->when(isset($validated['specialty_id']), function ($inner) use ($validated) {
                        $inner->where('specialization_id', $validated['specialty_id']);
                    });
            })
            ->when(isset($validated['city_id']), function ($q) use ($validated) {
                $q->whereHas('address', function ($addressQuery) use ($validated) {
                    $addressQuery->where('city_id', $validated['city_id']);
                });
            })
            ->get();

        $data = [];
        $period = CarbonPeriod::create($dateFrom->copy()->startOfDay(), '1 day', $dateTo->copy()->startOfDay());

        foreach ($practiceLocations as $location) {
            $legacyClinicId = $this->resolveLegacyClinicIdFromPracticeLocation($location);
            $availableDates = [];

            foreach ($period as $date) {
                $slots = $this->getAvailableSlotsForLocation($location, $date, $legacyClinicId);

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
                    'id' => $location->doctorProfile->id,
                    'name' => $location->doctorProfile->user->name,
                    'specialty' => $location->doctorProfile->specialty?->name,
                    'experience_years' => $location->doctorProfile->experience_years,
                ],
                'clinic' => [
                    'id' => $legacyClinicId ?? $location->id,
                    'doctor_practice_location_id' => $location->id,
                    'legacy_clinic_id' => $legacyClinicId,
                    'hospital_clinic_name' => $location->display_name ?: $location->clinic?->name ?: 'Private Practice',
                    'city' => $location->address?->city ?: $location->address?->cityRecord?->name,
                    'address' => collect([$location->address?->line1, $location->address?->line2])->filter()->join(', '),
                    'landmarks' => $location->address?->landmark,
                    'consultation_fee' => $location->resolved_consultation_fee,
                    'phone' => $location->resolved_contact_phone,
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
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinicId($clinic->id);

        return response()->json([
            'clinic_id' => $clinic->id,
            'doctor_practice_location_id' => $practiceLocation?->id,
            'date' => $date->toDateString(),
            'slots' => $practiceLocation
                ? $this->getAvailableSlotsForLocation($practiceLocation, $date, $clinic->id)
                : $clinic->getAvailableSlotsForDate($date),
        ]);
    }

    protected function resolveLegacyClinicIdFromPracticeLocation(DoctorPracticeLocation $practiceLocation): ?int
    {
        $meta = $practiceLocation->address?->meta ?? [];

        if (($meta['legacy_source'] ?? null) === 'doctor_hospital_clinics' && !empty($meta['legacy_id'])) {
            return (int) $meta['legacy_id'];
        }

        return null;
    }

    protected function resolvePracticeLocationFromLegacyClinicId(int $legacyClinicId): ?DoctorPracticeLocation
    {
        return DoctorPracticeLocation::query()
            ->with(['address.cityRecord', 'clinic', 'doctorProfile.user', 'schedules'])
            ->whereHas('address', function ($query) use ($legacyClinicId) {
                $query->where('meta->legacy_source', 'doctor_hospital_clinics')
                    ->where('meta->legacy_id', $legacyClinicId);
            })
            ->first();
    }

    protected function getAvailableSlotsForLocation(DoctorPracticeLocation $location, Carbon $date, ?int $legacyClinicId = null): array
    {
        $schedule = $location->schedules
            ->where('is_available', true)
            ->firstWhere('day_of_week', $date->dayOfWeek);

        if (!$schedule) {
            if ($legacyClinicId) {
                $legacyClinic = DoctorHospitalClinic::query()->find($legacyClinicId);
                return $legacyClinic ? $legacyClinic->getAvailableSlotsForDate($date) : [];
            }

            return [];
        }

        if (!$schedule->opening_time || !$schedule->closing_time) {
            return [];
        }

        $slots = [];
        $currentTime = Carbon::parse($schedule->opening_time);
        $closingTime = Carbon::parse($schedule->closing_time);
        $breakStart = $schedule->break_start_time ? Carbon::parse($schedule->break_start_time) : null;
        $breakEnd = $schedule->break_end_time ? Carbon::parse($schedule->break_end_time) : null;
        $stepMinutes = max((int) $schedule->slot_duration_minutes, 5);

        while ($currentTime < $closingTime) {
            if ($breakStart && $currentTime >= $breakStart && $currentTime < $breakEnd) {
                $currentTime->addMinutes($stepMinutes);
                continue;
            }

            $slotEndTime = (clone $currentTime)->addMinutes($stepMinutes);
            if ($slotEndTime > $closingTime) {
                break;
            }

            $bookingCount = Appointment::query()
                ->whereDate('appointment_date', $date->toDateString())
                ->where('appointment_time', $currentTime->format('H:i:s'))
                ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
                ->where(function ($query) use ($location, $legacyClinicId) {
                    $query->where('doctor_practice_location_id', $location->id);

                    if ($legacyClinicId) {
                        $query->orWhere('doctor_hospital_clinic_id', $legacyClinicId);
                    }
                })
                ->count();

            if ($bookingCount < $schedule->max_appointments_per_slot) {
                $slots[] = [
                    'time' => $currentTime->format('H:i'),
                    'bookings' => $bookingCount,
                    'available' => true,
                ];
            }

            $currentTime->addMinutes($stepMinutes);
        }

        return $slots;
    }
}
