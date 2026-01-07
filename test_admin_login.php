<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "Testing admin login credentials...\n\n";

$admin = User::where('email', 'admin@hellodoctors.com')->first();

if (!$admin) {
    echo "❌ Admin user not found!\n";
    exit(1);
}

echo "Admin user found:\n";
echo "ID: {$admin->id}\n";
echo "Name: {$admin->name}\n";
echo "Email: {$admin->email}\n";
echo "Role: {$admin->role}\n";
echo "Is Active: " . ($admin->is_active ? 'Yes' : 'No') . "\n";
echo "Email Verified: " . ($admin->email_verified_at ? 'Yes' : 'No') . "\n\n";

// Test password
$testPassword = 'admin123';
$passwordMatches = Hash::check($testPassword, $admin->password);

echo "Testing password: {$testPassword}\n";
echo "Password matches: " . ($passwordMatches ? '✓ Yes' : '❌ No') . "\n\n";

if (!$passwordMatches) {
    echo "Password hash in database:\n";
    echo substr($admin->password, 0, 60) . "...\n\n";
    
    // Try to update password
    echo "Updating password to 'admin123'...\n";
    $admin->password = Hash::make('admin123');
    $admin->save();
    echo "✓ Password updated!\n\n";
    
    // Verify again
    $admin->refresh();
    $newCheck = Hash::check('admin123', $admin->password);
    echo "New password verification: " . ($newCheck ? '✓ Yes' : '❌ No') . "\n";
}

echo "\n=================================\n";
echo "Login Credentials:\n";
echo "Email: admin@hellodoctors.com\n";
echo "Password: admin123\n";
echo "=================================\n";
