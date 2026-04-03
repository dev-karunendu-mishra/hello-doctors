<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $doctorProfile = $user->doctorProfile()
            ->with(['specialty', 'cities', 'workingHours', 'hospitalClinics.city'])
            ->first();

        if (!$doctorProfile) {
            return Inertia::render('Doctor/Dashboard', [
                'profile' => null,
                'stats' => $this->emptyStats(),
                'todayAppointments' => [],
                'upcomingAppointments' => [],
            ]);
        }

        // Build profile array that the frontend expects
        $profile = array_merge($doctorProfile->toArray(), [
            'name'      => $user->name,
            'phone'     => $user->phone,
            'is_active' => $user->is_active,
            'user'      => ['email' => $user->email],
        ]);

        // Calculate profile completion percentage
        $profile['profile_completion'] = $this->calculateProfileCompletion($doctorProfile, $user);

        // Live appointment stats
        $today = today()->toDateString();

        $todayAppointments = $doctorProfile->appointments()
            ->with(['patient:id,name,email,phone'])
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get();

        $upcomingAppointments = $doctorProfile->appointments()
            ->with(['patient:id,name,email,phone', 'doctorHospitalClinic.city'])
            ->where('appointment_date', '>', $today)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->take(10)
            ->get();

        $stats = [
            'todayAppointments'    => $todayAppointments->count(),
            'totalPatients'        => $doctorProfile->appointments()
                ->distinct('patient_id')
                ->count('patient_id'),
            'pendingAppointments'  => $doctorProfile->appointments()
                ->where('status', Appointment::STATUS_PENDING)
                ->count(),
            'completedAppointments' => $doctorProfile->appointments()
                ->where('status', Appointment::STATUS_COMPLETED)
                ->count(),
            'profile_views'        => 0,
            'profile_completion'   => $profile['profile_completion'],
        ];

        return Inertia::render('Doctor/Dashboard', [
            'profile'              => $profile,
            'stats'                => $stats,
            'todayAppointments'    => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }

    private function calculateProfileCompletion(\App\Models\DoctorProfile $profile, \App\Models\User $user): int
    {
        $checks = [
            !empty($user->name),
            !empty($user->email),
            !empty($user->phone),
            !empty($profile->bio),
            !empty($profile->qualification),
            !empty($profile->experience_years),
            !empty($profile->consultation_fee),
            !empty($profile->profile_image),
            !empty($profile->license_number),
            $profile->cities->isNotEmpty(),
        ];

        $filled = count(array_filter($checks));

        return (int) round(($filled / count($checks)) * 100);
    }

    private function emptyStats(): array
    {
        return [
            'todayAppointments'    => 0,
            'totalPatients'        => 0,
            'pendingAppointments'  => 0,
            'completedAppointments' => 0,
            'profile_views'        => 0,
            'profile_completion'   => 0,
        ];
    }
}
