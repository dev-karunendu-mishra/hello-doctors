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
            ['name' => 'Dermatologist', 'icon' => '🧴', 'image_path' => 'images/specialties/dermatologist.png', 'sort_order' => 1],
            ['name' => 'ENT Surgeon', 'icon' => '👂', 'image_path' => 'images/specialties/ent.png', 'sort_order' => 2],
            ['name' => 'Orthopedic Surgeon', 'icon' => '🦴', 'image_path' => 'images/specialties/surgeon.png', 'sort_order' => 3],
            ['name' => 'Nephrologist', 'icon' => '🫘', 'image_path' => 'images/specialties/nephrologists.png', 'sort_order' => 4],
            ['name' => 'Pediatrician', 'icon' => '👶', 'image_path' => 'images/specialties/paediatricians.png', 'sort_order' => 5],
            ['name' => 'Neurologist', 'icon' => '🧠', 'image_path' => 'images/specialties/neurologist.png', 'sort_order' => 6],
            ['name' => 'Anesthesiologist', 'icon' => '💉', 'image_path' => 'images/specialties/Anesthesiologist.png', 'sort_order' => 7],
            ['name' => 'Cardio-Thoracic & Vascular Surgeon', 'icon' => '🫀', 'image_path' => 'images/specialties/CTV.png', 'sort_order' => 8],
            ['name' => 'Cardiologist', 'icon' => '❤️', 'image_path' => 'images/specialties/cardiology.gif', 'sort_order' => 9],
            ['name' => 'Homeopathy', 'icon' => '🌿', 'image_path' => 'images/specialties/homeopathic.png', 'sort_order' => 10],
            ['name' => 'Veterinary Doctor', 'icon' => '🐾', 'image_path' => 'images/specialties/veterinary.png', 'sort_order' => 11],
            ['name' => 'TB and Chest Specialist', 'icon' => '🫁', 'image_path' => 'images/specialties/Chest.png', 'sort_order' => 12],
            ['name' => 'Geriatric Physician', 'icon' => '👴', 'image_path' => 'images/specialties/Geriatric_Physician.png', 'sort_order' => 13],
            ['name' => 'Ophthalmologist', 'icon' => '👁️', 'image_path' => 'images/specialties/ophthalmologists.png', 'sort_order' => 14],
            ['name' => 'Unani', 'icon' => '🌱', 'image_path' => 'images/specialties/Unani.png', 'sort_order' => 15],
            ['name' => 'Gynecologist', 'icon' => '👩', 'image_path' => 'images/specialties/Gynecologist.png', 'sort_order' => 16],
            ['name' => 'Psychiatrist', 'icon' => '🧘', 'image_path' => 'images/specialties/psychiatrists.png', 'sort_order' => 17],
            ['name' => 'Gastroenterologist', 'icon' => '🫃', 'image_path' => 'images/specialties/gastroenterologists.png', 'sort_order' => 18],
            ['name' => 'Physiotherapist', 'icon' => '💪', 'image_path' => 'images/specialties/physiotherapists.png', 'sort_order' => 19],
            ['name' => 'Oncologist', 'icon' => '🎗️', 'image_path' => 'images/specialties/Oncologist.png', 'sort_order' => 20],
            ['name' => 'Audiologist', 'icon' => '👂', 'image_path' => 'images/specialties/Audiologist.png', 'sort_order' => 21],
            ['name' => 'Naturopathy', 'icon' => '🍃', 'image_path' => 'images/specialties/Naturopathy.png', 'sort_order' => 22],
            ['name' => 'Pathologist', 'icon' => '🔬', 'image_path' => 'images/specialties/Pathologist.png', 'sort_order' => 23],
            ['name' => 'General Physician', 'icon' => '👨‍⚕️', 'image_path' => 'images/specialties/Physician.png', 'sort_order' => 24],
            ['name' => 'Urologist', 'icon' => '🚻', 'image_path' => 'images/specialties/urologists.png', 'sort_order' => 25],
            ['name' => 'Neurosurgeon', 'icon' => '🧠', 'image_path' => 'images/specialties/neuosurgeons.png', 'sort_order' => 26],
            ['name' => 'Endocrinologist', 'icon' => '🦴', 'image_path' => 'images/specialties/Endocrinologist.png', 'sort_order' => 27],
            ['name' => 'Dentist', 'icon' => '🦷', 'image_path' => 'images/specialties/dentist.png', 'sort_order' => 28],
            ['name' => 'Yoga', 'icon' => '🧘‍♀️', 'image_path' => 'images/specialties/yoga.png', 'sort_order' => 29],
            ['name' => 'Dietitian', 'icon' => '🥗', 'image_path' => 'images/specialties/Dietitian.png', 'sort_order' => 30],
            ['name' => 'Radiologist', 'icon' => '📡', 'image_path' => 'images/specialties/Radiologist.png', 'sort_order' => 31],
            ['name' => 'General Surgeon', 'icon' => '⚕️', 'image_path' => 'images/specialties/surgeon.png', 'sort_order' => 32],
            ['name' => 'Optometrist', 'icon' => '👓', 'image_path' => 'images/specialties/Optometrist.png', 'sort_order' => 33],
            ['name' => 'Plastic Surgeon', 'icon' => '💉', 'image_path' => 'images/specialties/Plastic_Surgeon.png', 'sort_order' => 34],
            ['name' => 'Pulmonologist', 'icon' => '🫁', 'image_path' => 'images/specialties/Pulmonologists.png', 'sort_order' => 35],
            ['name' => 'Diabetologist', 'icon' => '💉', 'image_path' => 'images/specialties/diabetologists.png', 'sort_order' => 36],
            ['name' => 'Sexologist', 'icon' => '👥', 'image_path' => 'images/specialties/sexologists.png', 'sort_order' => 37],
            ['name' => 'Pain Physician', 'icon' => '⚡', 'image_path' => 'images/specialties/pain-physician.png', 'sort_order' => 38],
            ['name' => 'Rheumatologist', 'icon' => '🦴', 'image_path' => 'images/specialties/Rheumatologist.jpg', 'sort_order' => 39],
        ];

        foreach ($specialties as $specialty) {
            Specialty::updateOrCreate(
                ['slug' => Str::slug($specialty['name'])],
                [
                    'name' => $specialty['name'],
                    'icon' => $specialty['icon'],
                    'image_path' => $specialty['image_path'],
                    'description' => null,
                    'sort_order' => $specialty['sort_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Specialties seeded successfully with images!');
    }
}

