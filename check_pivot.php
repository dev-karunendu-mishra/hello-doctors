<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Total doctor_cities associations: " . DB::table('doctor_cities')->count() . PHP_EOL;

// Check each city
$cities = DB::table('cities')->orderBy('name')->get();
foreach ($cities as $city) {
    $count = DB::table('doctor_cities')->where('city_id', $city->id)->count();
    if ($count > 0 || $city->name == 'Allahabad') {
        echo "{$city->name} (ID: {$city->id}): {$count} doctors" . PHP_EOL;
    }
}

// Sample doctor-city associations
echo PHP_EOL . "Sample doctor_cities records:" . PHP_EOL;
$samples = DB::table('doctor_cities')
    ->join('cities', 'doctor_cities.city_id', '=', 'cities.id')
    ->join('doctor_profiles', 'doctor_cities.doctor_profile_id', '=', 'doctor_profiles.id')
    ->join('users', 'doctor_profiles.user_id', '=', 'users.id')
    ->select('users.name as doctor_name', 'cities.name as city_name', 'doctor_cities.address')
    ->take(10)
    ->get();

foreach ($samples as $record) {
    echo "  {$record->doctor_name} -> {$record->city_name}" . PHP_EOL;
}
