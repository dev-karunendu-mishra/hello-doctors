<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterDoctorRequest;
use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    /**
     * Display registration form
     */
    public function create(): Response
    {
        $cities = City::active()->orderBy('name')->get();
        $specialties = Specialty::active()->get();

        return Inertia::render('Doctor/Register', [
            'cities' => $cities,
            'specialties' => $specialties,
        ]);
    }

    /**
     * Handle registration submission
     */
    public function store(RegisterDoctorRequest $request): RedirectResponse
    {
        DB::beginTransaction();

        try {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'address' => $request->address,
                'role' => 'doctor',
                'is_active' => false, // Requires admin approval
            ]);

            // Handle profile image
            $profileImage = null;
            if ($request->hasFile('profile_image')) {
                $profileImage = $request->file('profile_image')
                    ->store('doctors', 'public');
            }

            // Create doctor profile
            $doctorProfile = DoctorProfile::create([
                'user_id' => $user->id,
                'specialization_id' => $request->specialization_id,
                'license_number' => $request->license_number,
                'qualification' => $request->qualification,
                'experience_years' => $request->experience_years,
                'consultation_fee' => $request->consultation_fee,
                'bio' => $request->bio,
                'profile_image' => $profileImage,
                'website' => $request->website,
                'is_verified' => false, // Requires admin verification
                'is_available_online' => $request->is_available_online ?? false,
            ]);

            // Associate with cities
            if ($request->filled('cities')) {
                foreach ($request->cities as $cityData) {
                    $doctorProfile->cities()->attach($cityData['city_id'], [
                        'address' => $cityData['address'] ?? null,
                        'landmarks' => $cityData['landmarks'] ?? null,
                    ]);
                }
            }

            // Create search tags
            \App\Models\SearchTag::create([
                'taggable_type' => DoctorProfile::class,
                'taggable_id' => $doctorProfile->id,
                'tags' => $this->generateSearchTags($request),
            ]);

            DB::commit();

            return redirect()->route('home')->with('success', 
                'Registration successful! Your profile is under review. You will be notified once approved.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded image if exists
            if (isset($profileImage)) {
                Storage::disk('public')->delete($profileImage);
            }

            return back()->withErrors([
                'error' => 'Registration failed. Please try again.',
            ])->withInput();
        }
    }

    /**
     * Generate search tags
     */
    private function generateSearchTags(RegisterDoctorRequest $request): string
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

        // Add bio words (first 50 words)
        if ($request->bio) {
            $bioWords = explode(' ', strtolower($request->bio));
            $bioWords = array_slice($bioWords, 0, 50);
            $tags = array_merge($tags, $bioWords);
        }

        // Add qualification words
        if ($request->qualification) {
            $qualWords = explode(' ', strtolower($request->qualification));
            $tags = array_merge($tags, $qualWords);
        }

        // Remove duplicates and empty values
        $tags = array_unique(array_filter($tags));

        return implode(' ', $tags);
    }
}
