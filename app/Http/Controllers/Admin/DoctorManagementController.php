<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\City;
use App\Models\Clinic;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DoctorManagementController extends Controller
{
    /**
     * Display doctors list
     */
    public function index(Request $request): Response
    {
        $query = DoctorProfile::with(['user', 'specialty', 'cities']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        // Filter by city
        if ($request->filled('city')) {
            $query->byCity($request->city);
        }

        // Filter by specialty
        if ($request->filled('specialty')) {
            $query->bySpecialty($request->specialty);
        }

        // Filter by status
        if ($request->filled('status')) {
            switch ($request->status) {
                case 'verified':
                    $query->where('is_verified', true);
                    break;
                case 'unverified':
                    $query->where('is_verified', false);
                    break;
                case 'active':
                    $query->active();
                    break;
                case 'inactive':
                    $query->whereHas('user', fn($q) => $q->where('is_active', false));
                    break;
            }
        }

        $doctors = $query->paginate(20)->through(fn($doctor) => [
            'id' => $doctor->id,
            'slug' => $doctor->slug,
            'name' => $doctor->user->name,
            'email' => $doctor->user->email,
            'phone' => $doctor->user->phone,
            'specialty' => $doctor->specialty?->name,
            'profile_image_url' => $doctor->profile_image_url,
            'cities' => $doctor->cities->map(fn($city) => [
                'id' => $city->id,
                'name' => $city->name,
            ]),
            'is_verified' => $doctor->is_verified,
            'is_active' => $doctor->user->is_active,
            'created_at' => $doctor->created_at->format('Y-m-d'),
        ]);

        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        return Inertia::render('Admin/Doctors/Index', [
            'doctors' => $doctors,
            'cities' => $cities,
            'specialties' => $specialties,
            'filters' => $request->only(['search', 'city', 'specialty', 'status']),
        ]);
    }

    /**
     * Get existing images from images/doctors folder
     */
    public function getExistingImages()
    {
        $imagesPath = public_path('images/doctors');
        $images = [];

        if (File::exists($imagesPath)) {
            $files = File::files($imagesPath);
            foreach ($files as $file) {
                $images[] = [
                    'path' => 'images/doctors/' . $file->getFilename(),
                    'url' => asset('images/doctors/' . $file->getFilename()),
                    'name' => $file->getFilename(),
                ];
            }
        }

        return response()->json($images);
    }

    /**
     * Show create form
     */
    public function create(): Response
    {
        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        // Get existing images
        $imagesPath = public_path('images/doctors');
        $existingImages = [];
        if (File::exists($imagesPath)) {
            $files = File::files($imagesPath);
            foreach ($files as $file) {
                $existingImages[] = [
                    'path' => 'images/doctors/' . $file->getFilename(),
                    'url' => asset('images/doctors/' . $file->getFilename()),
                    'name' => $file->getFilename(),
                ];
            }
        }

        return Inertia::render('Admin/Doctors/Create', [
            'cities' => $cities,
            'specialties' => $specialties,
            'existingImages' => $existingImages,
        ]);
    }

    /**
     * Store new doctor
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|min:8',
            'specialization_id' => 'required|exists:specialties,id',
            'license_number' => 'nullable|string|unique:doctor_profiles,license_number',
            'qualification' => 'nullable|string',
            'experience_years' => 'nullable|integer|min:0',
            'consultation_fee' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'website' => 'nullable|url',
            'profile_image' => 'nullable|string',
            'profile_image_file' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            'cities' => 'array',
            'cities.*.city_id' => 'required|exists:cities,id',
            'cities.*.address' => 'nullable|string',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords' => 'nullable|string|max:255',
        ]);

        foreach (($validated['clinics'] ?? []) as $clinicIndex => $clinicData) {
            foreach (($clinicData['schedules'] ?? []) as $scheduleIndex => $scheduleData) {
                $isAvailable = (bool) ($scheduleData['is_available'] ?? false);

                if (!$isAvailable) {
                    continue;
                }

                $opening = $scheduleData['opening_time'] ?? null;
                $closing = $scheduleData['closing_time'] ?? null;

                if (empty($opening) || empty($closing)) {
                    throw ValidationException::withMessages([
                        "clinics.{$clinicIndex}.schedules.{$scheduleIndex}.opening_time" => 'Opening and closing time are required when day is ON.',
                    ]);
                }

                if (strtotime($opening) >= strtotime($closing)) {
                    throw ValidationException::withMessages([
                        "clinics.{$clinicIndex}.schedules.{$scheduleIndex}.closing_time" => 'Closing time must be after opening time.',
                    ]);
                }
            }
        }

        DB::beginTransaction();

        try {
            // Handle image upload or selection
            $profileImagePath = null;
            if ($request->hasFile('profile_image_file')) {
                $file = $request->file('profile_image_file');
                $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                $file->move(public_path('images/doctors'), $filename);
                $profileImagePath = 'images/doctors/' . $filename;
            } elseif ($request->filled('profile_image')) {
                $profileImagePath = $validated['profile_image'];
            }

            // Create user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'],
                'role' => 'doctor',
                'is_active' => true,
            ]);

            // Create doctor profile
            $doctor = DoctorProfile::create([
                'user_id' => $user->id,
                'specialization_id' => $validated['specialization_id'],
                'license_number' => $validated['license_number'] ?? null,
                'qualification' => $validated['qualification'] ?? null,
                'experience_years' => $validated['experience_years'] ?? null,
                'consultation_fee' => $validated['consultation_fee'] ?? null,
                'bio' => $validated['bio'] ?? null,
                'website' => $validated['website'] ?? null,
                'profile_image' => $profileImagePath,
                'is_verified' => true,
                'meta_title' => $validated['meta_title'] ?? null,
                'meta_description' => $validated['meta_description'] ?? null,
                'meta_keywords' => $validated['meta_keywords'] ?? null,
            ]);

            // Associate cities
            if (!empty($validated['cities'])) {
                foreach ($validated['cities'] as $cityData) {
                    $doctor->cities()->attach($cityData['city_id'], [
                        'address' => $cityData['address'] ?? null,
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.doctors.index')
                ->with('success', 'Doctor created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create doctor.'])->withInput();
        }
    }

    /**
     * Show doctor details
     */
    public function show(DoctorProfile $doctor): Response
    {
        $doctor->load([
            'user',
            'specialty',
            'cities',
            'hospitalClinics.city',
            'hospitalClinics.scheduleSlots',
            'practiceLocations.address.cityRecord',
            'practiceLocations.clinic',
            'practiceLocations.schedules',
        ]);

        return Inertia::render('Admin/Doctors/Show', [
            'doctor' => [
                'id' => $doctor->id,
                'slug' => $doctor->slug,
                'name' => $doctor->user->name,
                'email' => $doctor->user->email,
                'phone' => $doctor->user->phone,
                'address' => $doctor->user->address,
                'specialty' => $doctor->specialty,
                'license_number' => $doctor->license_number,
                'qualification' => $doctor->qualification,
                'experience_years' => $doctor->experience_years,
                'consultation_fee' => $doctor->consultation_fee,
                'bio' => $doctor->bio,
                'profile_image' => $doctor->profile_image,
                'profile_image_url' => $doctor->profile_image_url,
                'website' => $doctor->website,
                'is_verified' => $doctor->is_verified,
                'is_active' => $doctor->user->is_active,
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                ])->values(),
                'meta_title' => $doctor->meta_title,
                'meta_description' => $doctor->meta_description,
                'meta_keywords' => $doctor->meta_keywords,
                'practice_locations' => $doctor->practiceLocations
                    ->sortByDesc(fn ($location) => (int) $location->is_primary)
                    ->values()
                    ->map(fn ($location) => $this->formatPracticeLocationForAdmin($location))
                    ->values(),
                'hospital_clinics' => $doctor->hospitalClinics
                    ->map(fn ($clinic) => $this->formatLegacyClinicForAdmin($clinic))
                    ->values(),
                'created_at' => optional($doctor->created_at)?->toDateTimeString(),
                'updated_at' => optional($doctor->updated_at)?->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(DoctorProfile $doctor): Response
    {
        $doctor->load([
            'user',
            'cities',
            'hospitalClinics.city',
            'hospitalClinics.scheduleSlots',
            'practiceLocations.address.cityRecord',
            'practiceLocations.clinic',
            'practiceLocations.schedules',
        ]);

        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        // Get existing images
        $imagesPath = public_path('images/doctors');
        $existingImages = [];
        if (File::exists($imagesPath)) {
            $files = File::files($imagesPath);
            foreach ($files as $file) {
                $existingImages[] = [
                    'path' => 'images/doctors/' . $file->getFilename(),
                    'url' => asset('images/doctors/' . $file->getFilename()),
                    'name' => $file->getFilename(),
                ];
            }
        }

        return Inertia::render('Admin/Doctors/Edit', [
            'doctor' => [
                'id' => $doctor->id,
                'slug' => $doctor->slug,
                'name' => $doctor->user->name,
                'email' => $doctor->user->email,
                'phone' => $doctor->user->phone,
                'address' => $doctor->user->address,
                'specialization_id' => $doctor->specialization_id,
                'license_number' => $doctor->license_number,
                'qualification' => $doctor->qualification,
                'experience_years' => $doctor->experience_years,
                'consultation_fee' => $doctor->consultation_fee,
                'bio' => $doctor->bio,
                'website' => $doctor->website,
                'profile_image' => $doctor->profile_image,
                'profile_image_url' => $doctor->profile_image_url,
                'is_verified' => $doctor->is_verified,
                'is_active' => $doctor->user->is_active,
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities->map(fn($city) => [
                    'id' => $city->id,
                    'name' => $city->name,
                ])->values(),
                'practice_locations' => $doctor->practiceLocations
                    ->sortByDesc(fn ($location) => (int) $location->is_primary)
                    ->values()
                    ->map(fn ($location) => $this->formatPracticeLocationForAdmin($location))
                    ->values(),
                'hospital_clinics' => $doctor->hospitalClinics
                    ->map(fn ($clinic) => $this->formatLegacyClinicForAdmin($clinic))
                    ->values(),
            ],
            'cities' => $cities,
            'specialties' => $specialties,
            'existingImages' => $existingImages,
        ]);
    }

    /**
     * Update doctor
     */
    public function update(Request $request, DoctorProfile $doctor): RedirectResponse
    {
        $request->merge([
            'clinics' => collect($request->input('clinics', []))
                ->map(function ($clinic) {
                    $clinic['schedules'] = collect($clinic['schedules'] ?? [])
                        ->map(function ($schedule) {
                            foreach (['opening_time', 'closing_time', 'break_start_time', 'break_end_time'] as $field) {
                                $schedule[$field] = $this->normalizeTimeValue($schedule[$field] ?? null);
                            }

                            return $schedule;
                        })
                        ->all();

                    return $clinic;
                })
                ->all(),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'specialization_id' => 'required|exists:specialties,id',
            'license_number' => 'nullable|string|unique:doctor_profiles,license_number,' . $doctor->id,
            'qualification' => 'nullable|string',
            'experience_years' => 'nullable|integer|min:0',
            'consultation_fee' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'website' => 'nullable|url',
            'profile_image' => 'nullable|string',
            'profile_image_file' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'is_available_online' => 'boolean',
            'cities' => 'array',
            'cities.*' => 'exists:cities,id',
            'clinics' => 'array',
            'clinics.*.id' => 'nullable|integer|exists:doctor_hospital_clinics,id',
            'clinics.*.doctor_practice_location_id' => 'nullable|integer|exists:doctor_practice_locations,id',
            'clinics.*.clinic_entity_id' => 'nullable|integer|exists:clinics,id',
            'clinics.*.unified_address_id' => 'nullable|integer|exists:addresses,id',
            'clinics.*.clinic_type' => 'nullable|in:clinic,hospital,chamber,diagnostic_center',
            'clinics.*.is_primary' => 'boolean',
            'clinics.*.hospital_clinic_name' => 'required|string|max:100',
            'clinics.*.address' => 'required|string',
            'clinics.*.latitude' => 'nullable|numeric|between:-90,90',
            'clinics.*.longitude' => 'nullable|numeric|between:-180,180',
            'clinics.*.landmarks' => 'nullable|string|max:255',
            'clinics.*.city_id' => 'required|exists:cities,id',
            'clinics.*.phone' => 'nullable|string|max:20',
            'clinics.*.email' => 'nullable|email|max:100',
            'clinics.*.consultation_fee' => 'nullable|numeric|min:0|max:999999.99',
            'clinics.*.is_active' => 'boolean',
            'clinics.*.schedules' => 'nullable|array',
            'clinics.*.schedules.*.day_of_week' => 'required|integer|between:0,6',
            'clinics.*.schedules.*.opening_time' => 'nullable|date_format:H:i',
            'clinics.*.schedules.*.closing_time' => 'nullable|date_format:H:i|after:clinics.*.schedules.*.opening_time',
            'clinics.*.schedules.*.break_start_time' => 'nullable|date_format:H:i',
            'clinics.*.schedules.*.break_end_time' => 'nullable|date_format:H:i|after:clinics.*.schedules.*.break_start_time',
            'clinics.*.schedules.*.slot_duration_minutes' => 'nullable|integer|min:5|max:180',
            'clinics.*.schedules.*.max_appointments_per_slot' => 'nullable|integer|min:1|max:10',
            'clinics.*.schedules.*.is_available' => 'boolean',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            // Handle image upload or selection
            $profileImagePath = $doctor->profile_image;
            if ($request->hasFile('profile_image_file')) {
                // Delete old custom uploaded image (not seeded ones)
                if ($doctor->profile_image && str_starts_with($doctor->profile_image, 'images/doctors/') && str_contains($doctor->profile_image, '_')) {
                    $oldImagePath = public_path($doctor->profile_image);
                    if (File::exists($oldImagePath)) {
                        File::delete($oldImagePath);
                    }
                }
                
                $file = $request->file('profile_image_file');
                $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                $file->move(public_path('images/doctors'), $filename);
                $profileImagePath = 'images/doctors/' . $filename;
            } elseif ($request->filled('profile_image')) {
                $profileImagePath = $validated['profile_image'];
            }

            // Update user
            $doctor->user->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Update doctor profile
            $doctor->update([
                'specialization_id' => $validated['specialization_id'],
                'license_number' => $validated['license_number'] ?? null,
                'qualification' => $validated['qualification'] ?? null,
                'experience_years' => $validated['experience_years'] ?? null,
                'consultation_fee' => $validated['consultation_fee'] ?? null,
                'bio' => $validated['bio'] ?? null,
                'website' => $validated['website'] ?? null,
                'profile_image' => $profileImagePath,
                'is_verified' => $validated['is_verified'] ?? false,
                'is_available_online' => $validated['is_available_online'] ?? false,
                'meta_title' => $validated['meta_title'] ?? null,
                'meta_description' => $validated['meta_description'] ?? null,
                'meta_keywords' => $validated['meta_keywords'] ?? null,
            ]);

            // Update cities
            if (!empty($validated['cities'])) {
                $doctor->cities()->detach();
                foreach ($validated['cities'] as $cityId) {
                    $doctor->cities()->attach($cityId, [
                        'address' => null,
                    ]);
                }
            }

            if (array_key_exists('clinics', $validated)) {
                $retainedLegacyClinicIds = [];
                $retainedPracticeLocationIds = [];

                foreach ($validated['clinics'] as $clinicData) {
                    $clinic = null;
                    $clinicId = $clinicData['id'] ?? null;
                    $practiceLocationId = $clinicData['doctor_practice_location_id'] ?? null;

                    if ($clinicId) {
                        $clinic = DoctorHospitalClinic::query()
                            ->where('doctor_profile_id', $doctor->id)
                            ->where('id', $clinicId)
                            ->first();
                    }

                    if (!$clinic && $practiceLocationId) {
                        $practiceLocation = DoctorPracticeLocation::query()
                            ->with(['address', 'clinic'])
                            ->where('doctor_profile_id', $doctor->id)
                            ->whereKey($practiceLocationId)
                            ->first();

                        if ($practiceLocation) {
                            $clinic = $this->resolveLegacyClinicFromPracticeLocation($practiceLocation);
                        }
                    }

                    if ($clinic) {
                        $clinic->update([
                            'hospital_clinic_name' => trim($clinicData['hospital_clinic_name']),
                            'address' => $clinicData['address'],
                            'latitude' => $clinicData['latitude'] ?? null,
                            'longitude' => $clinicData['longitude'] ?? null,
                            'landmarks' => $clinicData['landmarks'] ?? null,
                            'city_id' => $clinicData['city_id'],
                            'phone' => $clinicData['phone'] ?? null,
                            'email' => $clinicData['email'] ?? null,
                            'consultation_fee' => $clinicData['consultation_fee'] ?? null,
                            'is_active' => $clinicData['is_active'] ?? true,
                        ]);
                    } else {
                        $clinic = DoctorHospitalClinic::create([
                            'doctor_profile_id' => $doctor->id,
                            'hospital_clinic_name' => trim($clinicData['hospital_clinic_name']),
                            'address' => $clinicData['address'],
                            'latitude' => $clinicData['latitude'] ?? null,
                            'longitude' => $clinicData['longitude'] ?? null,
                            'landmarks' => $clinicData['landmarks'] ?? null,
                            'city_id' => $clinicData['city_id'],
                            'phone' => $clinicData['phone'] ?? null,
                            'email' => $clinicData['email'] ?? null,
                            'consultation_fee' => $clinicData['consultation_fee'] ?? null,
                            'is_active' => $clinicData['is_active'] ?? true,
                        ]);
                    }

                    $retainedLegacyClinicIds[] = (int) $clinic->id;

                    $practiceLocation = $this->syncUnifiedClinicEntities(
                        $clinic->fresh(['city', 'doctorProfile.user']),
                        $clinicData
                    );

                    $retainedPracticeLocationIds[] = (int) $practiceLocation->id;

                    $submittedSchedules = collect($clinicData['schedules'] ?? [])
                        ->unique('day_of_week')
                        ->values();

                    $submittedDays = $submittedSchedules
                        ->pluck('day_of_week')
                        ->map(fn($day) => (int) $day)
                        ->values();

                    $clinic->scheduleSlots()
                        ->whereNotIn('day_of_week', $submittedDays)
                        ->delete();

                    $practiceLocation->schedules()
                        ->whereNotIn('day_of_week', $submittedDays)
                        ->delete();

                    foreach ($submittedSchedules as $scheduleData) {
                        $isAvailable = (bool) ($scheduleData['is_available'] ?? false);
                        $attributes = [
                            'opening_time' => $isAvailable ? ($scheduleData['opening_time'] ?? null) : null,
                            'closing_time' => $isAvailable ? ($scheduleData['closing_time'] ?? null) : null,
                            'break_start_time' => $isAvailable ? ($scheduleData['break_start_time'] ?? null) : null,
                            'break_end_time' => $isAvailable ? ($scheduleData['break_end_time'] ?? null) : null,
                            'slot_duration_minutes' => (int) ($scheduleData['slot_duration_minutes'] ?? 30),
                            'max_appointments_per_slot' => (int) ($scheduleData['max_appointments_per_slot'] ?? 1),
                            'is_available' => $isAvailable,
                        ];

                        $clinic->scheduleSlots()->updateOrCreate(
                            ['day_of_week' => (int) $scheduleData['day_of_week']],
                            $attributes
                        );

                        $practiceLocation->schedules()->updateOrCreate(
                            ['doctor_practice_location_id' => $practiceLocation->id, 'day_of_week' => (int) $scheduleData['day_of_week']],
                            $attributes
                        );
                    }
                }

                $legacyClinicsToDelete = $doctor->hospitalClinics();
                if (!empty($retainedLegacyClinicIds)) {
                    $legacyClinicsToDelete->whereNotIn('id', $retainedLegacyClinicIds);
                }

                $legacyClinicsToDelete
                    ->get()
                    ->each(fn(DoctorHospitalClinic $clinic) => $this->deleteLegacyClinicAndUnifiedData($clinic));

                $practiceLocationsToDelete = $doctor->practiceLocations()->with(['address', 'clinic']);
                if (!empty($retainedPracticeLocationIds)) {
                    $practiceLocationsToDelete->whereNotIn('id', $retainedPracticeLocationIds);
                }

                $practiceLocationsToDelete
                    ->get()
                    ->each(fn(DoctorPracticeLocation $location) => $this->deleteUnifiedPracticeLocation($location));
            }

            DB::commit();

            return redirect()->route('admin.doctors.index')
                ->with('success', 'Doctor updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update doctor.'])->withInput();
        }
    }

    private function formatPracticeLocationForAdmin(DoctorPracticeLocation $location): array
    {
        $address = $location->address;
        $city = $address?->cityRecord;

        return [
            'id' => data_get($address?->meta, 'legacy_id'),
            'doctor_practice_location_id' => $location->id,
            'clinic_entity_id' => $location->clinic_id,
            'unified_address_id' => $address?->id,
            'clinic_type' => $location->clinic?->type ?? 'clinic',
            'hospital_clinic_name' => $location->display_name ?: $location->clinic?->name ?: 'Private Practice',
            'address' => collect([$address?->line1, $address?->line2])->filter()->join(', '),
            'latitude' => $address?->latitude,
            'longitude' => $address?->longitude,
            'landmarks' => $address?->landmark,
            'city_id' => $address?->city_id,
            'city' => $city ? [
                'id' => $city->id,
                'name' => $city->name,
            ] : null,
            'phone' => $location->resolved_contact_phone,
            'email' => $location->resolved_contact_email,
            'consultation_fee' => $location->consultation_fee,
            'is_primary' => (bool) $location->is_primary,
            'is_active' => (bool) $location->is_active,
            'schedules' => $this->formatSchedulesForAdmin($location->schedules),
        ];
    }

    private function formatLegacyClinicForAdmin(DoctorHospitalClinic $clinic): array
    {
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);
        $address = $practiceLocation?->address;

        return [
            'id' => $clinic->id,
            'doctor_practice_location_id' => $practiceLocation?->id,
            'clinic_entity_id' => $practiceLocation?->clinic_id,
            'unified_address_id' => $address?->id,
            'clinic_type' => $practiceLocation?->clinic?->type ?? 'clinic',
            'hospital_clinic_name' => $practiceLocation?->display_name ?: $clinic->hospital_clinic_name,
            'address' => $address
                ? collect([$address->line1, $address->line2])->filter()->join(', ')
                : $clinic->address,
            'latitude' => $address?->latitude ?? $clinic->latitude,
            'longitude' => $address?->longitude ?? $clinic->longitude,
            'landmarks' => $address?->landmark ?? $clinic->landmarks,
            'city_id' => $address?->city_id ?? $clinic->city_id,
            'phone' => $practiceLocation?->resolved_contact_phone ?? $clinic->phone,
            'email' => $practiceLocation?->resolved_contact_email ?? $clinic->email,
            'consultation_fee' => $practiceLocation?->consultation_fee ?? $clinic->consultation_fee,
            'is_primary' => (bool) ($practiceLocation?->is_primary ?? false),
            'is_active' => (bool) ($practiceLocation?->is_active ?? $clinic->is_active),
            'schedules' => $practiceLocation
                ? $this->formatSchedulesForAdmin($practiceLocation->schedules)
                : $this->formatSchedulesForAdmin($clinic->scheduleSlots),
        ];
    }

    private function formatSchedulesForAdmin($schedules): array
    {
        return collect($schedules)
            ->sortBy('day_of_week')
            ->map(fn($schedule) => [
                'day_of_week' => $schedule->day_of_week,
                'opening_time' => $this->normalizeTimeValue($schedule->opening_time),
                'closing_time' => $this->normalizeTimeValue($schedule->closing_time),
                'break_start_time' => $this->normalizeTimeValue($schedule->break_start_time),
                'break_end_time' => $this->normalizeTimeValue($schedule->break_end_time),
                'slot_duration_minutes' => $schedule->slot_duration_minutes,
                'max_appointments_per_slot' => $schedule->max_appointments_per_slot,
                'is_available' => (bool) $schedule->is_available,
            ])
            ->values()
            ->all();
    }

    private function resolvePracticeLocationFromLegacyClinic(DoctorHospitalClinic $legacyClinic, ?int $preferredPracticeLocationId = null): ?DoctorPracticeLocation
    {
        if ($preferredPracticeLocationId) {
            $preferredLocation = DoctorPracticeLocation::query()
                ->with(['address.cityRecord', 'clinic', 'schedules', 'doctorProfile.user'])
                ->where('doctor_profile_id', $legacyClinic->doctor_profile_id)
                ->whereKey($preferredPracticeLocationId)
                ->first();

            if ($preferredLocation) {
                return $preferredLocation;
            }
        }

        return DoctorPracticeLocation::query()
            ->with(['address.cityRecord', 'clinic', 'schedules', 'doctorProfile.user'])
            ->where('doctor_profile_id', $legacyClinic->doctor_profile_id)
            ->where(function ($query) use ($legacyClinic) {
                $query->whereHas('address', function ($addressQuery) use ($legacyClinic) {
                    $addressQuery->where('meta->legacy_source', 'doctor_hospital_clinics')
                        ->where('meta->legacy_id', $legacyClinic->id);
                })->orWhere(function ($fallbackQuery) use ($legacyClinic) {
                    $fallbackQuery->where('display_name', trim((string) $legacyClinic->hospital_clinic_name))
                        ->whereHas('address', function ($addressQuery) use ($legacyClinic) {
                            $addressQuery->where('city_id', $legacyClinic->city_id);
                        });
                });
            })
            ->first();
    }

    private function resolveLegacyClinicFromPracticeLocation(DoctorPracticeLocation $practiceLocation): ?DoctorHospitalClinic
    {
        $legacyId = data_get($practiceLocation->address?->meta, 'legacy_id');

        if ($legacyId) {
            return DoctorHospitalClinic::query()
                ->where('doctor_profile_id', $practiceLocation->doctor_profile_id)
                ->whereKey($legacyId)
                ->first();
        }

        $name = trim((string) ($practiceLocation->display_name ?: $practiceLocation->clinic?->name));
        if ($name === '') {
            return null;
        }

        return DoctorHospitalClinic::query()
            ->where('doctor_profile_id', $practiceLocation->doctor_profile_id)
            ->where('city_id', $practiceLocation->address?->city_id)
            ->whereRaw('LOWER(hospital_clinic_name) = ?', [mb_strtolower($name)])
            ->first();
    }

    private function syncUnifiedClinicEntities(DoctorHospitalClinic $legacyClinic, array $payload = []): DoctorPracticeLocation
    {
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic(
            $legacyClinic,
            $payload['doctor_practice_location_id'] ?? null
        );

        $clinicEntity = $practiceLocation?->clinic;
        if (!$clinicEntity && !empty($payload['clinic_entity_id'])) {
            $clinicEntity = Clinic::query()->find($payload['clinic_entity_id']);
        }
        $clinicEntity = $clinicEntity ?: new Clinic();

        $clinicEntity->fill([
            'name' => trim($payload['hospital_clinic_name'] ?? $legacyClinic->hospital_clinic_name),
            'type' => $payload['clinic_type'] ?? $clinicEntity->type ?? 'clinic',
            'phone' => $payload['phone'] ?? $legacyClinic->phone,
            'email' => $payload['email'] ?? $legacyClinic->email,
            'website' => $clinicEntity->website,
            'is_active' => (bool) ($payload['is_active'] ?? $legacyClinic->is_active),
        ]);
        $clinicEntity->save();

        $city = City::query()->find($payload['city_id'] ?? $legacyClinic->city_id);
        $normalizedAddress = $this->normalizeAddressLines($payload['address'] ?? $legacyClinic->address);
        $meta = array_merge($practiceLocation?->address?->meta ?? [], [
            'legacy_source' => 'doctor_hospital_clinics',
            'legacy_id' => $legacyClinic->id,
        ]);

        if ($normalizedAddress['was_truncated']) {
            $meta['full_address'] = $normalizedAddress['full_address'];
        }

        $address = $practiceLocation?->address;
        if (!$address && !empty($payload['unified_address_id'])) {
            $address = Address::query()->find($payload['unified_address_id']);
        }
        $address = $address ?: new Address();
        $address->fill([
            'addressable_type' => Clinic::class,
            'addressable_id' => $clinicEntity->id,
            'label' => 'Clinic Address',
            'line1' => $normalizedAddress['line1'],
            'line2' => $normalizedAddress['line2'],
            'landmark' => $payload['landmarks'] ?? $legacyClinic->landmarks,
            'city' => $city?->name,
            'city_id' => $city?->id,
            'state' => $city?->state,
            'pincode' => $address->pincode,
            'latitude' => $payload['latitude'] ?? $legacyClinic->latitude,
            'longitude' => $payload['longitude'] ?? $legacyClinic->longitude,
            'is_primary' => true,
            'meta' => $meta,
        ]);
        $address->save();

        $requestedIsPrimary = array_key_exists('is_primary', $payload)
            ? (bool) $payload['is_primary']
            : null;

        if ($requestedIsPrimary === true) {
            DoctorPracticeLocation::query()
                ->where('doctor_profile_id', $legacyClinic->doctor_profile_id)
                ->when($practiceLocation?->exists, fn($query) => $query->whereKeyNot($practiceLocation->id))
                ->update(['is_primary' => false]);
        }

        if ($requestedIsPrimary === false) {
            $isPrimary = !$this->doctorProfileHasPrimaryPracticeLocation(
                (int) $legacyClinic->doctor_profile_id,
                $practiceLocation?->id
            );
        } else {
            $isPrimary = $requestedIsPrimary
                ?? ($practiceLocation?->exists
                    ? (bool) $practiceLocation->is_primary
                    : !$this->doctorProfileHasPrimaryPracticeLocation((int) $legacyClinic->doctor_profile_id));
        }

        $practiceLocation = $practiceLocation ?: new DoctorPracticeLocation();
        $practiceLocation->fill([
            'doctor_profile_id' => $legacyClinic->doctor_profile_id,
            'clinic_id' => $clinicEntity->id,
            'address_id' => $address->id,
            'display_name' => trim($payload['hospital_clinic_name'] ?? $legacyClinic->hospital_clinic_name),
            'consultation_fee' => $payload['consultation_fee'] ?? $legacyClinic->consultation_fee,
            'contact_phone' => $payload['phone'] ?? $legacyClinic->phone ?? $legacyClinic->doctorProfile?->user?->phone,
            'contact_email' => $payload['email'] ?? $legacyClinic->email ?? $legacyClinic->doctorProfile?->user?->email,
            'is_primary' => (bool) $isPrimary,
            'is_active' => (bool) ($payload['is_active'] ?? $legacyClinic->is_active),
        ]);
        $practiceLocation->save();

        return $practiceLocation->fresh(['address.cityRecord', 'clinic', 'schedules']);
    }

    private function deleteLegacyClinicAndUnifiedData(DoctorHospitalClinic $clinic): void
    {
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);
        $clinic->delete();

        if ($practiceLocation) {
            $this->deleteUnifiedPracticeLocation($practiceLocation);
        }
    }

    private function deleteUnifiedPracticeLocation(DoctorPracticeLocation $practiceLocation): void
    {
        $address = $practiceLocation->address;
        $clinicEntity = $practiceLocation->clinic;

        $practiceLocation->delete();

        if ($address && !$address->practiceLocations()->exists()) {
            $address->delete();
        }

        if ($clinicEntity && !$clinicEntity->practiceLocations()->exists()) {
            $clinicEntity->addresses()->delete();
            $clinicEntity->delete();
        }
    }

    private function doctorProfileHasPrimaryPracticeLocation(int $doctorProfileId, ?int $ignoreLocationId = null): bool
    {
        return DoctorPracticeLocation::query()
            ->where('doctor_profile_id', $doctorProfileId)
            ->when($ignoreLocationId, fn($query) => $query->whereKeyNot($ignoreLocationId))
            ->where('is_primary', true)
            ->exists();
    }

    /**
     * @return array{line1: string, line2: ?string, full_address: string, was_truncated: bool}
     */
    private function normalizeAddressLines(?string $line1, ?string $line2 = null): array
    {
        $rawLine1 = trim((string) $line1);
        $rawLine2 = $line2 !== null ? trim((string) $line2) : null;
        $fullAddress = trim(implode(', ', array_filter([$rawLine1, $rawLine2])));

        $normalizedLine1 = mb_substr($rawLine1, 0, 255);
        $overflow = trim(mb_substr($rawLine1, 255));
        $normalizedLine2 = trim(implode(' ', array_filter([$overflow, $rawLine2])));

        if ($normalizedLine2 === '') {
            $normalizedLine2 = null;
        }

        return [
            'line1' => $normalizedLine1 !== '' ? $normalizedLine1 : 'Address not provided',
            'line2' => $normalizedLine2,
            'full_address' => $fullAddress,
            'was_truncated' => mb_strlen($rawLine1) > 255,
        ];
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

    /**
     * Delete doctor
     */
    public function destroy(DoctorProfile $doctor): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $doctor->cities()->detach();
            $doctor->workingHours()->delete();
            $doctor->searchTag()->delete();
            $doctor->delete();
            $doctor->user->delete();

            DB::commit();

            return back()->with('success', 'Doctor deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete doctor.']);
        }
    }

    /**
     * Toggle verification status
     */
    public function toggleVerification(DoctorProfile $doctor): RedirectResponse
    {
        $doctor->update(['is_verified' => !$doctor->is_verified]);

        return back()->with('success', 'Doctor verification status updated!');
    }

    /**
     * Toggle active status
     */
    public function toggleActive(DoctorProfile $doctor): RedirectResponse
    {
        $doctor->user->update(['is_active' => !$doctor->user->is_active]);

        return back()->with('success', 'Doctor active status updated!');
    }
}
