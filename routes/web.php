<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DoctorManagementController;
use App\Http\Controllers\Admin\AdvertisementController;
use App\Http\Controllers\Api\Admin\HomeServiceManagementController as AdminHomeServiceManagementController;
use App\Http\Controllers\Doctor\DashboardController as DoctorDashboardController;
use App\Http\Controllers\Doctor\ProfileController as DoctorProfileController;
use App\Http\Controllers\Doctor\RegistrationController;
use App\Http\Controllers\Patient\DashboardController as PatientDashboardController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\SearchController;
use App\Http\Controllers\Public\AboutController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\ProviderRegistrationController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\Api\MetaController as ApiMetaController;
use App\Http\Controllers\Api\Admin\DoctorLookupController as ApiAdminDoctorLookupController;
use App\Http\Controllers\Api\Admin\DoctorClinicController as ApiAdminDoctorClinicController;
use App\Http\Controllers\Api\Admin\DoctorClinicScheduleController as ApiAdminDoctorClinicScheduleController;
use App\Http\Controllers\Api\Admin\DoctorAppointmentController as ApiAdminDoctorAppointmentController;
use App\Http\Controllers\Api\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Api\Patient\AvailableAppointmentController as PatientAvailableAppointmentController;
use App\Http\Controllers\Api\Patient\HomeServiceController as PatientHomeServiceController;
use App\Http\Controllers\Api\Patient\HomeServiceAddressController as PatientHomeServiceAddressController;
use App\Http\Controllers\Api\Patient\HomeServiceBookingController as PatientHomeServiceBookingController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/doctors/{doctor}', [SearchController::class, 'show'])->name('doctors.show');
Route::get('/about', [AboutController::class, 'index'])->name('about');
Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Newsletter Subscription
Route::post('/subscribe', [SubscriptionController::class, 'store'])->name('subscribe');

// SEO Routes
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/robots.txt', [RobotsController::class, 'index'])->name('robots');

// Doctor Registration (Public)
Route::get('/register-doctor', [RegistrationController::class, 'create'])->name('doctor.register');
Route::post('/register-doctor', [RegistrationController::class, 'store'])->name('doctor.register.store');

// Provider Registration (Public)
Route::get('/register-provider', [ProviderRegistrationController::class, 'create'])->name('provider.register');
Route::post('/register-provider', [ProviderRegistrationController::class, 'store'])->name('provider.register.store');

Route::get('/dashboard', function () {
    $user = Auth::user();
    
    if (!$user) {
        return redirect()->route('login');
    }

    /** @var \App\Models\User $user */
    
    try {
        if ($user->hasRole('super_admin')) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->hasRole('doctor')) {
            return redirect()->route('doctor.dashboard');
        } elseif ($user->hasRole('patient')) {
            return redirect()->route('patient.dashboard');
        } elseif ($user->hasRole('home_service_provider')) {
            return redirect()->route('provider.home-services.profile');
        }
    } catch (\Exception $e) {
        Log::error('Dashboard redirect error: ' . $e->getMessage());
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
    
    // Site Customization
    Route::get('/site-customization', [App\Http\Controllers\Admin\SiteCustomizationController::class, 'index'])->name('site-customization');
    Route::post('/site-customization', [App\Http\Controllers\Admin\SiteCustomizationController::class, 'update'])->name('site-customization.update');
    Route::post('/site-customization/upload-image', [App\Http\Controllers\Admin\SiteCustomizationController::class, 'uploadImage'])->name('site-customization.upload-image');
    
    // SEO Settings
    Route::get('/seo', [App\Http\Controllers\Admin\SeoController::class, 'index'])->name('seo');
    Route::post('/seo', [App\Http\Controllers\Admin\SeoController::class, 'update'])->name('seo.update');
    
    // Settings
    Route::get('/settings', [App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('settings');

    // Home Services Management
    Route::get('/home-services', function () {
        return Inertia::render('Admin/HomeServices/Index');
    })->name('home-services.index');

    Route::get('/home-services/providers', function () {
        return Inertia::render('Admin/HomeServices/Providers');
    })->name('home-services.providers');

    Route::get('/home-services/bookings', function () {
        return Inertia::render('Admin/HomeServices/Bookings');
    })->name('home-services.bookings');

    // Home Services (session-authenticated JSON endpoints)
    Route::get('/home-services/services', [AdminHomeServiceManagementController::class, 'servicesIndex'])
        ->name('home-services.services.index');
    Route::post('/home-services/services', [AdminHomeServiceManagementController::class, 'servicesStore'])
        ->name('home-services.services.store');
    Route::put('/home-services/services/{service}', [AdminHomeServiceManagementController::class, 'servicesUpdate'])
        ->name('home-services.services.update');

    Route::get('/home-services/providers-data', [AdminHomeServiceManagementController::class, 'providersIndex'])
        ->name('home-services.providers-data.index');
    Route::post('/home-services/providers-data', [AdminHomeServiceManagementController::class, 'providersStore'])
        ->name('home-services.providers-data.store');
    Route::put('/home-services/providers-data/{provider}/verify', [AdminHomeServiceManagementController::class, 'verifyProvider'])
        ->name('home-services.providers-data.verify');

    Route::get('/home-services/bookings-data', [AdminHomeServiceManagementController::class, 'bookingsIndex'])
        ->name('home-services.bookings-data.index');
    Route::post('/home-services/bookings-data/{booking}/assign-provider', [AdminHomeServiceManagementController::class, 'assignProvider'])
        ->name('home-services.bookings-data.assign-provider');
    Route::post('/home-services/bookings-data/{booking}/status', [AdminHomeServiceManagementController::class, 'updateBookingStatus'])
        ->name('home-services.bookings-data.status');

    Route::get('/meta/cities', [ApiMetaController::class, 'cities'])
        ->name('meta.cities');

    // Admin appointments management (session-authenticated JSON endpoints)
    Route::get('/appointments-data/doctors', [ApiAdminDoctorLookupController::class, 'index'])
        ->name('appointments-data.doctors.index');
    Route::get('/appointments-data/appointments', [ApiAdminDoctorAppointmentController::class, 'overview'])
        ->name('appointments-data.appointments.index');
    Route::get('/appointments-data/doctors/{doctor}/hospital-clinics', [ApiAdminDoctorClinicController::class, 'index'])
        ->name('appointments-data.doctors.clinics.index');
    Route::post('/appointments-data/doctors/{doctor}/hospital-clinics', [ApiAdminDoctorClinicController::class, 'store'])
        ->name('appointments-data.doctors.clinics.store');
    Route::put('/appointments-data/doctors/{doctor}/hospital-clinics/{clinic}', [ApiAdminDoctorClinicController::class, 'update'])
        ->name('appointments-data.doctors.clinics.update');
    Route::delete('/appointments-data/doctors/{doctor}/hospital-clinics/{clinic}', [ApiAdminDoctorClinicController::class, 'destroy'])
        ->name('appointments-data.doctors.clinics.destroy');

    Route::get('/appointments-data/doctors/{doctor}/hospital-clinics/{clinic}/schedules', [ApiAdminDoctorClinicScheduleController::class, 'index'])
        ->name('appointments-data.doctors.clinics.schedules.index');
    Route::post('/appointments-data/doctors/{doctor}/hospital-clinics/{clinic}/schedules', [ApiAdminDoctorClinicScheduleController::class, 'store'])
        ->name('appointments-data.doctors.clinics.schedules.store');

    Route::get('/appointments-data/doctors/{doctor}/appointments', [ApiAdminDoctorAppointmentController::class, 'index'])
        ->name('appointments-data.doctors.appointments.index');

    // Home Services Categories (session-authenticated JSON endpoints)
    Route::get('/home-service-categories', [AdminHomeServiceManagementController::class, 'categoriesIndex'])
        ->name('home-service-categories.index');
    Route::post('/home-service-categories', [AdminHomeServiceManagementController::class, 'categoriesStore'])
        ->name('home-service-categories.store');
    Route::put('/home-service-categories/{category}', [AdminHomeServiceManagementController::class, 'categoriesUpdate'])
        ->name('home-service-categories.update');
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

    // Home Services
    Route::get('/home-services', function () {
        return Inertia::render('Patient/HomeServices/Index');
    })->name('home-services.index');

    Route::get('/home-services/book', function () {
        return Inertia::render('Patient/HomeServices/Book');
    })->name('home-services.book');

    Route::get('/home-services/bookings', function () {
        return Inertia::render('Patient/HomeServices/MyBookings');
    })->name('home-services.bookings');

    Route::get('/home-services/addresses', function () {
        return Inertia::render('Patient/HomeServices/Addresses');
    })->name('home-services.addresses');

    // Patient data session-authenticated endpoints (mirrors of API routes)
    Route::get('/data/meta/cities', [ApiMetaController::class, 'cities'])->name('data.meta.cities');
    Route::get('/data/meta/specialties', [ApiMetaController::class, 'specialties'])->name('data.meta.specialties');

    Route::get('/data/home-services', [PatientHomeServiceController::class, 'index'])->name('data.home-services.index');
    Route::get('/data/home-services/{service}/available-slots', [PatientHomeServiceController::class, 'availableSlots'])->name('data.home-services.slots');

    Route::get('/data/addresses', [PatientHomeServiceAddressController::class, 'index'])->name('data.addresses.index');
    Route::post('/data/addresses', [PatientHomeServiceAddressController::class, 'store'])->name('data.addresses.store');
    Route::put('/data/addresses/{address}', [PatientHomeServiceAddressController::class, 'update'])->name('data.addresses.update');
    Route::delete('/data/addresses/{address}', [PatientHomeServiceAddressController::class, 'destroy'])->name('data.addresses.destroy');

    Route::get('/data/home-service-bookings', [PatientHomeServiceBookingController::class, 'index'])->name('data.home-service-bookings.index');
    Route::post('/data/home-service-bookings', [PatientHomeServiceBookingController::class, 'store'])->name('data.home-service-bookings.store');
    Route::get('/data/home-service-bookings/{booking}', [PatientHomeServiceBookingController::class, 'show'])->name('data.home-service-bookings.show');
    Route::post('/data/home-service-bookings/{booking}/cancel', [PatientHomeServiceBookingController::class, 'cancel'])->name('data.home-service-bookings.cancel');

    Route::get('/data/available-appointments', [PatientAvailableAppointmentController::class, 'index'])->name('data.available-appointments.index');
    Route::get('/data/clinics/{clinic}/available-slots', [PatientAvailableAppointmentController::class, 'slots'])->name('data.available-slots');

    Route::get('/data/appointments', [PatientAppointmentController::class, 'index'])->name('data.appointments.index');
    Route::post('/data/appointments', [PatientAppointmentController::class, 'store'])->name('data.appointments.store');
    Route::post('/data/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel'])->name('data.appointments.cancel');
});

// Home Service Provider Routes
Route::middleware(['auth', 'role:home_service_provider'])->prefix('provider')->name('provider.')->group(function () {
    Route::get('/home-services/profile', function () {
        return Inertia::render('Provider/HomeServices/Profile');
    })->name('home-services.profile');

    Route::get('/home-services/availability', function () {
        return Inertia::render('Provider/HomeServices/Availability');
    })->name('home-services.availability');

    Route::get('/home-services/bookings', function () {
        return Inertia::render('Provider/HomeServices/Bookings');
    })->name('home-services.bookings');
});

require __DIR__.'/auth.php';
