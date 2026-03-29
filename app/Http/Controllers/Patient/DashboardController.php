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
        $upcomingAppointments = []; // Will be populated when appointments are implemented
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
        ]);
    }
}
