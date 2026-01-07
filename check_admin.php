<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Checking admin users...\n\n";

$admins = User::where('role', 'super_admin')->get();

echo "Total admin users: " . $admins->count() . "\n\n";

foreach ($admins as $admin) {
    echo "ID: {$admin->id}\n";
    echo "Name: {$admin->name}\n";
    echo "Email: {$admin->email}\n";
    echo "Role: {$admin->role}\n";
    echo "Is Active: " . ($admin->is_active ? 'Yes' : 'No') . "\n";
    echo "Email Verified: " . ($admin->email_verified_at ? 'Yes' : 'No') . "\n";
    echo "Created: {$admin->created_at}\n";
    echo "\n";
}

echo "Login credentials:\n";
echo "Email: admin@hellodoctors.com\n";
echo "Password: admin123\n";
