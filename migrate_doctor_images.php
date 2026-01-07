<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DoctorProfile;
use Illuminate\Support\Facades\DB;

echo "=== Migrating Doctor Images to Public Folder ===" . PHP_EOL . PHP_EOL;

$doctors = DoctorProfile::whereNotNull('profile_image')
    ->where('profile_image', 'like', 'doctors/%')
    ->get();

echo "Found {$doctors->count()} doctors with storage paths" . PHP_EOL . PHP_EOL;

$updated = 0;
foreach ($doctors as $doctor) {
    $oldPath = $doctor->profile_image;
    $filename = basename($oldPath);
    $newPath = 'images/doctors/' . $filename;
    
    // Check if file exists in public folder
    if (file_exists(public_path($newPath))) {
        $doctor->profile_image = $newPath;
        $doctor->save();
        $updated++;
        echo "✓ Updated: {$oldPath} -> {$newPath}" . PHP_EOL;
    } else {
        echo "✗ File not found: " . public_path($newPath) . PHP_EOL;
    }
}

echo PHP_EOL . "=== Migration Complete ===" . PHP_EOL;
echo "Updated {$updated} doctor profiles" . PHP_EOL;
