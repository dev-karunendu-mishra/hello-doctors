<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\City;
use App\Models\Clinic;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DoctorClinicController extends Controller
{
    public function index(User $doctor): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);

        $clinics = DoctorHospitalClinic::with(['city', 'doctorProfile.user'])
            ->forDoctor($doctorProfile->id)
            ->orderBy('hospital_clinic_name')
            ->get()
            ->map(fn(DoctorHospitalClinic $clinic) => $this->decorateClinicResponse($clinic));

        return response()->json(['data' => $clinics->values()]);
    }

    public function store(Request $request, User $doctor): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);

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
                'message' => 'Clinic with the same name already exists for this doctor in selected city.',
            ], 422);
        }

        $clinic = DB::transaction(function () use ($validated) {
            $legacyClinic = DoctorHospitalClinic::create($validated)->load(['city', 'doctorProfile.user']);
            $this->syncUnifiedClinicEntities($legacyClinic);

            return $this->decorateClinicResponse($legacyClinic->fresh(['city', 'doctorProfile.user']));
        });

        return response()->json([
            'message' => 'Clinic created successfully.',
            'data' => $clinic,
        ], 201);
    }

    public function update(Request $request, User $doctor, DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);

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
                'message' => 'Clinic with the same name already exists for this doctor in selected city.',
            ], 422);
        }

        if (array_key_exists('hospital_clinic_name', $validated)) {
            $validated['hospital_clinic_name'] = $newName;
        }

        $clinic = DB::transaction(function () use ($clinic, $validated) {
            $clinic->update($validated);
            $this->syncUnifiedClinicEntities($clinic->fresh(['city', 'doctorProfile.user']));

            return $this->decorateClinicResponse($clinic->fresh(['city', 'doctorProfile.user']));
        });

        return response()->json([
            'message' => 'Clinic updated successfully.',
            'data' => $clinic,
        ]);
    }

    public function destroy(User $doctor, DoctorHospitalClinic $clinic): JsonResponse
    {
        $doctorProfile = $this->resolveDoctorProfile($doctor);
        $this->ensureClinicBelongsToDoctor($clinic, $doctorProfile->id);

        $hasUpcoming = $clinic->appointments()
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($hasUpcoming) {
            return response()->json([
                'message' => 'Cannot delete clinic with upcoming appointments.',
            ], 422);
        }

        DB::transaction(function () use ($clinic) {
            $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);
            $clinic->delete();

            if ($practiceLocation) {
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
        });

        return response()->json([
            'message' => 'Clinic deleted successfully.',
        ]);
    }

    private function resolveDoctorProfile(User $doctor)
    {
        abort_unless($doctor->isDoctor(), 422, 'Selected user is not a doctor.');

        $profile = $doctor->doctorProfile;
        abort_unless($profile, 422, 'Doctor profile is missing.');

        return $profile;
    }

    private function ensureClinicBelongsToDoctor(DoctorHospitalClinic $clinic, int $doctorProfileId): void
    {
        abort_unless(
            (int) $clinic->doctor_profile_id === $doctorProfileId,
            404,
            'Clinic not found for the given doctor.'
        );
    }

    private function decorateClinicResponse(DoctorHospitalClinic $clinic): DoctorHospitalClinic
    {
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($clinic);

        if (!$practiceLocation) {
            return $clinic;
        }

        $address = $practiceLocation->address;

        $clinic->setAttribute('doctor_practice_location_id', $practiceLocation->id);
        $clinic->setAttribute('clinic_entity_id', $practiceLocation->clinic_id);
        $clinic->setAttribute('unified_address_id', $address?->id);
        $clinic->hospital_clinic_name = $practiceLocation->display_name ?: $practiceLocation->clinic?->name ?: $clinic->hospital_clinic_name;
        $clinic->consultation_fee = $practiceLocation->consultation_fee ?? $clinic->consultation_fee;
        $clinic->phone = $practiceLocation->resolved_contact_phone ?: $clinic->phone;
        $clinic->email = $practiceLocation->resolved_contact_email ?: $clinic->email;

        if ($address) {
            $clinic->address = collect([$address->line1, $address->line2])->filter()->join(', ');
            $clinic->landmarks = $address->landmark;
            $clinic->latitude = $address->latitude;
            $clinic->longitude = $address->longitude;
            $clinic->city_id = $address->city_id ?: $clinic->city_id;

            $cityRelation = $address->cityRecord ?: City::make([
                'id' => $address->city_id,
                'name' => $address->city,
                'state' => $address->state,
            ]);

            $clinic->setRelation('city', $cityRelation);
        }

        return $clinic;
    }

    private function resolvePracticeLocationFromLegacyClinic(DoctorHospitalClinic $legacyClinic): ?DoctorPracticeLocation
    {
        return DoctorPracticeLocation::query()
            ->with(['address.cityRecord', 'clinic', 'doctorProfile.user'])
            ->where('doctor_profile_id', $legacyClinic->doctor_profile_id)
            ->whereHas('address', function ($query) use ($legacyClinic) {
                $query->where('meta->legacy_source', 'doctor_hospital_clinics')
                    ->where('meta->legacy_id', $legacyClinic->id);
            })
            ->first();
    }

    private function syncUnifiedClinicEntities(DoctorHospitalClinic $legacyClinic): DoctorPracticeLocation
    {
        $practiceLocation = $this->resolvePracticeLocationFromLegacyClinic($legacyClinic);
        $clinicEntity = $practiceLocation?->clinic ?: new Clinic();

        $clinicEntity->fill([
            'name' => trim($legacyClinic->hospital_clinic_name),
            'type' => 'clinic',
            'phone' => $legacyClinic->phone,
            'email' => $legacyClinic->email,
            'website' => $clinicEntity->website,
            'is_active' => (bool) $legacyClinic->is_active,
        ]);
        $clinicEntity->save();

        $normalizedAddress = $this->normalizeAddressLines($legacyClinic->address);
        $meta = array_merge($practiceLocation?->address?->meta ?? [], [
            'legacy_source' => 'doctor_hospital_clinics',
            'legacy_id' => $legacyClinic->id,
        ]);

        if ($normalizedAddress['was_truncated']) {
            $meta['full_address'] = $normalizedAddress['full_address'];
        }

        $address = $practiceLocation?->address ?: new Address();
        $address->fill([
            'addressable_type' => Clinic::class,
            'addressable_id' => $clinicEntity->id,
            'label' => 'Clinic Address',
            'line1' => $normalizedAddress['line1'],
            'line2' => $normalizedAddress['line2'],
            'landmark' => $legacyClinic->landmarks,
            'city' => $legacyClinic->city?->name,
            'city_id' => $legacyClinic->city_id,
            'state' => $legacyClinic->city?->state,
            'pincode' => $address->pincode,
            'latitude' => $legacyClinic->latitude,
            'longitude' => $legacyClinic->longitude,
            'is_primary' => true,
            'meta' => $meta,
        ]);
        $address->save();

        $practiceLocation = $practiceLocation ?: new DoctorPracticeLocation();
        $practiceLocation->fill([
            'doctor_profile_id' => $legacyClinic->doctor_profile_id,
            'clinic_id' => $clinicEntity->id,
            'address_id' => $address->id,
            'display_name' => trim($legacyClinic->hospital_clinic_name),
            'consultation_fee' => $legacyClinic->consultation_fee,
            'contact_phone' => $legacyClinic->phone ?: $legacyClinic->doctorProfile?->user?->phone,
            'contact_email' => $legacyClinic->email ?: $legacyClinic->doctorProfile?->user?->email,
            'is_primary' => $practiceLocation->exists
                ? (bool) $practiceLocation->is_primary
                : !$this->doctorProfileHasPrimaryPracticeLocation((int) $legacyClinic->doctor_profile_id),
            'is_active' => (bool) $legacyClinic->is_active,
        ]);
        $practiceLocation->save();

        return $practiceLocation;
    }

    private function doctorProfileHasPrimaryPracticeLocation(int $doctorProfileId): bool
    {
        return DoctorPracticeLocation::query()
            ->where('doctor_profile_id', $doctorProfileId)
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

        $wasTruncated = mb_strlen($rawLine1) > 255 || ($normalizedLine2 !== null && mb_strlen($normalizedLine2) > 255);

        if ($normalizedLine2 !== null) {
            $normalizedLine2 = mb_substr($normalizedLine2, 0, 255);
        }

        return [
            'line1' => $normalizedLine1,
            'line2' => $normalizedLine2,
            'full_address' => $fullAddress,
            'was_truncated' => $wasTruncated,
        ];
    }
}
