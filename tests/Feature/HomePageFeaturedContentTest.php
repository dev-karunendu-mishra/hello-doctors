<?php

use App\Models\City;
use App\Models\HomeService;
use App\Models\HomeServiceCategory;
use App\Models\Specialty;

function seedHomePageCity(): void
{
    if (! City::query()->exists()) {
        City::create([
            'name' => 'Lucknow',
            'slug' => 'lucknow',
            'state' => 'Uttar Pradesh',
            'is_active' => true,
        ]);
    }
}

test('featured specialties are shown first on the home page', function () {
    seedHomePageCity();

    Specialty::create([
        'name' => 'General Medicine',
        'slug' => 'general-medicine',
        'is_active' => true,
        'is_featured_on_home' => false,
        'sort_order' => 1,
    ]);

    Specialty::create([
        'name' => 'Cardiology',
        'slug' => 'cardiology',
        'is_active' => true,
        'is_featured_on_home' => true,
        'sort_order' => 99,
    ]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertSeeInOrder(['Cardiology', 'General Medicine']);
});

test('featured home services are shown first on the home page', function () {
    seedHomePageCity();

    $category = HomeServiceCategory::create([
        'name' => 'Home Care',
        'slug' => 'home-care',
        'is_active' => true,
    ]);

    HomeService::create([
        'category_id' => $category->id,
        'code' => 'REGULAR-VISIT',
        'name' => 'Regular Visit',
        'is_active' => true,
        'is_featured_on_home' => false,
        'base_price' => 500,
        'duration_minutes' => 30,
        'price_type' => HomeService::PRICE_FIXED,
        'buffer_minutes' => 15,
        'requires_certification' => false,
    ]);

    HomeService::create([
        'category_id' => $category->id,
        'code' => 'FEATURED-VISIT',
        'name' => 'Featured Visit',
        'is_active' => true,
        'is_featured_on_home' => true,
        'base_price' => 750,
        'duration_minutes' => 30,
        'price_type' => HomeService::PRICE_FIXED,
        'buffer_minutes' => 15,
        'requires_certification' => false,
    ]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertSeeInOrder(['Featured Visit', 'Regular Visit']);
});
