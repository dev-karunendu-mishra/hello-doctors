<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            ['name' => 'Dermatologist', 'icon' => 'skin', 'sort_order' => 1],
            ['name' => 'ENT Surgeon', 'icon' => 'ear', 'sort_order' => 2],
            ['name' => 'Orthopedic', 'icon' => 'bone', 'sort_order' => 3],
            ['name' => 'Nephrologist', 'icon' => 'kidney', 'sort_order' => 4],
            ['name' => 'Pediatric', 'icon' => 'baby', 'sort_order' => 5],
            ['name' => 'Neurologist', 'icon' => 'brain', 'sort_order' => 6],
            ['name' => 'Anesthesiologist', 'icon' => 'syringe', 'sort_order' => 7],
            ['name' => 'CTV Surgeon', 'icon' => 'heart', 'sort_order' => 8],
            ['name' => 'Cardiologist', 'icon' => 'heart-pulse', 'sort_order' => 9],
            ['name' => 'Homeopathy', 'icon' => 'leaf', 'sort_order' => 10],
            ['name' => 'Ayurvedic', 'icon' => 'herb', 'sort_order' => 11],
            ['name' => 'Dentist', 'icon' => 'tooth', 'sort_order' => 12],
            ['name' => 'General Physician', 'icon' => 'stethoscope', 'sort_order' => 13],
            ['name' => 'Gynecologist', 'icon' => 'female', 'sort_order' => 14],
            ['name' => 'Ophthalmologist', 'icon' => 'eye', 'sort_order' => 15],
            ['name' => 'Psychiatrist', 'icon' => 'brain-circuit', 'sort_order' => 16],
            ['name' => 'Gastroenterologist', 'icon' => 'stomach', 'sort_order' => 17],
            ['name' => 'Urologist', 'icon' => 'kidney', 'sort_order' => 18],
            ['name' => 'Radiologist', 'icon' => 'x-ray', 'sort_order' => 19],
            ['name' => 'Pulmonologist', 'icon' => 'lungs', 'sort_order' => 20],
        ];

        foreach ($specialties as $specialty) {
            Specialty::updateOrCreate(
                ['slug' => Str::slug($specialty['name'])],
                [
                    'name' => $specialty['name'],
                    'icon' => $specialty['icon'],
                    'sort_order' => $specialty['sort_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Specialties seeded successfully!');
    }
}
