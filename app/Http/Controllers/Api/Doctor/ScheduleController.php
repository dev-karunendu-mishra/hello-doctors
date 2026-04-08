<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
use App\Models\DoctorPracticeSchedule;
use App\Models\DoctorScheduleSlot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function index(DoctorHospitalClinic $clinic): JsonResponse
    {
        $this->authorizeClinic($clinic);
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);

        return response()->json([
            'data' => $this->buildScheduleResponse($clinic, $practiceLocation),
        ]);
    }

    public function store(Request $request, DoctorHospitalClinic $clinic): JsonResponse
    {
        $this->authorizeClinic($clinic);

        $request->merge([
            'schedules' => $this->normalizeSchedulePayload($request->input('schedules', [])),
        ]);

        $validated = $request->validate([
            'doctor_practice_location_id' => ['nullable', 'integer', 'exists:doctor_practice_locations,id'],
            'schedules' => ['required', 'array', 'min:1'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.opening_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.closing_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.break_start_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.break_end_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'schedules.*.max_appointments_per_slot' => ['required', 'integer', 'min:1', 'max:20'],
            'schedules.*.is_available' => ['required', 'boolean'],
        ]);

        $this->validateSchedulePayload($validated['schedules']);
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic, $validated['doctor_practice_location_id'] ?? null);

        DB::transaction(function () use ($validated, $clinic, $practiceLocation) {
            foreach ($validated['schedules'] as $day) {
                $attributes = $this->buildScheduleAttributes($day);

                DoctorScheduleSlot::updateOrCreate(
                    [
                        'doctor_hospital_clinic_id' => $clinic->id,
                        'day_of_week' => $day['day_of_week'],
                    ],
                    $attributes
                );

                if ($practiceLocation) {
                    DoctorPracticeSchedule::updateOrCreate(
                        [
                            'doctor_practice_location_id' => $practiceLocation->id,
                            'day_of_week' => $day['day_of_week'],
                        ],
                        $attributes
                    );
                }
            }
        });

        return response()->json([
            'message' => 'Schedule updated successfully.',
            'data' => $this->buildScheduleResponse($clinic, $practiceLocation),
        ]);
    }

    public function updateDay(Request $request, DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $this->authorizeClinic($clinic);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

        $request->merge($this->normalizeSingleSchedulePayload($request->all()));

        $validated = $request->validate([
            'doctor_practice_location_id' => ['nullable', 'integer', 'exists:doctor_practice_locations,id'],
            'opening_time' => ['nullable', 'date_format:H:i'],
            'closing_time' => ['nullable', 'date_format:H:i'],
            'break_start_time' => ['nullable', 'date_format:H:i'],
            'break_end_time' => ['nullable', 'date_format:H:i'],
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'max_appointments_per_slot' => ['required', 'integer', 'min:1', 'max:20'],
            'is_available' => ['required', 'boolean'],
        ]);

        $this->validateSchedulePayload([[
            'day_of_week' => $day,
            ...$validated,
        ]]);

        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic, $validated['doctor_practice_location_id'] ?? null);
        $attributes = $this->buildScheduleAttributes($validated);

        DB::transaction(function () use ($clinic, $day, $attributes, $practiceLocation) {
            DoctorScheduleSlot::updateOrCreate(
                [
                    'doctor_hospital_clinic_id' => $clinic->id,
                    'day_of_week' => $day,
                ],
                $attributes
            );

            if ($practiceLocation) {
                DoctorPracticeSchedule::updateOrCreate(
                    [
                        'doctor_practice_location_id' => $practiceLocation->id,
                        'day_of_week' => $day,
                    ],
                    $attributes
                );
            }
        });

        return response()->json([
            'message' => 'Day schedule updated successfully.',
            'data' => collect($this->buildScheduleResponse($clinic, $practiceLocation))->firstWhere('day_of_week', $day),
        ]);
    }

    public function destroy(DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $this->authorizeClinic($clinic);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);

        DB::transaction(function () use ($clinic, $day, $practiceLocation) {
            $clinic->scheduleSlots()->where('day_of_week', $day)->delete();

            if ($practiceLocation) {
                $practiceLocation->schedules()->where('day_of_week', $day)->delete();
            }
        });

        return response()->json([
            'message' => 'Day schedule deleted successfully.',
        ]);
    }

    private function authorizeClinic(DoctorHospitalClinic $clinic): void
    {
        $doctorProfile = Auth::user()?->doctorProfile;
        abort_unless($doctorProfile, 422, 'Doctor profile is missing.');

        abort_unless((int) $clinic->doctor_profile_id === (int) $doctorProfile->id, 403, 'Unauthorized clinic access.');
    }

    private function normalizeSchedulePayload(array $schedules): array
    {
        return array_map(fn($schedule) => $this->normalizeSingleSchedulePayload($schedule), $schedules);
    }

    private function normalizeSingleSchedulePayload(array $schedule): array
    {
        foreach (['opening_time', 'closing_time', 'break_start_time', 'break_end_time'] as $field) {
            $schedule[$field] = $this->normalizeTimeValue($schedule[$field] ?? null);
        }

        return $schedule;
    }

    private function normalizeTimeValue($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        foreach (['H:i', 'H:i:s', 'g:i A', 'g:iA', 'h:i A', 'h:iA'] as $format) {
            try {
                return Carbon::createFromFormat($format, strtoupper($value))->format('H:i');
            } catch (\Throwable $e) {
                // Try next supported format.
            }
        }

        return $value;
    }

    private function validateSchedulePayload(array $schedules): void
    {
        $seenDays = [];

        foreach ($schedules as $schedule) {
            $day = $schedule['day_of_week'];
            if (in_array($day, $seenDays, true)) {
                abort(422, 'Duplicate day_of_week in schedule payload.');
            }
            $seenDays[] = $day;

            if (!$schedule['is_available']) {
                continue;
            }

            if (empty($schedule['opening_time']) || empty($schedule['closing_time'])) {
                abort(422, 'opening_time and closing_time are required when day is available.');
            }

            $opening = strtotime($schedule['opening_time']);
            $closing = strtotime($schedule['closing_time']);

            if ($opening === false || $closing === false || $opening >= $closing) {
                abort(422, 'opening_time must be earlier than closing_time.');
            }

            if (!empty($schedule['break_start_time']) || !empty($schedule['break_end_time'])) {
                if (empty($schedule['break_start_time']) || empty($schedule['break_end_time'])) {
                    abort(422, 'Both break_start_time and break_end_time are required if break is provided.');
                }

                $breakStart = strtotime($schedule['break_start_time']);
                $breakEnd = strtotime($schedule['break_end_time']);

                if ($breakStart === false || $breakEnd === false || $breakStart >= $breakEnd) {
                    abort(422, 'break_start_time must be earlier than break_end_time.');
                }

                if ($breakStart < $opening || $breakEnd > $closing) {
                    abort(422, 'Break time must be within opening and closing hours.');
                }
            }
        }
    }

    private function buildScheduleAttributes(array $schedule): array
    {
        return [
            'opening_time' => $schedule['is_available'] ? ($schedule['opening_time'] ?? null) : null,
            'closing_time' => $schedule['is_available'] ? ($schedule['closing_time'] ?? null) : null,
            'break_start_time' => $schedule['is_available'] ? ($schedule['break_start_time'] ?? null) : null,
            'break_end_time' => $schedule['is_available'] ? ($schedule['break_end_time'] ?? null) : null,
            'slot_duration_minutes' => $schedule['slot_duration_minutes'],
            'max_appointments_per_slot' => $schedule['max_appointments_per_slot'],
            'is_available' => $schedule['is_available'],
        ];
    }

    private function buildScheduleResponse(DoctorHospitalClinic $clinic, ?DoctorPracticeLocation $practiceLocation): array
    {
        $legacyByDay = $clinic->scheduleSlots()->orderBy('day_of_week')->get()->keyBy('day_of_week');

        if (!$practiceLocation) {
            return $legacyByDay
                ->map(fn(DoctorScheduleSlot $slot) => $this->formatLegacySchedule($slot))
                ->values()
                ->all();
        }

        $practiceByDay = $practiceLocation->schedules()->orderBy('day_of_week')->get()->keyBy('day_of_week');
        $days = $legacyByDay->keys()->merge($practiceByDay->keys())->unique()->sort()->values();

        return $days
            ->map(function ($day) use ($legacyByDay, $practiceByDay, $practiceLocation, $clinic) {
                $legacySlot = $legacyByDay->get($day);
                $practiceSchedule = $practiceByDay->get($day);

                if ($practiceSchedule) {
                    return $this->formatPracticeSchedule($practiceSchedule, $legacySlot, $clinic->id);
                }

                return $legacySlot
                    ? $this->formatLegacySchedule($legacySlot, $practiceLocation->id)
                    : null;
            })
            ->filter()
            ->values()
            ->all();
    }

    private function formatLegacySchedule(DoctorScheduleSlot $slot, ?int $practiceLocationId = null): array
    {
        return [
            'id' => $slot->id,
            'legacy_schedule_id' => $slot->id,
            'doctor_practice_schedule_id' => null,
            'doctor_hospital_clinic_id' => $slot->doctor_hospital_clinic_id,
            'doctor_practice_location_id' => $practiceLocationId,
            'day_of_week' => (int) $slot->day_of_week,
            'opening_time' => $slot->opening_time,
            'closing_time' => $slot->closing_time,
            'break_start_time' => $slot->break_start_time,
            'break_end_time' => $slot->break_end_time,
            'slot_duration_minutes' => (int) $slot->slot_duration_minutes,
            'max_appointments_per_slot' => (int) $slot->max_appointments_per_slot,
            'is_available' => (bool) $slot->is_available,
            'created_at' => optional($slot->created_at)?->toISOString(),
            'updated_at' => optional($slot->updated_at)?->toISOString(),
        ];
    }

    private function formatPracticeSchedule(DoctorPracticeSchedule $schedule, ?DoctorScheduleSlot $legacySlot, int $clinicId): array
    {
        return [
            'id' => $legacySlot?->id ?? $schedule->id,
            'legacy_schedule_id' => $legacySlot?->id,
            'doctor_practice_schedule_id' => $schedule->id,
            'doctor_hospital_clinic_id' => $clinicId,
            'doctor_practice_location_id' => $schedule->doctor_practice_location_id,
            'day_of_week' => (int) $schedule->day_of_week,
            'opening_time' => $schedule->opening_time,
            'closing_time' => $schedule->closing_time,
            'break_start_time' => $schedule->break_start_time,
            'break_end_time' => $schedule->break_end_time,
            'slot_duration_minutes' => (int) $schedule->slot_duration_minutes,
            'max_appointments_per_slot' => (int) $schedule->max_appointments_per_slot,
            'is_available' => (bool) $schedule->is_available,
            'created_at' => optional($legacySlot?->created_at ?? $schedule->created_at)?->toISOString(),
            'updated_at' => optional($schedule->updated_at ?? $legacySlot?->updated_at)?->toISOString(),
        ];
    }

    private function resolvePracticeLocationFromLegacyClinic(DoctorHospitalClinic $clinic, ?int $preferredPracticeLocationId = null): ?DoctorPracticeLocation
    {
        if ($preferredPracticeLocationId) {
            $practiceLocation = DoctorPracticeLocation::query()
                ->with(['schedules', 'address.cityRecord', 'clinic'])
                ->whereKey($preferredPracticeLocationId)
                ->where('doctor_profile_id', $clinic->doctor_profile_id)
                ->first();

            abort_unless($practiceLocation, 422, 'Invalid practice location selected.');

            return $practiceLocation;
        }

        return DoctorPracticeLocation::query()
            ->with(['schedules', 'address.cityRecord', 'clinic'])
            ->where('doctor_profile_id', $clinic->doctor_profile_id)
            ->whereHas('address', function ($query) use ($clinic) {
                $query->where('meta->legacy_source', 'doctor_hospital_clinics')
                    ->where('meta->legacy_id', $clinic->id);
            })
            ->first();
    }
}
