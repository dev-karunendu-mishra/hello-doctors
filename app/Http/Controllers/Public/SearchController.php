<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    /**
     * Display search page and results
     */
    public function index(Request $request): Response
    {
        $query = DoctorProfile::query()
            ->with(['user', 'specialty', 'cities', 'searchTag'])
            ->verified()
            ->active();

        // Search by keyword
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('user', function ($userQuery) use ($searchTerm) {
                    $userQuery->where('name', 'LIKE', "%{$searchTerm}%");
                })
                ->orWhereHas('specialty', function ($specQuery) use ($searchTerm) {
                    $specQuery->where('name', 'LIKE', "%{$searchTerm}%");
                })
                ->orWhereHas('searchTag', function ($tagQuery) use ($searchTerm) {
                    $tagQuery->where('tags', 'LIKE', "%{$searchTerm}%");
                })
                ->orWhere('bio', 'LIKE', "%{$searchTerm}%");
            });
        }

        // Filter by city
        if ($request->filled('city')) {
            $query->byCity($request->city);
        }

        // Filter by city name (for custom city input or detected location)
        if ($request->filled('city_name') && !$request->filled('city')) {
            $city = City::where('name', 'LIKE', "%{$request->city_name}%")->first();
            if ($city) {
                $query->byCity($city->id);
            }
        }

        // Filter by specialty
        if ($request->filled('specialty')) {
            $query->bySpecialty($request->specialty);
        }

        // Filter by availability
        if ($request->filled('available_online')) {
            $query->where('is_available_online', true);
        }

        // Sort
        $sortBy = $request->get('sort', 'name');
        switch ($sortBy) {
            case 'name':
                $query->join('users', 'doctor_profiles.user_id', '=', 'users.id')
                    ->orderBy('users.name');
                break;
            case 'experience':
                $query->orderByDesc('experience_years');
                break;
            case 'fee':
                $query->orderBy('consultation_fee');
                break;
            default:
                $query->join('users', 'doctor_profiles.user_id', '=', 'users.id')
                    ->orderBy('users.name');
        }

        // Paginate results
        $doctors = $query->select('doctor_profiles.*')
            ->paginate(20)
            ->through(fn($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialty' => $doctor->specialty?->name,
                'specialty_id' => $doctor->specialty?->id,
                'image' => $doctor->profile_image_url,
                'bio' => \Str::limit($doctor->bio, 150),
                'cities' => $doctor->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                    'address' => $city->pivot->address,
                ]),
                'experience_years' => $doctor->experience_years,
                'consultation_fee' => $doctor->consultation_fee,
                'is_available_online' => $doctor->is_available_online,
                'website' => $doctor->website,
            ]);

        // Get filter options
        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        return Inertia::render('Public/Search', [
            'doctors' => $doctors,
            'cities' => $cities,
            'specialties' => $specialties,
            'filters' => [
                'search' => $request->search,
                'city' => $request->city,
                'city_name' => $request->city_name,
                'specialty' => $request->specialty,
                'available_online' => $request->available_online,
                'sort' => $sortBy,
            ],
        ]);
    }

    /**
     * Display doctor profile
     */
    public function show(int $id): Response
    {
        $doctor = DoctorProfile::with([
            'user',
            'specialty',
            'cities',
            'workingHours.city',
            'searchTag',
        ])
        ->verified()
        ->findOrFail($id);

        return Inertia::render('Public/DoctorProfile', [
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'email' => $doctor->user->email,
                'phone' => $doctor->user->phone,
                'specialty' => $doctor->specialty?->name,
                'image' => $doctor->profile_image_url,
                'bio' => $doctor->bio,
                'qualification' => $doctor->qualification,
                'experience_years' => $doctor->experience_years,
                'consultation_fee' => $doctor->consultation_fee,
                'website' => $doctor->website,
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                    'address' => $city->pivot->address,
                    'landmarks' => $city->pivot->landmarks,
                ]),
                'working_hours' => $doctor->workingHours->map(fn($wh) => [
                    'id' => $wh->id,
                    'city' => $wh->city?->name,
                    'timing_text' => $wh->timing_text,
                    'day_of_week' => $wh->day_of_week,
                    'opening_time' => $wh->opening_time?->format('H:i'),
                    'closing_time' => $wh->closing_time?->format('H:i'),
                ]),
            ],
        ]);
    }
}
