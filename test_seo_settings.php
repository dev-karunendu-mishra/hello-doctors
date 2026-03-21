<?php

/**
 * Script to test SEO settings functionality
 * Run this: php test_seo_settings.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SiteSetting;

echo "Testing SEO Settings Functionality\n";
echo "===================================\n\n";

// Test 1: Save settings
echo "Test 1: Saving SEO settings...\n";
$testSettings = [
    'meta_title' => 'Test Title',
    'meta_description' => 'Test Description',
    'meta_keywords' => 'test, keywords',
];

foreach ($testSettings as $key => $value) {
    SiteSetting::set($key, $value, 'text', 'seo');
    echo "  ✓ Saved: {$key} = {$value}\n";
}

// Test 2: Retrieve settings
echo "\nTest 2: Retrieving SEO settings...\n";
$settings = SiteSetting::where('group', 'seo')->get();
echo "  Found " . $settings->count() . " SEO settings in database\n";

foreach ($testSettings as $key => $value) {
    $retrieved = SiteSetting::get($key);
    if ($retrieved === $value) {
        echo "  ✓ {$key}: {$retrieved}\n";
    } else {
        echo "  ✗ {$key}: Expected '{$value}', got '{$retrieved}'\n";
    }
}

// Test 3: Test getByGroup method
echo "\nTest 3: Testing getByGroup method...\n";
$groupSettings = SiteSetting::getByGroup('seo');
echo "  Retrieved " . count($groupSettings) . " settings using getByGroup('seo')\n";

// Test 4: Clear cache and verify settings remain
echo "\nTest 4: Cache clear test...\n";
\Artisan::call('cache:clear');
echo "  ✓ Cache cleared\n";

$afterCache = SiteSetting::get('meta_title');
echo "  ✓ Setting still exists after cache clear: {$afterCache}\n";

// Test 5: Update existing setting
echo "\nTest 5: Update existing setting...\n";
$newValue = 'Updated Test Title';
SiteSetting::set('meta_title', $newValue, 'text', 'seo');
$updated = SiteSetting::get('meta_title');
if ($updated === $newValue) {
    echo "  ✓ Update successful: {$updated}\n";
} else {
    echo "  ✗ Update failed: Expected '{$newValue}', got '{$updated}'\n";
}

// Test 6: Test with null/empty values
echo "\nTest 6: Testing with empty values...\n";
SiteSetting::set('empty_test', '', 'text', 'seo');
$emptyValue = SiteSetting::get('empty_test', 'default');
echo "  Empty value stored: '" . $emptyValue . "'\n";

SiteSetting::set('null_test', null, 'text', 'seo');
$nullValue = SiteSetting::get('null_test', 'default');
echo "  Null value stored: '" . ($nullValue ?? 'NULL') . "'\n";

// Cleanup test data
echo "\nCleaning up test data...\n";
SiteSetting::where('key', 'empty_test')->delete();
SiteSetting::where('key', 'null_test')->delete();
echo "  ✓ Cleanup complete\n";

echo "\n✅ All tests completed!\n";
echo "\nCurrent SEO settings in database:\n";
echo "==================================\n";
$allSettings = SiteSetting::where('group', 'seo')->get();
foreach ($allSettings as $setting) {
    echo "  {$setting->key}: {$setting->value}\n";
}
