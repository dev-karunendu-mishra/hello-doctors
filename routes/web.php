<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DoctorManagementController;
use App\Http\Controllers\Admin\AdvertisementController;
use App\Http\Controllers\Doctor\DashboardController as DoctorDashboardController;
use App\Http\Controllers\Doctor\ProfileController as DoctorProfileController;
use App\Http\Controllers\Doctor\RegistrationController;
use App\Http\Controllers\Patient\DashboardController as PatientDashboardController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\AboutController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/doctors/{id}', [SearchController::class, 'show'])->name('doctors.show');
Route::get('/about', [AboutController::class, 'index'])->name('about');
Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Newsletter Subscription
Route::post('/subscribe', [SubscriptionController::class, 'store'])->name('subscribe');

// Doctor Registration (Public)
Route::get('/register-doctor', [RegistrationController::class, 'create'])->name('doctor.register');
Route::post('/register-doctor', [RegistrationController::class, 'store'])->name('doctor.register.store');

Route::get('/dashboard', function () {
    $user = auth()->user();
    
    if (!$user) {
        return redirect()->route('login');
    }
    
    try {
        if ($user->hasRole('super_admin')) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->hasRole('doctor')) {
            return redirect()->route('doctor.dashboard');
        } elseif ($user->hasRole('patient')) {
            return redirect()->route('patient.dashboard');
        }
    } catch (\Exception $e) {
        \Log::error('Dashboard redirect error: ' . $e->getMessage());
        return redirect()->route('patient.dashboard'); // Default fallback
    }
    
    return Inertia::render('Dashboard');
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Routes
Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // User Management
    Route::resource('users', App\Http\Controllers\Admin\UserManagementController::class);
    
    // Patient Management
    Route::resource('patients', App\Http\Controllers\Admin\PatientManagementController::class);
    
    // Doctor Management
    Route::resource('doctors', DoctorManagementController::class);
    Route::get('/doctors-images/existing', [DoctorManagementController::class, 'getExistingImages'])->name('doctors.existing-images');
    Route::post('/doctors/{doctor}/toggle-verification', [DoctorManagementController::class, 'toggleVerification'])->name('doctors.toggle-verification');
    Route::post('/doctors/{doctor}/toggle-active', [DoctorManagementController::class, 'toggleActive'])->name('doctors.toggle-active');
    
    // Specialty Management
    Route::resource('specialties', App\Http\Controllers\Admin\SpecialtyManagementController::class);
    
    // Appointment Management
    Route::resource('appointments', App\Http\Controllers\Admin\AppointmentController::class);
    
    // Advertisement Management
    Route::resource('advertisements', AdvertisementController::class);
    
    // Settings
    Route::get('/settings', [App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('settings');
});

// Doctor Routes
Route::middleware(['auth', 'role:doctor'])->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');
    
    // Profile Management
    Route::get('/profile', [DoctorProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [DoctorProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [DoctorProfileController::class, 'update'])->name('profile.update');
    
    // Appointments
    Route::get('/appointments', function () {
        return Inertia::render('Doctor/Appointments');
    })->name('appointments');
    
    // Patients
    Route::get('/patients', function () {
        return Inertia::render('Doctor/Patients');
    })->name('patients');
    
    // Schedule
    Route::get('/schedule', function () {
        return Inertia::render('Doctor/Schedule');
    })->name('schedule');
});

// Patient Routes
Route::middleware(['auth', 'role:patient'])->prefix('patient')->name('patient.')->group(function () {
    Route::get('/dashboard', [PatientDashboardController::class, 'index'])->name('dashboard');
    
    // Find Doctors
    Route::get('/find-doctors', function () {
        return Inertia::render('Patient/FindDoctors');
    })->name('find-doctors');
    
    // Appointments
    Route::get('/appointments', function () {
        return Inertia::render('Patient/Appointments');
    })->name('appointments');
    
    // Medical Records
    Route::get('/medical-records', function () {
        return Inertia::render('Patient/MedicalRecords');
    })->name('medical-records');
});

require __DIR__.'/auth.php';
