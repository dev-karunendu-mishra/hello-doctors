<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
            ->with(['user', 'specialty', 'cities', 'searchTag', 'workingHours', 'hospitalClinics.city', 'hospitalClinics.scheduleSlots'])
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
                'slug' => $doctor->slug,
                'name' => $doctor->user->name,
                'email' => $doctor->user->email,
                'phone' => $doctor->user->phone,
                'specialty' => $doctor->specialty?->name,
                'specialty_id' => $doctor->specialty?->id,
                'image' => $doctor->profile_image_url,
                'bio' => Str::limit($doctor->bio, 150),
                'cities' => $doctor->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                    'address' => $city->pivot->address,
                ]),
                'experience_years' => $doctor->experience_years,
                'consultation_fee' => $doctor->consultation_fee,
                'is_available_online' => $doctor->is_available_online,
                'is_available_today' => $this->isDoctorAvailableToday($doctor),
                'availability_preview' => $this->buildAvailabilityPreview($doctor),
                'website' => $doctor->website,
                'clinic_schedules' => $doctor->hospitalClinics
                    ->where('is_active', true)
                    ->values()
                    ->map(fn($clinic) => [
                        'id' => $clinic->id,
                        'hospital_clinic_name' => $clinic->hospital_clinic_name,
                        'city' => $clinic->city?->name,
                        'address' => $clinic->address,
                        'latitude' => $clinic->latitude,
                        'longitude' => $clinic->longitude,
                        'consultation_fee' => $clinic->consultation_fee,
                        'schedules' => $clinic->scheduleSlots
                            ->where('is_available', true)
                            ->sortBy('day_of_week')
                            ->values()
                            ->map(fn($slot) => [
                                'day_of_week' => \App\Models\DoctorScheduleSlot::DAYS_OF_WEEK[$slot->day_of_week] ?? 'Unknown',
                                'opening_time' => $slot->opening_time ? substr($slot->opening_time, 0, 5) : null,
                                'closing_time' => $slot->closing_time ? substr($slot->closing_time, 0, 5) : null,
                                'break_start_time' => $slot->break_start_time ? substr($slot->break_start_time, 0, 5) : null,
                                'break_end_time' => $slot->break_end_time ? substr($slot->break_end_time, 0, 5) : null,
                            ]),
                    ]),
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
    public function show(DoctorProfile $doctor): Response
    {
        $doctor->load([
            'user',
            'specialty',
            'cities',
            'workingHours.city',
            'hospitalClinics.city',
            'hospitalClinics.scheduleSlots',
            'searchTag',
        ]);

        // Only show verified doctors to the public
        if (!$doctor->is_verified) {
            abort(404);
        }

        return Inertia::render('Public/DoctorProfile', [
            'doctor' => [
                'id' => $doctor->id,
                'slug' => $doctor->slug,
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
                'is_available_today' => $this->isDoctorAvailableToday($doctor),
                'meta_title' => $doctor->meta_title,
                'meta_description' => $doctor->meta_description,
                'meta_keywords' => $doctor->meta_keywords,
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
                'clinic_schedules' => $doctor->hospitalClinics
                    ->where('is_active', true)
                    ->values()
                    ->map(fn($clinic) => [
                        'id' => $clinic->id,
                        'hospital_clinic_name' => $clinic->hospital_clinic_name,
                        'city' => $clinic->city?->name,
                        'address' => $clinic->address,
                        'latitude' => $clinic->latitude,
                        'longitude' => $clinic->longitude,
                        'consultation_fee' => $clinic->consultation_fee,
                        'schedules' => $clinic->scheduleSlots
                            ->where('is_available', true)
                            ->sortBy('day_of_week')
                            ->values()
                            ->map(fn($slot) => [
                                'day_of_week' => \App\Models\DoctorScheduleSlot::DAYS_OF_WEEK[$slot->day_of_week] ?? 'Unknown',
                                'opening_time' => $slot->opening_time ? substr($slot->opening_time, 0, 5) : null,
                                'closing_time' => $slot->closing_time ? substr($slot->closing_time, 0, 5) : null,
                                'break_start_time' => $slot->break_start_time ? substr($slot->break_start_time, 0, 5) : null,
                                'break_end_time' => $slot->break_end_time ? substr($slot->break_end_time, 0, 5) : null,
                            ]),
                    ]),
            ],
        ]);
    }

    private function isDoctorAvailableToday(DoctorProfile $doctor): bool
    {
        $todayNumber = now()->dayOfWeek;
        $todayName = strtolower(now()->format('l'));
        $todayShortName = substr($todayName, 0, 3);

        $hasClinicAvailability = $doctor->hospitalClinics
            ->where('is_active', true)
            ->contains(function ($clinic) use ($todayNumber) {
                return $clinic->scheduleSlots->contains(function ($slot) use ($todayNumber) {
                    return (bool) $slot->is_available && (int) $slot->day_of_week === $todayNumber;
                });
            });

        if ($hasClinicAvailability) {
            return true;
        }

        return $doctor->workingHours->contains(function ($workingHour) use ($todayName, $todayShortName) {
            $dayValue = strtolower((string) $workingHour->day_of_week);

            return (bool) $workingHour->is_available
                && ($dayValue === $todayName || $dayValue === $todayShortName);
        });
    }

    private function buildAvailabilityPreview(DoctorProfile $doctor): array
    {
        $primaryClinic = $doctor->hospitalClinics
            ->where('is_active', true)
            ->first(function ($clinic) {
                return $clinic->scheduleSlots->contains(fn($slot) => (bool) $slot->is_available);
            });

        if (!$primaryClinic) {
            return [
                'clinic_name' => null,
                'clinic_city' => null,
                'days' => [],
            ];
        }

        $days = collect(range(0, 2))->map(function ($offset) use ($primaryClinic) {
            $date = now()->copy()->startOfDay()->addDays($offset);
            $slot = $primaryClinic->scheduleSlots
                ->where('is_available', true)
                ->firstWhere('day_of_week', $date->dayOfWeek);

            $times = $slot ? $this->generatePreviewTimesFromSlot($slot) : [];
            $groupedTimes = collect($times)
                ->groupBy(function ($time) {
                    $hour = (int) date('G', strtotime($time));

                    return $hour < 12 ? 'Morning' : ($hour < 17 ? 'Afternoon' : 'Evening');
                })
                ->map(fn($items) => $items->values())
                ->toArray();

            return [
                'date' => $date->toDateString(),
                'label' => $offset === 0 ? 'Today' : ($offset === 1 ? 'Tomorrow' : $date->format('D, j M')),
                'slots_count' => count($times),
                'groups' => $groupedTimes,
            ];
        })->values()->all();

        return [
            'clinic_name' => $primaryClinic->hospital_clinic_name,
            'clinic_city' => $primaryClinic->city?->name,
            'days' => $days,
        ];
    }

    private function generatePreviewTimesFromSlot($slot): array
    {
        if (!$slot->opening_time || !$slot->closing_time) {
            return [];
        }

        $opening = now()->copy()->setTimeFromTimeString(substr((string) $slot->opening_time, 0, 5));
        $closing = now()->copy()->setTimeFromTimeString(substr((string) $slot->closing_time, 0, 5));
        $breakStart = $slot->break_start_time
            ? now()->copy()->setTimeFromTimeString(substr((string) $slot->break_start_time, 0, 5))
            : null;
        $breakEnd = $slot->break_end_time
            ? now()->copy()->setTimeFromTimeString(substr((string) $slot->break_end_time, 0, 5))
            : null;
        $duration = max((int) ($slot->slot_duration_minutes ?? 15), 15);
        $times = [];

        while ($opening < $closing && count($times) < 12) {
            if ($breakStart && $breakEnd && $opening >= $breakStart && $opening < $breakEnd) {
                $opening->addMinutes($duration);
                continue;
            }

            $slotEnd = $opening->copy()->addMinutes($duration);
            if ($slotEnd > $closing) {
                break;
            }

            $times[] = $opening->format('h:i A');
            $opening->addMinutes($duration);
        }

        return $times;
    }
}
