<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        User::updateOrCreate(
            ['email' => 'admin@hellodoctors.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create Sample Doctor
        User::updateOrCreate(
            ['email' => 'doctor@hellodoctors.com'],
            [
                'name' => 'Dr. John Smith',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'specialization' => 'General Physician',
                'license_number' => 'DOC123456',
                'phone' => '1234567890',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create Sample Patient
        User::updateOrCreate(
            ['email' => 'patient@hellodoctors.com'],
            [
                'name' => 'Jane Doe',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '0987654321',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
