<?php

namespace Database\Seeders;

use App\Models\HomeService;
use App\Models\HomeServiceCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HomeServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Nursing Care', 'description' => 'Qualified nursing support at home'],
            ['name' => 'Attendant Care', 'description' => 'General care support at home'],
            ['name' => 'Sample Collection', 'description' => 'Lab sample collection from home'],
            ['name' => 'Vitals Checkup', 'description' => 'Basic vitals and home checkups'],
            ['name' => 'Diagnostic Home Test', 'description' => 'Home diagnostic screening services'],
        ];

        $categoryMap = [];
        foreach ($categories as $category) {
            $record = HomeServiceCategory::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'is_active' => true,
                ]
            );

            $categoryMap[$record->slug] = $record->id;
        }

        $services = [
            [
                'category_slug' => 'nursing-care',
                'code' => 'HS-NURSE-BASIC',
                'name' => 'Basic Nursing Visit',
                'duration_minutes' => 60,
                'base_price' => 600,
                'price_type' => HomeService::PRICE_FIXED,
            ],
            [
                'category_slug' => 'attendant-care',
                'code' => 'HS-ATTEND-8H',
                'name' => 'Attendant Support (8 Hours)',
                'duration_minutes' => 480,
                'base_price' => 1200,
                'price_type' => HomeService::PRICE_PACKAGE,
            ],
            [
                'category_slug' => 'sample-collection',
                'code' => 'HS-SAMPLE-COLLECT',
                'name' => 'Sample Collection at Home',
                'duration_minutes' => 30,
                'base_price' => 250,
                'price_type' => HomeService::PRICE_FIXED,
            ],
            [
                'category_slug' => 'diagnostic-home-test',
                'code' => 'HS-ECG-HOME',
                'name' => 'Home ECG',
                'duration_minutes' => 30,
                'base_price' => 500,
                'price_type' => HomeService::PRICE_FIXED,
            ],
            [
                'category_slug' => 'vitals-checkup',
                'code' => 'HS-SUGAR-CHECK',
                'name' => 'Blood Sugar Check',
                'duration_minutes' => 20,
                'base_price' => 150,
                'price_type' => HomeService::PRICE_FIXED,
            ],
            [
                'category_slug' => 'vitals-checkup',
                'code' => 'HS-BP-CHECK',
                'name' => 'Blood Pressure Check',
                'duration_minutes' => 20,
                'base_price' => 120,
                'price_type' => HomeService::PRICE_FIXED,
            ],
        ];

        foreach ($services as $service) {
            $categoryId = $categoryMap[$service['category_slug']] ?? null;
            if (!$categoryId) {
                continue;
            }

            HomeService::updateOrCreate(
                ['code' => $service['code']],
                [
                    'category_id' => $categoryId,
                    'name' => $service['name'],
                    'description' => null,
                    'duration_minutes' => $service['duration_minutes'],
                    'base_price' => $service['base_price'],
                    'price_type' => $service['price_type'],
                    'buffer_minutes' => 15,
                    'requires_certification' => false,
                    'is_active' => true,
                ]
            );
        }
    }
}
