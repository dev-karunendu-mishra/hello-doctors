<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorProfile;
use App\Models\DoctorScheduleSlot;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DoctorWithClinicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding doctors with clinics and schedules...');

        // Get sample cities and specialties
        $cities = City::whereIn('slug', ['lucknow', 'allahabad', 'kanpur'])->get();
        $specialties = Specialty::limit(5)->get();

        if ($cities->isEmpty() || $specialties->isEmpty()) {
            $this->command->warn('Cities or specialties not found. Run base seeders first.');
            return;
        }

        $doctorData = [
            [
                'name' => 'Dr. Rajesh Patel',
                'email' => 'rajesh.patel@hellodoctors.com',
                'phone' => '9876543210',
                'specialty_index' => 0,
                'clinics' => [
                    [
                        'name' => 'Max Healthcare',
                        'city_slug' => 'lucknow',
                        'address' => '123 Gomti Nagar, Lucknow',
                        'phone' => '0522-4123456',
                        'fee' => 500,
                    ],
                    [
                        'name' => 'City Care Clinic',
                        'city_slug' => 'lucknow',
                        'address' => '456 Alambagh, Lucknow',
                        'phone' => '0522-5123456',
                        'fee' => 400,
                    ],
                ],
            ],
            [
                'name' => 'Dr. Priya Singh',
                'email' => 'priya.singh@hellodoctors.com',
                'phone' => '9876543211',
                'specialty_index' => 1,
                'clinics' => [
                    [
                        'name' => 'Fortis Hospital',
                        'city_slug' => 'allahabad',
                        'address' => '789 Taramandal, Allahabad',
                        'phone' => '0532-4123456',
                        'fee' => 600,
                    ],
                ],
            ],
            [
                'name' => 'Dr. Amit Verma',
                'email' => 'amit.verma@hellodoctors.com',
                'phone' => '9876543212',
                'specialty_index' => 2,
                'clinics' => [
                    [
                        'name' => 'Apollo Clinic',
                        'city_slug' => 'kanpur',
                        'address' => '321 Mall Road, Kanpur',
                        'phone' => '0512-4123456',
                        'fee' => 550,
                    ],
                ],
            ],
            [
                'name' => 'Dr. Sarah Khan',
                'email' => 'sarah.khan@hellodoctors.com',
                'phone' => '9876543213',
                'specialty_index' => 3,
                'clinics' => [
                    [
                        'name' => 'Medanta Hospital',
                        'city_slug' => 'lucknow',
                        'address' => '654 Hazratganj, Lucknow',
                        'phone' => '0522-6123456',
                        'fee' => 700,
                    ],
                ],
            ],
        ];

        foreach ($doctorData as $doctor) {
            // Create/Update doctor user
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

            // Create/Update doctor profile
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

            // Create clinics and schedules
            foreach ($doctor['clinics'] as $clinicData) {
                $city = $cities->firstWhere('slug', $clinicData['city_slug']);
                if (!$city) {
                    continue;
                }

                // Create hospital/clinic
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

                // Create weekly schedules (Monday to Friday, 9 AM to 5 PM)
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

                $this->command->info(
                    "✓ Created clinic: {$clinicData['name']} with schedules for {$doctor['name']}"
                );
            }
        }

        $this->command->info('✓ Doctors with clinics and schedules seeded successfully!');
    }
}
