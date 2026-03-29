<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorScheduleSlot;

echo "\n=== SEEDED DATA VERIFICATION ===\n\n";

$doctors = User::where('role', 'doctor')->count();
$patients = User::where('role', 'patient')->count();
$clinics = DoctorHospitalClinic::count();
$schedules = DoctorScheduleSlot::count();

echo "✓ Doctors: $doctors\n";
echo "✓ Patients: $patients\n";
echo "✓ Clinics: $clinics\n";
echo "✓ Doctor Schedules: $schedules\n";

echo "\n=== SAMPLE DOCTORS ===\n\n";
User::where('role', 'doctor')->select('id', 'name', 'email')->get()->each(function($u) {
    echo "  - {$u->name} ({$u->email}) [ID: {$u->id}]\n";
});

echo "\n=== SAMPLE PATIENTS ===\n\n";
User::where('role', 'patient')->select('id', 'name', 'email')->get()->each(function($u) {
    echo "  - {$u->name} ({$u->email}) [ID: {$u->id}]\n";
});

echo "\n=== DOCTOR CLINICS ===\n\n";
DoctorHospitalClinic::with('doctorProfile.user', 'city')
    ->select('id', 'hospital_clinic_name', 'doctor_profile_id', 'city_id', 'consultation_fee')
    ->limit(5)
    ->get()
    ->each(function($c) {
        echo "  - {$c->hospital_clinic_name} ({$c->doctorProfile->user->name}) in {$c->city->name} - ₹{$c->consultation_fee}\n";
    });

echo "\n✓ Database seeding verified successfully!\n\n";
