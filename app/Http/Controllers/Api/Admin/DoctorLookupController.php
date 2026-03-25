<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DoctorLookupController extends Controller
{
    public function index(): JsonResponse
    {
        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->whereHas('doctorProfile')
            ->with(['doctorProfile:id,user_id,specialization_id', 'doctorProfile.specialty:id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'data' => $doctors->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'doctor_profile_id' => $doctor->doctorProfile?->id,
                    'specialty' => $doctor->doctorProfile?->specialty?->name,
                ];
            }),
        ]);
    }
}
