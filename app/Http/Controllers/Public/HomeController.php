<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Display the homepage
     */
    public function index(): Response
    {
        // Get active cities
        $cities = City::active()
            ->withCount('doctors')
            ->orderBy('name')
            ->get();

        // Get active specialties
        $specialties = Specialty::active()
            ->withCount('doctors')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($specialty) => [
                'id' => $specialty->id,
                'name' => $specialty->name,
                'icon' => $specialty->icon,
                'image_url' => $specialty->image_path ? asset($specialty->image_path) : null,
                'doctors_count' => $specialty->doctors_count,
            ]);

        // Get featured doctors (verified and active)
        $featuredDoctors = DoctorProfile::with(['user', 'specialty', 'cities'])
            ->verified()
            ->active()
            ->inRandomOrder()
            ->take(8)
            ->get()
            ->map(fn($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialty' => $doctor->specialty?->name,
                'image' => $doctor->profile_image_url,
                'cities' => $doctor->cities->pluck('name')->join(', '),
                'bio' => \Str::limit($doctor->bio, 100),
            ]);

        // Get statistics
        $stats = [
            'total_doctors' => DoctorProfile::verified()->count(),
            'total_cities' => City::active()->count(),
            'total_specialties' => Specialty::active()->count(),
        ];

        return Inertia::render('Public/Home', [
            'cities' => $cities,
            'specialties' => $specialties,
            'featuredDoctors' => $featuredDoctors,
            'stats' => $stats,
        ]);
    }
}
