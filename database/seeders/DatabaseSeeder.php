<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorProfile;
use App\Models\DoctorScheduleSlot;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Seeding database for Hello Doctors...');

        $this->seedAdmin();
        $this->seedCities();
        $this->seedSpecialties();
        $this->call(\Database\Seeders\HomeServiceSeeder::class);
        $this->call(\Database\Seeders\HomeServiceProviderSeeder::class);
        $this->seedSampleDoctorsWithClinics();
        $this->seedPatients();

        // Seed old doctor data from SQL file
        $this->command->info('Importing old doctor data...');
        $this->command->warn('This may take several minutes depending on the SQL file size.');
        $this->call(OldDataSeeder::class);

        // Clean placeholder/header-like rows from legacy import.
        $this->cleanupInvalidImportedDoctors();

        // Ensure all doctor profiles have slugs for public profile URLs
        $this->command->info('Generating missing doctor slugs...');
        $this->call(DoctorSlugSeeder::class);

        $this->command->info('Database seeding completed!');
    }

    private function seedAdmin(): void
    {
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
    }

    private function seedCities(): void
    {
        $this->command->info('Seeding cities...');

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
    }

    private function seedSpecialties(): void
    {
        $this->command->info('Seeding specialties...');

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
            ['name' => 'Ayurveda', 'icon' => '🌿', 'image_path' => 'images/specialties/ayurveda.png', 'sort_order' => 40],
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
    }

    private function seedSampleDoctorsWithClinics(): void
    {
        $this->command->info('Seeding sample doctors with clinics and schedules...');

        $cities = City::whereIn('slug', ['lucknow', 'allahabad', 'kanpur'])->get();
        $specialties = Specialty::limit(5)->get();

        if ($cities->isEmpty() || $specialties->isEmpty()) {
            $this->command->warn('Cities or specialties not found. Skipping sample doctor seeding.');
            return;
        }

        $doctorData = [
            [
                'name' => 'Dr. Rajesh Patel',
                'email' => 'rajesh.patel@hellodoctors.com',
                'phone' => '9876543210',
                'specialty_index' => 0,
                'clinics' => [
                    ['name' => 'Max Healthcare', 'city_slug' => 'lucknow', 'address' => '123 Gomti Nagar, Lucknow', 'phone' => '0522-4123456', 'fee' => 500],
                    ['name' => 'City Care Clinic', 'city_slug' => 'lucknow', 'address' => '456 Alambagh, Lucknow', 'phone' => '0522-5123456', 'fee' => 400],
                ],
            ],
            [
                'name' => 'Dr. Priya Singh',
                'email' => 'priya.singh@hellodoctors.com',
                'phone' => '9876543211',
                'specialty_index' => 1,
                'clinics' => [
                    ['name' => 'Fortis Hospital', 'city_slug' => 'allahabad', 'address' => '789 Taramandal, Allahabad', 'phone' => '0532-4123456', 'fee' => 600],
                ],
            ],
            [
                'name' => 'Dr. Amit Verma',
                'email' => 'amit.verma@hellodoctors.com',
                'phone' => '9876543212',
                'specialty_index' => 2,
                'clinics' => [
                    ['name' => 'Apollo Clinic', 'city_slug' => 'kanpur', 'address' => '321 Mall Road, Kanpur', 'phone' => '0512-4123456', 'fee' => 550],
                ],
            ],
            [
                'name' => 'Dr. Sarah Khan',
                'email' => 'sarah.khan@hellodoctors.com',
                'phone' => '9876543213',
                'specialty_index' => 3,
                'clinics' => [
                    ['name' => 'Medanta Hospital', 'city_slug' => 'lucknow', 'address' => '654 Hazratganj, Lucknow', 'phone' => '0522-6123456', 'fee' => 700],
                ],
            ],
        ];

        foreach ($doctorData as $doctor) {
            $doctorUser = User::updateOrCreate(
                ['email' => $doctor['email']],
                [
                    'name' => $doctor['name'],
                    'phone' => $doctor['phone'],
                    'password' => Hash::make('doctor123'),
                    'role' => 'doctor',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $specialty = $specialties[$doctor['specialty_index']];
            $doctorProfile = DoctorProfile::updateOrCreate(
                ['user_id' => $doctorUser->id],
                [
                    'specialization_id' => $specialty->id,
                    'consultation_fee' => 500,
                    'is_verified' => true,
                    'is_available_online' => true,
                ]
            );

            foreach ($doctor['clinics'] as $clinicData) {
                $city = $cities->firstWhere('slug', $clinicData['city_slug']);
                if (!$city) {
                    continue;
                }

                $clinic = DoctorHospitalClinic::updateOrCreate(
                    [
                        'doctor_profile_id' => $doctorProfile->id,
                        'hospital_clinic_name' => $clinicData['name'],
                        'city_id' => $city->id,
                    ],
                    [
                        'address' => $clinicData['address'],
                        'phone' => $clinicData['phone'],
                        'email' => strtolower(str_replace(' ', '.', $clinicData['name'])) . '@clinic.com',
                        'consultation_fee' => $clinicData['fee'],
                        'is_active' => true,
                    ]
                );

                for ($dayOfWeek = 1; $dayOfWeek <= 5; $dayOfWeek++) {
                    DoctorScheduleSlot::updateOrCreate(
                        [
                            'doctor_hospital_clinic_id' => $clinic->id,
                            'day_of_week' => $dayOfWeek,
                        ],
                        [
                            'opening_time' => '09:00:00',
                            'closing_time' => '17:00:00',
                            'break_start_time' => '13:00:00',
                            'break_end_time' => '14:00:00',
                            'slot_duration_minutes' => 30,
                            'max_appointments_per_slot' => 2,
                            'is_available' => true,
                        ]
                    );
                }
            }
        }
    }

    private function seedPatients(): void
    {
        $this->command->info('Seeding sample patients...');

        $patients = [
            ['name' => 'Rahul Kumar', 'email' => 'rahul.kumar@example.com', 'phone' => '9876543220'],
            ['name' => 'Neha Sharma', 'email' => 'neha.sharma@example.com', 'phone' => '9876543221'],
            ['name' => 'Vikram Singh', 'email' => 'vikram.singh@example.com', 'phone' => '9876543222'],
            ['name' => 'Anjali Gupta', 'email' => 'anjali.gupta@example.com', 'phone' => '9876543223'],
            ['name' => 'Arjun Patel', 'email' => 'arjun.patel@example.com', 'phone' => '9876543224'],
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
        }
    }

    private function cleanupInvalidImportedDoctors(): void
    {
        $this->command->info('Cleaning invalid imported doctors...');

        $invalidDoctors = DoctorProfile::with('user')
            ->whereHas('user', function ($query) {
                $query->where('role', 'doctor')
                    ->whereRaw('LOWER(TRIM(BOTH \'`\' FROM name)) IN (?, ?)', ['title', 'name']);
            })
            ->get();
        // Also remove non-medical entities imported as doctors (medical stores, gyms, etc.)
        // identified by their search tags having a non-medical department keyword.
        $nonMedicalTags = ['medical-store', 'medical store', 'gym', 'super gym', 'ambulance', 'blood-bank', 'blood bank'];
        $nonMedicalDoctorIds = \Illuminate\Support\Facades\DB::table('search_tags')
            ->where('taggable_type', DoctorProfile::class)
            ->where(function ($q) use ($nonMedicalTags) {
                foreach ($nonMedicalTags as $tag) {
                    $q->orWhere('tags', 'LIKE', "% {$tag} %")
                      ->orWhere('tags', 'LIKE', "{$tag} %")
                      ->orWhere('tags', 'LIKE', "% {$tag}");
                }
            })
            ->pluck('taggable_id')
            ->toArray();

        if (!empty($nonMedicalDoctorIds)) {
            $nonMedicalProfiles = DoctorProfile::with('user')->whereIn('id', $nonMedicalDoctorIds)->get();
            foreach ($nonMedicalProfiles as $p) {
                if ($p->user) $p->user->delete();
                $p->delete();
            }
            $this->command->info("Non-medical entities removed: " . count($nonMedicalDoctorIds));
        }

        $deleted = 0;
        foreach ($invalidDoctors as $doctorProfile) {
            $user = $doctorProfile->user;
            $doctorProfile->delete();

            if ($user) {
                $user->delete();
            }

            $deleted++;
        }

        $this->command->info("Invalid imported doctors removed: {$deleted}");
    }
}
