<?php

/**
 * Script to generate slugs for existing doctors
 * Run this after migration: php generate_doctor_slugs.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DoctorProfile;

echo "Generating slugs for existing doctors...\n\n";

$doctors = DoctorProfile::with('user')->whereNull('slug')->get();

$count = 0;
foreach ($doctors as $doctor) {
    if ($doctor->user) {
        $doctor->slug = DoctorProfile::generateUniqueSlug($doctor->user->name, $doctor->id);
        $doctor->save();
        echo "✓ Generated slug for: {$doctor->user->name} -> {$doctor->slug}\n";
        $count++;
    } else {
        echo "✗ Skipped doctor ID {$doctor->id} - no user found\n";
    }
}

echo "\n✅ Done! Generated {$count} slugs.\n";
