<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'doctor';
    }

    public function rules(): array
    {
        $doctorId = auth()->user()->doctorProfile?->id;

        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'specialization_id' => 'required|exists:specialties,id',
            'license_number' => 'nullable|string|unique:doctor_profiles,license_number,' . $doctorId . '|max:100',
            'qualification' => 'nullable|string|max:500',
            'experience_years' => 'nullable|integer|min:0|max:100',
            'consultation_fee' => 'nullable|numeric|min:0|max:100000',
            'bio' => 'nullable|string|max:2000',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'website' => 'nullable|url|max:255',
            'is_available_online' => 'nullable|boolean',
            'cities' => 'nullable|array',
            'cities.*.city_id' => 'required|exists:cities,id',
            'cities.*.address' => 'nullable|string|max:500',
            'cities.*.landmarks' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name.',
            'phone.required' => 'Please enter your phone number.',
            'specialization_id.required' => 'Please select your specialty.',
            'profile_image.image' => 'Profile image must be an image file.',
            'profile_image.max' => 'Profile image must not exceed 2MB.',
        ];
    }
}
