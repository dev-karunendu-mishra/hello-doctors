<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CitySeeder extends Seeder
{
    public function run(): void
    {
        $cities = [
            ['name' => 'Agra', 'state' => 'Uttar Pradesh'],
            ['name' => 'Allahabad', 'state' => 'Uttar Pradesh'],
            ['name' => 'Deoria', 'state' => 'Uttar Pradesh'],
            ['name' => 'Gorakhpur', 'state' => 'Uttar Pradesh'],
            ['name' => 'Kanpur', 'state' => 'Uttar Pradesh'],
            ['name' => 'Lucknow', 'state' => 'Uttar Pradesh'],
            ['name' => 'Mirzapur', 'state' => 'Uttar Pradesh'],
            ['name' => 'Varanasi', 'state' => 'Uttar Pradesh'],
        ];

        foreach ($cities as $city) {
            City::updateOrCreate(
                ['slug' => Str::slug($city['name'])],
                [
                    'name' => $city['name'],
                    'state' => $city['state'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Cities seeded successfully!');
    }
}
