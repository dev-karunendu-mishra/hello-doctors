<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

        if (\File::exists($imagesPath)) {
            $files = \File::files($imagesPath);
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
        if (\File::exists($imagesPath)) {
            $files = \File::files($imagesPath);
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
        $doctor->load(['user', 'specialty', 'cities', 'workingHours']);

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
                'profile_image' => $doctor->profile_image_url,
                'website' => $doctor->website,
                'is_verified' => $doctor->is_verified,
                'is_active' => $doctor->user->is_active,
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities,
                'working_hours' => $doctor->workingHours,
                'created_at' => $doctor->created_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(DoctorProfile $doctor): Response
    {
        $doctor->load(['user', 'cities', 'hospitalClinics.city']);

        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        // Get existing images
        $imagesPath = public_path('images/doctors');
        $existingImages = [];
        if (\File::exists($imagesPath)) {
            $files = \File::files($imagesPath);
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
                'hospital_clinics' => $doctor->hospitalClinics->map(fn($clinic) => [
                    'id' => $clinic->id,
                    'hospital_clinic_name' => $clinic->hospital_clinic_name,
                    'address' => $clinic->address,
                    'latitude' => $clinic->latitude,
                    'longitude' => $clinic->longitude,
                    'landmarks' => $clinic->landmarks,
                    'city_id' => $clinic->city_id,
                    'phone' => $clinic->phone,
                    'email' => $clinic->email,
                    'consultation_fee' => $clinic->consultation_fee,
                    'is_active' => (bool) $clinic->is_active,
                ]),
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
                    if (\File::exists($oldImagePath)) {
                        \File::delete($oldImagePath);
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
                $submittedClinicIds = collect($validated['clinics'])
                    ->pluck('id')
                    ->filter()
                    ->map(fn($id) => (int) $id)
                    ->values();

                DoctorHospitalClinic::query()
                    ->where('doctor_profile_id', $doctor->id)
                    ->when($submittedClinicIds->isNotEmpty(), fn($query) => $query->whereNotIn('id', $submittedClinicIds))
                    ->when($submittedClinicIds->isEmpty(), fn($query) => $query)
                    ->delete();

                foreach ($validated['clinics'] as $clinicData) {
                    $clinicId = $clinicData['id'] ?? null;

                    if ($clinicId) {
                        $clinic = DoctorHospitalClinic::query()
                            ->where('doctor_profile_id', $doctor->id)
                            ->where('id', $clinicId)
                            ->first();

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

                            continue;
                        }
                    }

                    DoctorHospitalClinic::create([
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
            }

            DB::commit();

            return redirect()->route('admin.doctors.index')
                ->with('success', 'Doctor updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update doctor.'])->withInput();
        }
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
