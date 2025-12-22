<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'totalUsers' => User::count(),
            'totalDoctors' => User::where('role', 'doctor')->count(),
            'totalAppointments' => 0, // Will be implemented when appointments table is created
            'completedToday' => 0,
        ];

        $recentUsers = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        $recentAppointments = []; // Will be populated when appointments are implemented

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentAppointments' => $recentAppointments,
            'recentUsers' => $recentUsers,
        ]);
    }
}
