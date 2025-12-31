<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDoctorProfileRequest;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display doctor profile
     */
    public function show(): Response
    {
        $doctor = DoctorProfile::with([
            'user',
            'specialty',
            'cities',
            'workingHours',
        ])->where('user_id', auth()->id())->firstOrFail();

        return Inertia::render('Doctor/Profile/Show', [
            'doctor' => [
                'id' => $doctor->id,
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
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities,
                'working_hours' => $doctor->workingHours,
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(): Response
    {
        $doctor = DoctorProfile::with(['user', 'cities', 'workingHours'])
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        return Inertia::render('Doctor/Profile/Edit', [
            'doctor' => [
                'id' => $doctor->id,
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
                'profile_image' => $doctor->profile_image_url,
                'website' => $doctor->website,
                'is_available_online' => $doctor->is_available_online,
                'cities' => $doctor->cities->map(fn($city) => [
                    'city_id' => $city->id,
                    'city_name' => $city->name,
                    'address' => $city->pivot->address,
                    'landmarks' => $city->pivot->landmarks,
                ]),
                'working_hours' => $doctor->workingHours,
            ],
            'cities' => $cities,
            'specialties' => $specialties,
        ]);
    }

    /**
     * Update doctor profile
     */
    public function update(UpdateDoctorProfileRequest $request): RedirectResponse
    {
        $doctor = DoctorProfile::where('user_id', auth()->id())->firstOrFail();

        DB::beginTransaction();

        try {
            // Update user info
            $doctor->user->update([
                'name' => $request->name,
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            // Handle profile image
            if ($request->hasFile('profile_image')) {
                // Delete old image
                if ($doctor->profile_image) {
                    Storage::disk('public')->delete($doctor->profile_image);
                }

                $profileImage = $request->file('profile_image')
                    ->store('doctors', 'public');
                
                $doctor->profile_image = $profileImage;
            }

            // Update doctor profile
            $doctor->update([
                'specialization_id' => $request->specialization_id,
                'license_number' => $request->license_number,
                'qualification' => $request->qualification,
                'experience_years' => $request->experience_years,
                'consultation_fee' => $request->consultation_fee,
                'bio' => $request->bio,
                'website' => $request->website,
                'is_available_online' => $request->is_available_online ?? false,
            ]);

            // Update cities
            if ($request->filled('cities')) {
                $doctor->cities()->detach();
                foreach ($request->cities as $cityData) {
                    $doctor->cities()->attach($cityData['city_id'], [
                        'address' => $cityData['address'] ?? null,
                        'landmarks' => $cityData['landmarks'] ?? null,
                    ]);
                }
            }

            // Update search tags
            $doctor->searchTag()->updateOrCreate(
                [
                    'taggable_type' => DoctorProfile::class,
                    'taggable_id' => $doctor->id,
                ],
                ['tags' => $this->generateSearchTags($request, $doctor)]
            );

            DB::commit();

            return redirect()->route('doctor.profile.show')
                ->with('success', 'Profile updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to update profile. Please try again.',
            ])->withInput();
        }
    }

    /**
     * Generate search tags
     */
    private function generateSearchTags($request, $doctor): string
    {
        $tags = [];

        // Add name words
        $nameWords = explode(' ', strtolower($request->name));
        $tags = array_merge($tags, $nameWords);

        // Add specialty
        if ($request->specialization_id) {
            $specialty = Specialty::find($request->specialization_id);
            if ($specialty) {
                $tags[] = strtolower($specialty->name);
            }
        }

        // Add bio words
        if ($request->bio) {
            $bioWords = explode(' ', strtolower($request->bio));
            $bioWords = array_slice($bioWords, 0, 50);
            $tags = array_merge($tags, $bioWords);
        }

        // Add qualification
        if ($request->qualification) {
            $qualWords = explode(' ', strtolower($request->qualification));
            $tags = array_merge($tags, $qualWords);
        }

        $tags = array_unique(array_filter($tags));
        return implode(' ', $tags);
    }
}
