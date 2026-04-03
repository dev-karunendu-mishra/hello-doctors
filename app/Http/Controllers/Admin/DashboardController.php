<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
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
            'totalAppointments' => Appointment::count(),
            'completedToday' => Appointment::query()
                ->where('status', Appointment::STATUS_COMPLETED)
                ->whereDate('completed_at', today())
                ->count(),
        ];

        $recentUsers = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        $recentAppointments = Appointment::query()
            ->with(['patient:id,name', 'doctorHospitalClinic.doctorProfile.user:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function (Appointment $appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->appointment_date?->format('Y-m-d'),
                    'patient' => $appointment->patient?->name ?? '-',
                    'doctor' => $appointment->doctorHospitalClinic?->doctorProfile?->user?->name ?? '-',
                    'status' => $appointment->status,
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentAppointments' => $recentAppointments,
            'recentUsers' => $recentUsers,
        ]);
    }
}
