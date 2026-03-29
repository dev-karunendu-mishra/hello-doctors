<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\HomeService;
use App\Models\HomeServiceProvider;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
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
                'slug' => $doctor->slug ?: (string) $doctor->id,
                'name' => $doctor->user->name,
                'specialty' => $doctor->specialty?->name,
                'image' => $doctor->profile_image_url,
                'cities' => $doctor->cities->pluck('name')->join(', '),
                'bio' => Str::limit($doctor->bio, 100),
            ]);

        // Get statistics
        $stats = [
            'total_doctors' => DoctorProfile::verified()->count(),
            'total_cities' => City::active()->count(),
            'total_specialties' => Specialty::active()->count(),
        ];

        $hasHomeServicesSchema = Schema::hasTable('home_services')
            && Schema::hasTable('home_service_providers')
            && Schema::hasTable('home_service_provider_services');

        if ($hasHomeServicesSchema) {
            $homeServices = HomeService::query()
                ->active()
                ->with('category:id,name')
                ->orderBy('name')
                ->take(4)
                ->get()
                ->map(function (HomeService $service) {
                    $providersCount = HomeServiceProvider::query()
                        ->active()
                        ->verified()
                        ->whereHas('serviceLinks', function ($query) use ($service) {
                            $query->where('home_service_id', $service->id)
                                ->where('is_active', true);
                        })
                        ->count();

                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'category_name' => $service->category?->name,
                        'duration_minutes' => $service->duration_minutes,
                        'base_price' => (float) $service->base_price,
                        'providers_count' => $providersCount,
                    ];
                })
                ->values();

            $homeServicesStats = [
                'services_count' => HomeService::query()->active()->count(),
                'providers_count' => HomeServiceProvider::query()->active()->verified()->count(),
                'starting_price' => (float) (HomeService::query()->active()->min('base_price') ?? 0),
            ];
        } else {
            $homeServices = collect();
            $homeServicesStats = [
                'services_count' => 0,
                'providers_count' => 0,
                'starting_price' => 0,
            ];
        }

        return Inertia::render('Public/Home', [
            'cities' => $cities,
            'specialties' => $specialties,
            'featuredDoctors' => $featuredDoctors,
            'stats' => $stats,
            'homeServices' => $homeServices,
            'homeServicesStats' => $homeServicesStats,
        ]);
    }
}
