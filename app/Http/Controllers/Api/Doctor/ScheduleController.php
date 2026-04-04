<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorScheduleSlot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    public function index(DoctorHospitalClinic $clinic): JsonResponse
    {
        $this->authorizeClinic($clinic);

        return response()->json([
            'data' => $clinic->scheduleSlots()->orderBy('day_of_week')->get(),
        ]);
    }

    public function store(Request $request, DoctorHospitalClinic $clinic): JsonResponse
    {
        $this->authorizeClinic($clinic);

        $request->merge([
            'schedules' => $this->normalizeSchedulePayload($request->input('schedules', [])),
        ]);

        $validated = $request->validate([
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

        DB::transaction(function () use ($validated, $clinic) {
            foreach ($validated['schedules'] as $day) {
                DoctorScheduleSlot::updateOrCreate(
                    [
                        'doctor_hospital_clinic_id' => $clinic->id,
                        'day_of_week' => $day['day_of_week'],
                    ],
                    [
                        'opening_time' => $day['is_available'] ? ($day['opening_time'] ?? null) : null,
                        'closing_time' => $day['is_available'] ? ($day['closing_time'] ?? null) : null,
                        'break_start_time' => $day['is_available'] ? ($day['break_start_time'] ?? null) : null,
                        'break_end_time' => $day['is_available'] ? ($day['break_end_time'] ?? null) : null,
                        'slot_duration_minutes' => $day['slot_duration_minutes'],
                        'max_appointments_per_slot' => $day['max_appointments_per_slot'],
                        'is_available' => $day['is_available'],
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Schedule updated successfully.',
            'data' => $clinic->scheduleSlots()->orderBy('day_of_week')->get(),
        ]);
    }

    public function updateDay(Request $request, DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $this->authorizeClinic($clinic);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

        $request->merge($this->normalizeSingleSchedulePayload($request->all()));

        $validated = $request->validate([
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

        $slot = DoctorScheduleSlot::updateOrCreate(
            [
                'doctor_hospital_clinic_id' => $clinic->id,
                'day_of_week' => $day,
            ],
            [
                'opening_time' => $validated['is_available'] ? ($validated['opening_time'] ?? null) : null,
                'closing_time' => $validated['is_available'] ? ($validated['closing_time'] ?? null) : null,
                'break_start_time' => $validated['is_available'] ? ($validated['break_start_time'] ?? null) : null,
                'break_end_time' => $validated['is_available'] ? ($validated['break_end_time'] ?? null) : null,
                'slot_duration_minutes' => $validated['slot_duration_minutes'],
                'max_appointments_per_slot' => $validated['max_appointments_per_slot'],
                'is_available' => $validated['is_available'],
            ]
        );

        return response()->json([
            'message' => 'Day schedule updated successfully.',
            'data' => $slot,
        ]);
    }

    public function destroy(DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $this->authorizeClinic($clinic);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

        $clinic->scheduleSlots()->where('day_of_week', $day)->delete();

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
}
