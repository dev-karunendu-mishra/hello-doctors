<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorScheduleSlot;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DoctorClinicScheduleController extends Controller
{
    public function index(User $doctor, DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);

        $schedule = $clinic->scheduleSlots()->orderBy('day_of_week')->get();

        return response()->json(['data' => $schedule]);
    }

    public function store(Request $request, User $doctor, DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);

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

    public function updateDay(Request $request, User $doctor, DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

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

    public function destroy(User $doctor, DoctorHospitalClinic $clinic, int $day): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);
        abort_if($day < 0 || $day > 6, 422, 'Invalid day value.');

        $clinic->scheduleSlots()->where('day_of_week', $day)->delete();

        return response()->json([
            'message' => 'Day schedule deleted successfully.',
        ]);
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

    private function resolveDoctorProfile(User $doctor)
    {
        abort_unless($doctor->isDoctor(), 422, 'Selected user is not a doctor.');

        $profile = $doctor->doctorProfile;
        abort_unless($profile, 422, 'Doctor profile is missing.');

        return $profile;
    }

    private function ensureClinicBelongsToDoctor(DoctorHospitalClinic $clinic, int $doctorProfileId): void
    {
        abort_unless(
            (int) $clinic->doctor_profile_id === $doctorProfileId,
            404,
            'Clinic not found for the given doctor.'
        );
    }
}
