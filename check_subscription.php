<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Subscription;

echo "Subscription System Status\n";
echo "==========================\n\n";

// Check table exists
try {
    $count = Subscription::count();
    echo "✓ Subscriptions table exists\n";
    echo "✓ Total subscriptions: {$count}\n\n";
    
    if ($count > 0) {
        echo "Recent subscriptions:\n";
        $recent = Subscription::latest()->take(5)->get();
        foreach ($recent as $sub) {
            echo "  - {$sub->email} (";
            echo $sub->is_active ? 'Active' : 'Inactive';
            echo ") - {$sub->subscribed_at->format('Y-m-d H:i:s')}\n";
        }
    } else {
        echo "No subscriptions yet.\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n==========================\n";
echo "Subscription endpoint: POST /subscribe\n";
echo "Frontend: Footer component ready\n";
echo "==========================\n";
