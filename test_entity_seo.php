<?php

/**
 * Test Script: Entity-Specific SEO
 * 
 * This script tests the new entity-specific SEO functionality for doctors and specialties.
 * Run: php test_entity_seo.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DoctorProfile;
use App\Models\Specialty;

echo "=== Entity-Specific SEO Test ===\n\n";

// Test 1: Check if SEO fields exist in doctor_profiles table
echo "Test 1: Doctor Profile SEO Fields\n";
echo "-----------------------------------\n";
try {
    $doctor = DoctorProfile::first();
    if ($doctor) {
        echo "✓ Doctor found: {$doctor->user->name}\n";
        echo "  - Slug: " . ($doctor->slug ?: 'NULL') . "\n";
        echo "  - Meta Title: " . ($doctor->meta_title ?: 'NULL (will use auto-generated)') . "\n";
        echo "  - Meta Description: " . ($doctor->meta_description ?: 'NULL (will use auto-generated)') . "\n";
        echo "  - Meta Keywords: " . ($doctor->meta_keywords ?: 'NULL (will use auto-generated)') . "\n";
    } else {
        echo "⚠ No doctors found in database\n";
    }
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Check if SEO fields exist in specialties table
echo "Test 2: Specialty SEO Fields\n";
echo "-----------------------------------\n";
try {
    $specialty = Specialty::first();
    if ($specialty) {
        echo "✓ Specialty found: {$specialty->name}\n";
        echo "  - Slug: " . ($specialty->slug ?: 'NULL') . "\n";
        echo "  - Meta Title: " . ($specialty->meta_title ?: 'NULL (will use auto-generated)') . "\n";
        echo "  - Meta Description: " . ($specialty->meta_description ?: 'NULL (will use auto-generated)') . "\n";
        echo "  - Meta Keywords: " . ($specialty->meta_keywords ?: 'NULL (will use auto-generated)') . "\n";
    } else {
        echo "⚠ No specialties found in database\n";
    }
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 3: Test creating a doctor with SEO fields
echo "Test 3: Create Doctor with SEO\n";
echo "-----------------------------------\n";
try {
    // Find a user without a doctor profile or create a test scenario
    $testDoctor = DoctorProfile::first();
    if ($testDoctor) {
        $testDoctor->meta_title = "Test Doctor SEO Title";
        $testDoctor->meta_description = "This is a test meta description for SEO purposes.";
        $testDoctor->meta_keywords = "test, doctor, seo, keywords";
        $testDoctor->save();
        
        echo "✓ Doctor SEO updated successfully\n";
        echo "  - Meta Title: {$testDoctor->meta_title}\n";
        echo "  - Meta Description: {$testDoctor->meta_description}\n";
        echo "  - Meta Keywords: {$testDoctor->meta_keywords}\n";
        
        // Revert changes
        $testDoctor->meta_title = null;
        $testDoctor->meta_description = null;
        $testDoctor->meta_keywords = null;
        $testDoctor->save();
        echo "✓ Test data reverted\n";
    } else {
        echo "⚠ No doctors available for testing\n";
    }
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Test creating a specialty with SEO fields
echo "Test 4: Create Specialty with SEO\n";
echo "-----------------------------------\n";
try {
    $testSpecialty = Specialty::first();
    if ($testSpecialty) {
        $testSpecialty->meta_title = "Test Specialty SEO Title";
        $testSpecialty->meta_description = "This is a test meta description for specialty SEO.";
        $testSpecialty->meta_keywords = "test, specialty, seo, keywords";
        $testSpecialty->save();
        
        echo "✓ Specialty SEO updated successfully\n";
        echo "  - Meta Title: {$testSpecialty->meta_title}\n";
        echo "  - Meta Description: {$testSpecialty->meta_description}\n";
        echo "  - Meta Keywords: {$testSpecialty->meta_keywords}\n";
        
        // Revert changes
        $testSpecialty->meta_title = null;
        $testSpecialty->meta_description = null;
        $testSpecialty->meta_keywords = null;
        $testSpecialty->save();
        echo "✓ Test data reverted\n";
    } else {
        echo "⚠ No specialties available for testing\n";
    }
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Verify fillable fields
echo "Test 5: Verify Model Fillable Fields\n";
echo "-----------------------------------\n";
try {
    $doctor = new DoctorProfile();
    $doctorFillable = $doctor->getFillable();
    
    $hasSeoFields = in_array('meta_title', $doctorFillable) && 
                    in_array('meta_description', $doctorFillable) && 
                    in_array('meta_keywords', $doctorFillable);
    
    if ($hasSeoFields) {
        echo "✓ DoctorProfile has SEO fields in fillable array\n";
    } else {
        echo "✗ DoctorProfile missing SEO fields in fillable array\n";
    }
    
    $specialty = new Specialty();
    $specialtyFillable = $specialty->getFillable();
    
    $hasSeoFields = in_array('meta_title', $specialtyFillable) && 
                    in_array('meta_description', $specialtyFillable) && 
                    in_array('meta_keywords', $specialtyFillable);
    
    if ($hasSeoFields) {
        echo "✓ Specialty has SEO fields in fillable array\n";
    } else {
        echo "✗ Specialty missing SEO fields in fillable array\n";
    }
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
