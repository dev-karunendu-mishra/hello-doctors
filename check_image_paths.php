<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DoctorProfile;

echo "Checking doctor image paths...\n\n";

// Get all doctors with images
$doctors = DoctorProfile::whereNotNull('profile_image')->get();

echo "Total doctors with images: " . $doctors->count() . "\n\n";

// Categorize by path type
$storagePaths = [];
$imagesPaths = [];
$urlPaths = [];

foreach ($doctors as $doctor) {
    if (str_starts_with($doctor->profile_image, 'http://') || str_starts_with($doctor->profile_image, 'https://')) {
        $urlPaths[] = $doctor;
    } elseif (str_starts_with($doctor->profile_image, 'doctors/') || str_starts_with($doctor->profile_image, 'storage/')) {
        $storagePaths[] = $doctor;
    } elseif (str_starts_with($doctor->profile_image, 'images/doctors/')) {
        $imagesPaths[] = $doctor;
    }
}

echo "Path breakdown:\n";
echo "  - storage/doctors or doctors/ paths: " . count($storagePaths) . "\n";
echo "  - images/doctors/ paths: " . count($imagesPaths) . "\n";
echo "  - Full URLs: " . count($urlPaths) . "\n\n";

if (count($storagePaths) > 0) {
    echo "Sample storage paths (first 5):\n";
    foreach (array_slice($storagePaths, 0, 5) as $doctor) {
        $user = $doctor->user;
        echo "  - ID: {$doctor->id}, Name: {$user->name}, Path: {$doctor->profile_image}\n";
    }
    echo "\n";
}

if (count($imagesPaths) > 0) {
    echo "Sample images paths (first 5):\n";
    foreach (array_slice($imagesPaths, 0, 5) as $doctor) {
        $user = $doctor->user;
        echo "  - ID: {$doctor->id}, Name: {$user->name}, Path: {$doctor->profile_image}\n";
    }
}
