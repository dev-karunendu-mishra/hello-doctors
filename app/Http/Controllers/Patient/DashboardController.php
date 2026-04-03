<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $upcomingAppointments = $user?->upcomingAppointments()
            ->with(['doctorHospitalClinic.doctorProfile.user', 'doctorHospitalClinic.doctorProfile.specialty'])
            ->take(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'doctor_name' => $item->doctorHospitalClinic?->doctorProfile?->user?->name,
                'date' => $item->appointment_date?->format('Y-m-d'),
                'time' => substr((string) $item->appointment_time, 0, 5),
                'status' => $item->status,
                'specialization' => $item->doctorHospitalClinic?->doctorProfile?->specialty?->name,
            ]) ?? [];

        $recentRecords = [];
        
        // Get recommended doctors with public profile slug for profile links.
        $recommendedDoctors = DoctorProfile::with(['user', 'specialty'])
            ->verified()
            ->active()
            ->whereNotNull('slug')
            ->inRandomOrder()
            ->take(8)
            ->get()
            ->map(fn ($doctor) => [
                'id' => $doctor->id,
                'slug' => $doctor->slug,
                'name' => $doctor->user?->name,
                'specialization' => $doctor->specialty?->name,
                'experience' => $doctor->experience_years,
            ]);

        return Inertia::render('Patient/Dashboard', [
            'upcomingAppointments' => $upcomingAppointments,
            'recentRecords' => $recentRecords,
            'recommendedDoctors' => $recommendedDoctors,
            'abhaProfile' => [
                'abha_number' => $user?->abha_number,
                'abha_address' => $user?->abha_address,
                'abha_status' => $user?->abha_status ?? 'not_linked',
                'abha_verified_at' => optional($user?->abha_verified_at)?->toDateTimeString(),
                'abha_last_synced_at' => optional($user?->abha_last_synced_at)?->toDateTimeString(),
            ],
        ]);
    }
}
