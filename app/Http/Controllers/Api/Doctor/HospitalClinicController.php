<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorHospitalClinic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HospitalClinicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $doctorProfile = $this->doctorProfile();

        $clinics = DoctorHospitalClinic::with('city')
            ->forDoctor($doctorProfile->id)
            ->when($request->filled('is_active'), function ($q) use ($request) {
                $q->where('is_active', $request->boolean('is_active'));
            })
            ->orderBy('hospital_clinic_name')
            ->get();

        return response()->json(['data' => $clinics]);
    }

    public function store(Request $request): JsonResponse
    {
        $doctorProfile = $this->doctorProfile();

        $validated = $request->validate([
            'hospital_clinic_name' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string'],
            'landmarks' => ['nullable', 'string', 'max:255'],
            'city_id' => ['required', 'exists:cities,id'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['doctor_profile_id'] = $doctorProfile->id;
        $validated['hospital_clinic_name'] = trim($validated['hospital_clinic_name']);

        $exists = DoctorHospitalClinic::query()
            ->where('doctor_profile_id', $doctorProfile->id)
            ->where('city_id', $validated['city_id'])
            ->whereRaw('LOWER(hospital_clinic_name) = ?', [mb_strtolower($validated['hospital_clinic_name'])])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Clinic with the same name already exists in selected city.',
            ], 422);
        }

        $clinic = DoctorHospitalClinic::create($validated)->load('city');

        return response()->json([
            'message' => 'Clinic created successfully.',
            'data' => $clinic,
        ], 201);
    }

    public function update(Request $request, DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->doctorProfile();
        $this->authorizeClinic($clinic, $doctorProfile->id);

        $validated = $request->validate([
            'hospital_clinic_name' => ['sometimes', 'required', 'string', 'max:100'],
            'address' => ['sometimes', 'required', 'string'],
            'landmarks' => ['nullable', 'string', 'max:255'],
            'city_id' => ['sometimes', 'required', 'exists:cities,id'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $newName = trim($validated['hospital_clinic_name'] ?? $clinic->hospital_clinic_name);
        $newCityId = $validated['city_id'] ?? $clinic->city_id;

        $exists = DoctorHospitalClinic::query()
            ->where('doctor_profile_id', $doctorProfile->id)
            ->where('city_id', $newCityId)
            ->whereRaw('LOWER(hospital_clinic_name) = ?', [mb_strtolower($newName)])
            ->whereKeyNot($clinic->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Clinic with the same name already exists in selected city.',
            ], 422);
        }

        if (array_key_exists('hospital_clinic_name', $validated)) {
            $validated['hospital_clinic_name'] = $newName;
        }

        $clinic->update($validated);

        return response()->json([
            'message' => 'Clinic updated successfully.',
            'data' => $clinic->fresh('city'),
        ]);
    }

    public function destroy(DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->doctorProfile();
        $this->authorizeClinic($clinic, $doctorProfile->id);

        $hasUpcoming = $clinic->appointments()
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($hasUpcoming) {
            return response()->json([
                'message' => 'Cannot delete clinic with upcoming appointments.',
            ], 422);
        }

        $clinic->delete();

        return response()->json([
            'message' => 'Clinic deleted successfully.',
        ]);
    }

    private function doctorProfile()
    {
        $profile = Auth::user()?->doctorProfile;
        abort_unless($profile, 422, 'Doctor profile is missing.');

        return $profile;
    }

    private function authorizeClinic(DoctorHospitalClinic $clinic, int $doctorProfileId): void
    {
        abort_unless((int) $clinic->doctor_profile_id === $doctorProfileId, 403, 'Unauthorized clinic access.');
    }
}
