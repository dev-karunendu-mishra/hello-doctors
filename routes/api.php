<?php

use App\Http\Controllers\Api\Admin\DoctorAppointmentController as AdminDoctorAppointmentController;
use App\Http\Controllers\Api\Admin\DoctorLookupController;
use App\Http\Controllers\Api\Admin\HomeServiceManagementController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\Admin\DoctorClinicController as AdminDoctorClinicController;
use App\Http\Controllers\Api\Admin\DoctorClinicScheduleController as AdminDoctorClinicScheduleController;
use App\Http\Controllers\Api\Doctor\AppointmentController as DoctorAppointmentController;
use App\Http\Controllers\Api\Doctor\HospitalClinicController as DoctorHospitalClinicController;
use App\Http\Controllers\Api\Doctor\ScheduleController as DoctorScheduleController;
use App\Http\Controllers\Api\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Api\Patient\AvailableAppointmentController;
use App\Http\Controllers\Api\Patient\HomeServiceAddressController;
use App\Http\Controllers\Api\Patient\HomeServiceBookingController;
use App\Http\Controllers\Api\Patient\HomeServiceController as PatientHomeServiceController;
use App\Http\Controllers\Api\Provider\HomeServiceController as ProviderHomeServiceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->group(function () {
    Route::get('doctors', [DoctorLookupController::class, 'index']);

    Route::get('doctors/{doctor}/hospital-clinics', [AdminDoctorClinicController::class, 'index']);
    Route::post('doctors/{doctor}/hospital-clinics', [AdminDoctorClinicController::class, 'store']);
    Route::put('doctors/{doctor}/hospital-clinics/{clinic}', [AdminDoctorClinicController::class, 'update']);
    Route::delete('doctors/{doctor}/hospital-clinics/{clinic}', [AdminDoctorClinicController::class, 'destroy']);

    Route::get('doctors/{doctor}/hospital-clinics/{clinic}/schedules', [AdminDoctorClinicScheduleController::class, 'index']);
    Route::post('doctors/{doctor}/hospital-clinics/{clinic}/schedules', [AdminDoctorClinicScheduleController::class, 'store']);
    Route::put('doctors/{doctor}/hospital-clinics/{clinic}/schedules/{day}', [AdminDoctorClinicScheduleController::class, 'updateDay']);
    Route::delete('doctors/{doctor}/hospital-clinics/{clinic}/schedules/{day}', [AdminDoctorClinicScheduleController::class, 'destroy']);

    Route::get('doctors/{doctor}/appointments', [AdminDoctorAppointmentController::class, 'index']);

    Route::get('home-services', [HomeServiceManagementController::class, 'servicesIndex']);
    Route::post('home-services', [HomeServiceManagementController::class, 'servicesStore']);
    Route::put('home-services/{service}', [HomeServiceManagementController::class, 'servicesUpdate']);

    Route::get('home-service-categories', [HomeServiceManagementController::class, 'categoriesIndex']);
    Route::post('home-service-categories', [HomeServiceManagementController::class, 'categoriesStore']);
    Route::put('home-service-categories/{category}', [HomeServiceManagementController::class, 'categoriesUpdate']);

    Route::get('home-service-providers', [HomeServiceManagementController::class, 'providersIndex']);
    Route::post('home-service-providers', [HomeServiceManagementController::class, 'providersStore']);
    Route::put('home-service-providers/{provider}/verify', [HomeServiceManagementController::class, 'verifyProvider']);

    Route::get('home-service-bookings', [HomeServiceManagementController::class, 'bookingsIndex']);
    Route::post('home-service-bookings/{booking}/assign-provider', [HomeServiceManagementController::class, 'assignProvider']);
    Route::post('home-service-bookings/{booking}/status', [HomeServiceManagementController::class, 'updateBookingStatus']);
});

Route::middleware(['auth'])->group(function () {
    Route::get('meta/cities', [MetaController::class, 'cities']);
    Route::get('meta/specialties', [MetaController::class, 'specialties']);
    Route::get('meta/home-services', [MetaController::class, 'homeServices']);
});

Route::middleware(['auth', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('hospital-clinics', [DoctorHospitalClinicController::class, 'index']);
    Route::post('hospital-clinics', [DoctorHospitalClinicController::class, 'store']);
    Route::put('hospital-clinics/{clinic}', [DoctorHospitalClinicController::class, 'update']);
    Route::delete('hospital-clinics/{clinic}', [DoctorHospitalClinicController::class, 'destroy']);

    Route::get('hospital-clinics/{clinic}/schedules', [DoctorScheduleController::class, 'index']);
    Route::post('hospital-clinics/{clinic}/schedules', [DoctorScheduleController::class, 'store']);
    Route::put('hospital-clinics/{clinic}/schedules/{day}', [DoctorScheduleController::class, 'updateDay']);
    Route::delete('hospital-clinics/{clinic}/schedules/{day}', [DoctorScheduleController::class, 'destroy']);

    Route::get('appointments', [DoctorAppointmentController::class, 'index']);
    Route::put('appointments/{appointment}', [DoctorAppointmentController::class, 'update']);
});

Route::middleware(['auth', 'role:patient'])->prefix('patient')->group(function () {
    Route::get('available-appointments', [AvailableAppointmentController::class, 'index']);
    Route::get('clinic/{clinic}/available-slots', [AvailableAppointmentController::class, 'slots']);

    Route::get('appointments', [PatientAppointmentController::class, 'index']);
    Route::post('appointments', [PatientAppointmentController::class, 'store']);
    Route::post('appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel']);

    Route::get('home-services', [PatientHomeServiceController::class, 'index']);
    Route::get('home-services/{service}/available-slots', [PatientHomeServiceController::class, 'availableSlots']);

    Route::get('home-service-addresses', [HomeServiceAddressController::class, 'index']);
    Route::post('home-service-addresses', [HomeServiceAddressController::class, 'store']);
    Route::put('home-service-addresses/{address}', [HomeServiceAddressController::class, 'update']);
    Route::delete('home-service-addresses/{address}', [HomeServiceAddressController::class, 'destroy']);

    Route::get('home-service-bookings', [HomeServiceBookingController::class, 'index']);
    Route::post('home-service-bookings', [HomeServiceBookingController::class, 'store']);
    Route::get('home-service-bookings/{booking}', [HomeServiceBookingController::class, 'show']);
    Route::post('home-service-bookings/{booking}/cancel', [HomeServiceBookingController::class, 'cancel']);
});

Route::middleware(['auth', 'role:home_service_provider'])->prefix('provider')->group(function () {
    Route::get('home-service/profile', [ProviderHomeServiceController::class, 'profile']);
    Route::put('home-service/profile', [ProviderHomeServiceController::class, 'updateProfile']);

    Route::get('home-service/availability', [ProviderHomeServiceController::class, 'availability']);
    Route::post('home-service/availability', [ProviderHomeServiceController::class, 'saveAvailability']);

    Route::get('home-service/bookings', [ProviderHomeServiceController::class, 'bookings']);
    Route::post('home-service/bookings/{booking}/status', [ProviderHomeServiceController::class, 'updateBookingStatus']);
});
