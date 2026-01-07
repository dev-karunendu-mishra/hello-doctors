<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\City;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

echo "=== Importing Doctors from hello-doctors.sql ===" . PHP_EOL . PHP_EOL;

// Check if search table exists (old database structure)
try {
    $searchTableExists = DB::select("SHOW TABLES LIKE 'search'");
    if (empty($searchTableExists)) {
        echo "❌ 'search' table not found. Please import the hello-doctors.sql file first." . PHP_EOL;
        echo PHP_EOL . "Run this command:" . PHP_EOL;
        echo "mysql -u root -p hello_doctors < hello-doctors.sql" . PHP_EOL;
        exit(1);
    }
    echo "✓ Found 'search' table" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Error checking for search table: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

// Get all records from search table
$searchRecords = DB::table('search')->get();
echo "Found {$searchRecords->count()} doctor records in search table" . PHP_EOL . PHP_EOL;

// Group by keywords to identify cities
$cities = City::all()->keyBy('name');
$specialties = Specialty::all()->keyBy('name');

echo "=== Processing doctors by city keywords ===" . PHP_EOL;

$imported = 0;
$skipped = 0;
$errors = 0;

foreach ($searchRecords as $record) {
    try {
        // Identify city from keyword
        $cityName = null;
        $keyword = strtolower($record->keyword ?? '');
        
        if (str_contains($keyword, 'allahabad')) $cityName = 'Allahabad';
        elseif (str_contains($keyword, 'agra')) $cityName = 'Agra';
        elseif (str_contains($keyword, 'varanasi')) $cityName = 'Varanasi';
        elseif (str_contains($keyword, 'deoria')) $cityName = 'Deoria';
        elseif (str_contains($keyword, 'gorakhpur')) $cityName = 'Gorakhpur';
        elseif (str_contains($keyword, 'kanpur')) $cityName = 'Kanpur';
        elseif (str_contains($keyword, 'lucknow')) $cityName = 'Lucknow';
        elseif (str_contains($keyword, 'mirzapur')) $cityName = 'Mirzapur';
        
        if (!$cityName) {
            $skipped++;
            continue;
        }
        
        $city = $cities->get($cityName);
        if (!$city) {
            echo "⚠ City not found: {$cityName}" . PHP_EOL;
            continue;
        }
        
        // Check if doctor already exists
        $existingUser = User::where('email', $record->email)
            ->orWhere('name', $record->title)
            ->first();
            
        if ($existingUser) {
            // Check if already associated with this city
            $doctorProfile = DoctorProfile::where('user_id', $existingUser->id)->first();
            if ($doctorProfile && !$doctorProfile->cities()->where('city_id', $city->id)->exists()) {
                $doctorProfile->cities()->attach($city->id, ['address' => $record->address]);
                echo "✓ Added {$cityName} to existing doctor: {$record->title}" . PHP_EOL;
                $imported++;
            } else {
                $skipped++;
            }
            continue;
        }
        
        // Find specialty
        $specialtyName = $record->department ?? 'General Physician';
        $specialty = $specialties->get($specialtyName) ?? $specialties->get('General Physician');
        
        // Create new user
        $user = User::create([
            'name' => $record->title,
            'email' => $record->email ?: Str::slug($record->title) . '_' . time() . '@example.com',
            'password' => Hash::make('password'),
            'phone' => $record->phone,
            'role' => 'doctor',
            'is_active' => true,
        ]);
        
        // Create doctor profile
        $imagePath = null;
        if ($record->image) {
            // Save BLOB image to file
            $filename = Str::slug($record->title) . '_' . time() . '.jpg';
            $path = public_path('images/doctors/' . $filename);
            file_put_contents($path, $record->image);
            $imagePath = 'images/doctors/' . $filename;
        }
        
        $doctor = DoctorProfile::create([
            'user_id' => $user->id,
            'specialization_id' => $specialty->id ?? null,
            'bio' => $record->description,
            'profile_image' => $imagePath,
            'is_verified' => true,
        ]);
        
        // Associate with city
        $doctor->cities()->attach($city->id, [
            'address' => $record->address,
        ]);
        
        echo "✓ Imported: {$record->title} -> {$cityName}" . PHP_EOL;
        $imported++;
        
    } catch (\Exception $e) {
        echo "✗ Error importing {$record->title}: " . $e->getMessage() . PHP_EOL;
        $errors++;
    }
}

echo PHP_EOL . "=== Import Complete ===" . PHP_EOL;
echo "Imported: {$imported}" . PHP_EOL;
echo "Skipped: {$skipped}" . PHP_EOL;
echo "Errors: {$errors}" . PHP_EOL;
