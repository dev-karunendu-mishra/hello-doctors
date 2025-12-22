<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'todayAppointments' => 0, // Will be implemented with appointments
            'totalPatients' => 0,
            'pendingAppointments' => 0,
            'completedAppointments' => 0,
        ];

        $todayAppointments = []; // Will be populated when appointments are implemented
        $upcomingAppointments = [];

        return Inertia::render('Doctor/Dashboard', [
            'stats' => $stats,
            'todayAppointments' => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }
}
