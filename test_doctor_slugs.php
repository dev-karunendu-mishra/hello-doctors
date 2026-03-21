<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DoctorProfile;

echo "Testing doctor slug lookup...\n\n";

// Test a few random slugs
$testSlugs = [
    'dr-ashok-kumar-pandey',
    'dr-rita-mishra',
    'dr-ghanshyam',
    'testing-name',
];

foreach ($testSlugs as $slug) {
    $doctor = DoctorProfile::where('slug', $slug)->with('user')->first();
    
    if ($doctor) {
        echo "✓ Found: {$doctor->user->name} (Slug: {$slug})\n";
        echo "  URL would be: /doctors/{$slug}\n\n";
    } else {
        echo "✗ Not found: {$slug}\n\n";
    }
}

// Check for duplicates
$duplicates = DoctorProfile::selectRaw('slug, COUNT(*) as count')
    ->groupBy('slug')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->count() > 0) {
    echo "\n⚠️  Warning: Found duplicate slugs:\n";
    foreach ($duplicates as $dup) {
        echo "  - {$dup->slug} ({$dup->count} times)\n";
    }
} else {
    echo "\n✓ No duplicate slugs found!\n";
}
