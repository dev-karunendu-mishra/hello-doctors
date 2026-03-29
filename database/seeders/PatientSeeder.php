<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding sample patients...');

        $patients = [
            [
                'name' => 'Rahul Kumar',
                'email' => 'rahul.kumar@example.com',
                'phone' => '9876543220',
            ],
            [
                'name' => 'Neha Sharma',
                'email' => 'neha.sharma@example.com',
                'phone' => '9876543221',
            ],
            [
                'name' => 'Vikram Singh',
                'email' => 'vikram.singh@example.com',
                'phone' => '9876543222',
            ],
            [
                'name' => 'Anjali Gupta',
                'email' => 'anjali.gupta@example.com',
                'phone' => '9876543223',
            ],
            [
                'name' => 'Arjun Patel',
                'email' => 'arjun.patel@example.com',
                'phone' => '9876543224',
            ],
        ];

        foreach ($patients as $patient) {
            User::updateOrCreate(
                ['email' => $patient['email']],
                [
                    'name' => $patient['name'],
                    'phone' => $patient['phone'],
                    'password' => Hash::make('patient123'),
                    'role' => 'patient',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $this->command->info("✓ Created patient: {$patient['name']}");
        }

        $this->command->info('✓ Sample patients seeded successfully!');
    }
}
