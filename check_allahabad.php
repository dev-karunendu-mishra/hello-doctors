<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\City;
use App\Models\DoctorProfile;

echo "=== Checking Allahabad Doctors ===" . PHP_EOL . PHP_EOL;

// Check if Allahabad exists
$allahabad = City::where('name', 'like', '%allahabad%')
    ->orWhere('name', 'like', '%prayagraj%')
    ->first();

if (!$allahabad) {
    echo "❌ Allahabad/Prayagraj city NOT found in database!" . PHP_EOL;
    echo PHP_EOL . "Available cities:" . PHP_EOL;
    $cities = City::orderBy('name')->get();
    foreach ($cities as $city) {
        echo "  - ID: {$city->id}, Name: {$city->name}, Active: " . ($city->is_active ? 'Yes' : 'No') . PHP_EOL;
    }
} else {
    echo "✓ City found: {$allahabad->name} (ID: {$allahabad->id})" . PHP_EOL;
    echo "  Active: " . ($allahabad->is_active ? 'Yes' : 'No') . PHP_EOL;
    
    // Check doctors in this city
    $doctorsCount = $allahabad->doctors()->count();
    echo "  Total doctors: {$doctorsCount}" . PHP_EOL . PHP_EOL;
    
    if ($doctorsCount > 0) {
        echo "Sample doctors in {$allahabad->name}:" . PHP_EOL;
        $doctors = $allahabad->doctors()
            ->with('user', 'specialty')
            ->take(10)
            ->get();
        
        foreach ($doctors as $doctor) {
            echo "  - ID: {$doctor->id}, Name: {$doctor->user->name}, Specialty: {$doctor->specialty?->name}" . PHP_EOL;
            echo "    Verified: " . ($doctor->is_verified ? 'Yes' : 'No') . 
                 ", Active: " . ($doctor->user->is_active ? 'Yes' : 'No') . PHP_EOL;
        }
    } else {
        echo "❌ No doctors found for {$allahabad->name}" . PHP_EOL;
    }
}

echo PHP_EOL . "=== Checking doctor_city pivot table ===" . PHP_EOL;
$pivotCount = \DB::table('doctor_city')->count();
echo "Total doctor-city associations: {$pivotCount}" . PHP_EOL;

if ($allahabad) {
    $allahabadPivots = \DB::table('doctor_city')
        ->where('city_id', $allahabad->id)
        ->count();
    echo "Associations for {$allahabad->name}: {$allahabadPivots}" . PHP_EOL;
}
