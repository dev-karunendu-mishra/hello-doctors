<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DoctorProfile;

echo "=== Doctor Profiles Image Check ===" . PHP_EOL . PHP_EOL;

$totalDoctors = DoctorProfile::count();
$doctorsWithImages = DoctorProfile::whereNotNull('profile_image')->count();

echo "Total doctors: {$totalDoctors}" . PHP_EOL;
echo "Doctors with profile_image: {$doctorsWithImages}" . PHP_EOL . PHP_EOL;

if ($doctorsWithImages > 0) {
    echo "Sample doctor images:" . PHP_EOL;
    $samples = DoctorProfile::with('user')
        ->whereNotNull('profile_image')
        ->take(5)
        ->get();
    
    foreach ($samples as $doctor) {
        echo "ID: {$doctor->id}" . PHP_EOL;
        echo "Name: {$doctor->user->name}" . PHP_EOL;
        echo "Image field: " . substr($doctor->profile_image, 0, 100) . PHP_EOL;
        echo "Image type: " . (filter_var($doctor->profile_image, FILTER_VALIDATE_URL) ? 'URL' : 
                             (str_starts_with($doctor->profile_image, 'images/') ? 'Public Path' : 
                             'Storage Path or Other')) . PHP_EOL;
        echo "Profile Image URL: " . ($doctor->profile_image_url ?? 'NULL') . PHP_EOL;
        echo "---" . PHP_EOL;
    }
}

echo PHP_EOL . "=== Checking if images exist in filesystem ===" . PHP_EOL;
$publicDocsPath = public_path('images/doctors');
$files = \File::exists($publicDocsPath) ? \File::files($publicDocsPath) : [];
echo "Images in public/images/doctors/: " . count($files) . PHP_EOL;

if (count($files) > 0) {
    echo "Sample files:" . PHP_EOL;
    foreach (array_slice($files, 0, 5) as $file) {
        echo "  - " . $file->getFilename() . PHP_EOL;
    }
}
