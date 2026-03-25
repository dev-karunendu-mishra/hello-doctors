<?php

use App\Http\Controllers\Api\Admin\DoctorAppointmentController as AdminDoctorAppointmentController;
use App\Http\Controllers\Api\Admin\DoctorLookupController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\Admin\DoctorClinicController as AdminDoctorClinicController;
use App\Http\Controllers\Api\Admin\DoctorClinicScheduleController as AdminDoctorClinicScheduleController;
use App\Http\Controllers\Api\Doctor\AppointmentController as DoctorAppointmentController;
use App\Http\Controllers\Api\Doctor\HospitalClinicController as DoctorHospitalClinicController;
use App\Http\Controllers\Api\Doctor\ScheduleController as DoctorScheduleController;
use App\Http\Controllers\Api\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Api\Patient\AvailableAppointmentController;
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
});

Route::middleware(['auth'])->group(function () {
    Route::get('meta/cities', [MetaController::class, 'cities']);
    Route::get('meta/specialties', [MetaController::class, 'specialties']);
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
});
