<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Seeding database for Hello Doctors...');

        // Create super admin first
        $this->command->info('Creating super admin...');
        User::updateOrCreate(
            ['email' => 'admin@hellodoctors.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Seed cities
        $this->command->info('Seeding cities...');
        $this->call(CitySeeder::class);

        // Seed specialties
        $this->command->info('Seeding specialties...');
        $this->call(SpecialtySeeder::class);

        // Seed old doctor data from SQL file
        $this->command->info('Importing old doctor data...');
        $this->command->warn('This may take several minutes depending on the SQL file size.');
        $this->call(OldDataSeeder::class);

        $this->command->info('Database seeding completed!');
    }
}
