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
        $specialties = $this->getPublicSpecialties();

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

    /**
     * Display the services page
     */
    public function services(): Response
    {
        return Inertia::render('Public/Services', [
            'services' => $this->getPublicServices(),
        ]);
    }

    /**
     * Display a service details page
     */
    public function serviceDetails(string $service): Response
    {
        $serviceItem = HomeService::query()
            ->active()
            ->with('category:id,name')
            ->where(function ($query) use ($service) {
                $query->where('code', $service)
                    ->orWhere('id', $service);
            })
            ->first();

        if ($serviceItem) {
            $providersCount = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->whereHas('serviceLinks', function ($query) use ($serviceItem) {
                    $query->where('home_service_id', $serviceItem->id)
                        ->where('is_active', true);
                })
                ->count();

            $serviceData = [
                'id' => $serviceItem->id,
                'code' => $serviceItem->code ?: (string) $serviceItem->id,
                'name' => $serviceItem->name,
                'description' => $serviceItem->description,
                'category_name' => $serviceItem->category?->name,
                'duration_minutes' => (int) $serviceItem->duration_minutes,
                'base_price' => (float) $serviceItem->base_price,
                'providers_count' => $providersCount,
            ];
        } else {
            $serviceData = collect($this->getPublicServices())->firstWhere('code', $service)
                ?? collect($this->getPublicServices())->firstWhere('id', $service)
                ?? abort(404);
        }

        return Inertia::render('Public/ServiceDetails', [
            'service' => $serviceData,
        ]);
    }

    /**
     * Display the FAQ page
     */
    public function faq(): Response
    {
        return Inertia::render('Public/Faq', [
            'faqItems' => [
                [
                    'question' => 'How do I find the right doctor on Hello Doctors?',
                    'answer' => 'Use the Doctors page to browse verified profiles by specialty, city, and care need. You can compare experience, services, and profile details before choosing the best fit.',
                ],
                [
                    'question' => 'Can I contact a doctor or request help through the platform?',
                    'answer' => 'Yes. You can explore public doctor profiles and use the contact page whenever you need support with discovery, onboarding, or healthcare assistance from the Hello Doctors team.',
                ],
                [
                    'question' => 'Are doctors and providers verified before appearing publicly?',
                    'answer' => 'Hello Doctors is designed to highlight active and verified professionals and providers, helping patients discover trusted care options with more confidence.',
                ],
                [
                    'question' => 'What departments and services can I browse on the public site?',
                    'answer' => 'You can explore specialist departments, home-care related services, and public healthcare offerings across multiple categories from one easy-to-use platform.',
                ],
                [
                    'question' => 'How can doctors, clinics, or providers join Hello Doctors?',
                    'answer' => 'Doctors and providers can use the registration pages to submit their details. Once reviewed, the team helps them complete the onboarding and profile setup process.',
                ],
            ],
        ]);
    }

    /**
     * Display the privacy page
     */
    public function privacy(): Response
    {
        return Inertia::render('Public/Privacy');
    }

    /**
     * Display the terms page
     */
    public function terms(): Response
    {
        return Inertia::render('Public/Terms');
    }

    /**
     * Display the testimonials page
     */
    public function testimonials(): Response
    {
        return Inertia::render('Public/Testimonials');
    }

    /**
     * Display the departments page
     */
    public function departments(): Response
    {
        return Inertia::render('Public/Departments', [
            'specialties' => $this->getPublicSpecialties(),
        ]);
    }

    /**
     * Display a department details page
     */
    public function departmentDetails(string $specialty): Response
    {
        $department = Specialty::active()
            ->withCount('doctors')
            ->where(function ($query) use ($specialty) {
                $query->where('slug', $specialty)
                    ->orWhere('id', $specialty);
            })
            ->firstOrFail();

        return Inertia::render('Public/DepartmentDetails', [
            'specialty' => [
                'id' => $department->id,
                'name' => $department->name,
                'slug' => $department->slug ?: (string) $department->id,
                'icon' => $department->icon,
                'description' => $department->description,
                'image_url' => $department->image_path ? asset($department->image_path) : null,
                'doctors_count' => $department->doctors_count,
            ],
        ]);
    }

    /**
     * Get public services for public pages
     */
    private function getPublicServices()
    {
        $hasHomeServicesSchema = Schema::hasTable('home_services')
            && Schema::hasTable('home_service_providers')
            && Schema::hasTable('home_service_provider_services');

        if (!$hasHomeServicesSchema) {
            return collect();
        }

        return HomeService::query()
            ->active()
            ->with('category:id,name')
            ->orderBy('name')
            ->take(6)
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
                    'code' => $service->code ?: (string) $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'category_name' => $service->category?->name,
                    'duration_minutes' => (int) $service->duration_minutes,
                    'base_price' => (float) $service->base_price,
                    'providers_count' => $providersCount,
                ];
            })
            ->values();
    }

    /**
     * Get specialties for public pages
     */
    private function getPublicSpecialties()
    {
        return Specialty::active()
            ->withCount('doctors')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($specialty) => [
                'id' => $specialty->id,
                'name' => $specialty->name,
                'slug' => $specialty->slug,
                'icon' => $specialty->icon,
                'description' => $specialty->description,
                'image_url' => $specialty->image_path ? asset($specialty->image_path) : null,
                'doctors_count' => $specialty->doctors_count,
            ]);
    }
}
