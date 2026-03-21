<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SiteSetting;

echo "Current SEO Settings in Database\n";
echo "=================================\n\n";

$settings = SiteSetting::where('group', 'seo')->get();

if ($settings->count() === 0) {
    echo "No SEO settings found in database.\n";
    echo "Settings will be created when you save from the admin panel.\n";
} else {
    echo "Found {$settings->count()} SEO settings:\n\n";
    
    foreach ($settings as $setting) {
        $value = $setting->value ?: '(empty)';
        echo "  {$setting->key}: {$value}\n";
    }
}

echo "\n";
echo "To update settings:\n";
echo "1. Visit: http://your-domain/admin/seo\n";
echo "2. Fill in the fields\n";
echo "3. Click 'Save SEO Settings'\n";
echo "4. Run this script again to verify\n";
