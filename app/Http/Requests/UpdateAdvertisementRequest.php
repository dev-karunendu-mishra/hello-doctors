<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdvertisementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'super_admin';
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'link' => 'nullable|url|max:500',
            'position' => 'required|in:homepage,sidebar,search_results,doctor_profile',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Please enter advertisement title.',
            'image.max' => 'Image must not exceed 5MB.',
            'position.required' => 'Please select a position.',
            'start_date.required' => 'Please select a start date.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
        ];
    }
}
