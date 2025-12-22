<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $upcomingAppointments = []; // Will be populated when appointments are implemented
        $recentRecords = [];
        
        // Get recommended doctors (active doctors)
        $recommendedDoctors = User::where('role', 'doctor')
            ->where('is_active', true)
            ->take(8)
            ->get(['id', 'name', 'specialization']);

        return Inertia::render('Patient/Dashboard', [
            'upcomingAppointments' => $upcomingAppointments,
            'recentRecords' => $recentRecords,
            'recommendedDoctors' => $recommendedDoctors,
        ]);
    }
}
