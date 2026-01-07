<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DoctorProfile;

echo "Doctor Image Migration Script v2\n";
echo "==================================\n\n";

// Get all doctors with images
$doctors = DoctorProfile::whereNotNull('profile_image')->get();

echo "Found " . $doctors->count() . " doctors with images.\n\n";

$updated = 0;
$skipped = 0;
$copied = 0;
$failed = 0;

foreach ($doctors as $doctor) {
    $oldPath = $doctor->profile_image;
    
    // Skip if already using images/doctors/ path
    if (str_starts_with($oldPath, 'images/doctors/')) {
        $skipped++;
        continue;
    }
    
    // Skip if it's a full URL
    if (str_starts_with($oldPath, 'http://') || str_starts_with($oldPath, 'https://')) {
        $skipped++;
        continue;
    }
    
    // Extract filename from old path (remove doctors/ or storage/ prefix if present)
    $filename = basename($oldPath);
    $newPath = 'images/doctors/' . $filename;
    
    // Try multiple source locations
    $possibleSources = [
        storage_path('app/public/doctors/' . $filename),
        storage_path('app/public/' . $oldPath),
        public_path('storage/doctors/' . $filename),
        public_path($oldPath)
    ];
    
    $publicPath = public_path('images/doctors/' . $filename);
    
    // If target doesn't exist, try to copy from any source
    if (!file_exists($publicPath)) {
        $copied_this = false;
        foreach ($possibleSources as $source) {
            if (file_exists($source)) {
                if (copy($source, $publicPath)) {
                    $copied++;
                    $copied_this = true;
                    echo "  ✓ Copied: {$filename}\n";
                    break;
                }
            }
        }
        
        if (!$copied_this) {
            $failed++;
            echo "  ✗ Image not found for: {$filename}\n";
        }
    }
    
    // Update database record regardless (so URLs work for existing files)
    $doctor->profile_image = $newPath;
    $doctor->save();
    $updated++;
    
    if ($updated % 50 == 0) {
        echo "  Progress: {$updated} doctors updated...\n";
    }
}

echo "\n==================================\n";
echo "Migration Summary:\n";
echo "  - Total doctors: " . $doctors->count() . "\n";
echo "  - Updated: {$updated}\n";
echo "  - Files copied: {$copied}\n";
echo "  - Files not found: {$failed}\n";
echo "  - Skipped: {$skipped}\n";
echo "==================================\n";
