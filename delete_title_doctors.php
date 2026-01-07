<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DoctorProfile;
use App\Models\User;

echo "Searching for doctors with name 'title' or '`title`'...\n";

// Find all users with name containing 'title'
$titleUsers = User::where('name', 'LIKE', '%title%')
    ->orWhere('name', 'LIKE', '%`title`%')
    ->get();

echo "Found " . $titleUsers->count() . " users with 'title' in name:\n";

foreach ($titleUsers as $user) {
    echo "  - ID: {$user->id}, Name: '{$user->name}', Email: {$user->email}\n";
}

if ($titleUsers->count() > 0) {
    echo "\nDeleting users and their doctor profiles...\n";
    
    $deletedCount = 0;
    foreach ($titleUsers as $user) {
        // Get doctor profile if exists
        $doctorProfile = DoctorProfile::where('user_id', $user->id)->first();
        
        if ($doctorProfile) {
            // Delete pivot table entries (doctor_cities)
            $doctorProfile->cities()->detach();
            echo "  - Deleted city associations for doctor profile ID: {$doctorProfile->id}\n";
            
            // Delete doctor profile
            $doctorProfile->delete();
            echo "  - Deleted doctor profile ID: {$doctorProfile->id}\n";
        }
        
        // Delete user
        $user->delete();
        echo "  - Deleted user ID: {$user->id}, Name: '{$user->name}'\n";
        $deletedCount++;
    }
    
    echo "\n✓ Successfully deleted {$deletedCount} users with 'title' in their name\n";
} else {
    echo "\nNo doctors found with 'title' in name.\n";
}

echo "\nVerifying remaining doctors...\n";
$remainingDoctors = DoctorProfile::with('user')->count();
echo "Total doctors remaining: {$remainingDoctors}\n";
