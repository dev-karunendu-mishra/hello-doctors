<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\HomeService;
use App\Models\HomeServiceProvider;
use App\Models\HomeServiceProviderAvailability;
use App\Models\HomeServiceProviderService;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class HomeServiceProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providerRole = $this->resolveProviderRoleValue();

        $cities = City::query()->get()->keyBy('slug');
        $services = HomeService::query()->active()->get()->keyBy('code');

        if ($cities->isEmpty() || $services->isEmpty()) {
            $this->command?->warn('Cities/services missing. Skipping home service provider seeding.');
            return;
        }

        $providers = [
            [
                'name' => 'Anita Sharma',
                'email' => 'anita.provider@hellodoctors.com',
                'phone' => '9000001001',
                'city_slug' => 'lucknow',
                'provider_type' => 'nurse',
                'experience_years' => 7,
                'license_number' => 'NUR-LKO-001',
                'service_radius_km' => 12,
                'service_codes' => ['HS-NURSE-BASIC', 'HS-BP-CHECK', 'HS-SUGAR-CHECK'],
            ],
            [
                'name' => 'Ravi Kumar',
                'email' => 'ravi.provider@hellodoctors.com',
                'phone' => '9000001002',
                'city_slug' => 'allahabad',
                'provider_type' => 'attendant',
                'experience_years' => 5,
                'license_number' => 'ATT-ALD-002',
                'service_radius_km' => 10,
                'service_codes' => ['HS-ATTEND-8H'],
            ],
            [
                'name' => 'Farhan Ali',
                'email' => 'farhan.provider@hellodoctors.com',
                'phone' => '9000001003',
                'city_slug' => 'kanpur',
                'provider_type' => 'lab_tech',
                'experience_years' => 6,
                'license_number' => 'LAB-KNP-003',
                'service_radius_km' => 15,
                'service_codes' => ['HS-SAMPLE-COLLECT', 'HS-ECG-HOME', 'HS-SUGAR-CHECK'],
            ],
        ];

        foreach ($providers as $item) {
            $city = $cities->get($item['city_slug']);
            if (!$city) {
                continue;
            }

            $user = User::query()->updateOrCreate(
                ['email' => $item['email']],
                [
                    'name' => $item['name'],
                    'phone' => $item['phone'],
                    'password' => Hash::make('provider123'),
                    'role' => $providerRole,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $provider = HomeServiceProvider::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'provider_type' => $item['provider_type'],
                    'license_number' => $item['license_number'],
                    'experience_years' => $item['experience_years'],
                    'city_id' => $city->id,
                    'service_radius_km' => $item['service_radius_km'],
                    'is_verified' => true,
                    'is_active' => true,
                ]
            );

            foreach ($item['service_codes'] as $code) {
                $service = $services->get($code);
                if (!$service) {
                    continue;
                }

                HomeServiceProviderService::query()->updateOrCreate(
                    [
                        'provider_id' => $provider->id,
                        'home_service_id' => $service->id,
                    ],
                    [
                        'custom_price' => null,
                        'is_active' => true,
                    ]
                );
            }

            for ($day = 0; $day <= 6; $day++) {
                $isSunday = $day === 0;

                HomeServiceProviderAvailability::query()->updateOrCreate(
                    [
                        'provider_id' => $provider->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'opening_time' => $isSunday ? null : '09:00',
                        'closing_time' => $isSunday ? null : '18:00',
                        'break_start_time' => $isSunday ? null : '13:00',
                        'break_end_time' => $isSunday ? null : '14:00',
                        'slot_duration_minutes' => 30,
                        'max_bookings_per_slot' => 2,
                        'is_available' => !$isSunday,
                    ]
                );
            }
        }

        $this->command?->info('Home service providers, mappings, and availability seeded.');
    }

    private function resolveProviderRoleValue(): string
    {
        $defaultRole = 'doctor';

        try {
            $column = DB::selectOne("SHOW COLUMNS FROM users LIKE 'role'");
            $type = $column->Type ?? '';

            if (is_string($type) && str_contains($type, 'home_service_provider')) {
                return 'home_service_provider';
            }
        } catch (\Throwable $e) {
            $this->command?->warn('Could not inspect users.role enum. Falling back to doctor role for sample providers.');
        }

        $this->command?->warn('users.role does not support home_service_provider yet. Using doctor role for sample provider users.');

        return $defaultRole;
    }
}
