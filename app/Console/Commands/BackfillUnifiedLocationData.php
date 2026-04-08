<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
use App\Models\DoctorPracticeSchedule;
use App\Models\DoctorProfile;
use App\Models\DoctorScheduleSlot;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class BackfillUnifiedLocationData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'location:backfill
                            {--dry-run : Simulate the backfill and roll everything back at the end}
                            {--chunk=200 : Number of rows to process per chunk}
                            {--only=all : Limit processing to doctors, home-services, or all}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill unified address, clinic, practice location, and schedule data from legacy tables';

    /**
     * Runtime summary counters.
     *
     * @var array<string, int>
     */
    protected array $summary = [
        'home_service_addresses_processed' => 0,
        'doctor_hospital_clinics_processed' => 0,
        'doctor_schedule_slots_processed' => 0,
        'doctor_city_rows_processed' => 0,
        'addresses_created' => 0,
        'addresses_updated' => 0,
        'clinics_created' => 0,
        'clinics_updated' => 0,
        'practice_locations_created' => 0,
        'practice_locations_updated' => 0,
        'practice_schedules_created' => 0,
        'practice_schedules_updated' => 0,
        'appointments_updated' => 0,
        'home_service_bookings_updated' => 0,
        'provider_base_addresses_updated' => 0,
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $chunk = max((int) $this->option('chunk'), 1);
        $only = strtolower((string) $this->option('only'));
        $dryRun = (bool) $this->option('dry-run');

        if (!in_array($only, ['all', 'doctors', 'home-services'], true)) {
            $this->error("Invalid --only value [{$only}]. Use one of: all, doctors, home-services.");
            return self::INVALID;
        }

        $this->info('Starting unified location backfill...');
        $this->line('Mode   : ' . ($dryRun ? 'DRY RUN' : 'WRITE'));
        $this->line('Only   : ' . $only);
        $this->line('Chunk  : ' . $chunk);

        try {
            if ($dryRun) {
                DB::beginTransaction();
            }

            if (in_array($only, ['all', 'home-services'], true)) {
                $this->backfillHomeServiceAddresses($chunk);
                $this->backfillProviderBaseAddresses($chunk);
            }

            if (in_array($only, ['all', 'doctors'], true)) {
                $legacyClinicMap = $this->backfillDoctorHospitalClinics($chunk);
                $this->backfillDoctorPracticeSchedules($legacyClinicMap, $chunk);
                $this->backfillDirectDoctorAddresses($chunk);
                $this->backfillAppointments($legacyClinicMap, $chunk);
            }

            $this->renderSummary();

            if ($dryRun && DB::transactionLevel() > 0) {
                DB::rollBack();
                $this->warn('Dry run complete. All database changes were rolled back.');
            } else {
                $this->info('Backfill complete.');
            }

            return self::SUCCESS;
        } catch (Throwable $e) {
            if ($dryRun && DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            report($e);
            $this->error('Backfill failed: ' . $e->getMessage());

            return self::FAILURE;
        }
    }

    protected function backfillHomeServiceAddresses(int $chunk): void
    {
        $this->info('Backfilling legacy home service addresses...');

        HomeServiceAddress::query()
            ->with(['user', 'city'])
            ->orderBy('id')
            ->chunkById($chunk, function ($addresses): void {
                foreach ($addresses as $legacyAddress) {
                    $this->summary['home_service_addresses_processed']++;

                    if (!$legacyAddress->user) {
                        $this->warn("Skipping home_service_addresses.id={$legacyAddress->id}: missing user.");
                        continue;
                    }

                    $normalizedAddress = $this->normalizeAddressLines($legacyAddress->line1, $legacyAddress->line2);

                    $meta = [
                        'legacy_source' => 'home_service_addresses',
                        'legacy_id' => $legacyAddress->id,
                        'contact_name' => $legacyAddress->contact_name,
                        'contact_phone' => $legacyAddress->contact_phone,
                    ];

                    if ($normalizedAddress['was_truncated']) {
                        $meta['full_address'] = $normalizedAddress['full_address'];
                    }

                    $address = $this->syncAddress(
                        User::class,
                        (int) $legacyAddress->user_id,
                        [
                            'line1' => $normalizedAddress['line1'],
                            'line2' => $normalizedAddress['line2'],
                            'pincode' => $legacyAddress->pincode,
                        ],
                        [
                            'line1' => $normalizedAddress['line1'],
                            'line2' => $normalizedAddress['line2'],
                            'label' => $legacyAddress->label ?: 'Home',
                            'landmark' => $legacyAddress->landmark,
                            'city' => $legacyAddress->city?->name,
                            'city_id' => $legacyAddress->city_id,
                            'state' => $legacyAddress->city?->state,
                            'latitude' => $legacyAddress->latitude,
                            'longitude' => $legacyAddress->longitude,
                            'is_primary' => (bool) $legacyAddress->is_default,
                            'meta' => $meta,
                        ]
                    );

                    $bookings = HomeServiceBooking::query()
                        ->where('address_id', $legacyAddress->id)
                        ->get();

                    foreach ($bookings as $booking) {
                        $dirty = false;

                        if (!$booking->unified_address_id) {
                            $booking->unified_address_id = $address->id;
                            $dirty = true;
                        }

                        if (!$booking->service_address_snapshot) {
                            $booking->service_address_snapshot = $this->makeServiceAddressSnapshot($legacyAddress);
                            $dirty = true;
                        }

                        if ($dirty) {
                            $booking->save();
                            $this->summary['home_service_bookings_updated']++;
                        }
                    }
                }
            });
    }

    /**
     * @return array<int, int>
     */
    protected function backfillDoctorHospitalClinics(int $chunk): array
    {
        $this->info('Backfilling legacy doctor clinics into clinics + addresses + practice locations...');

        $legacyClinicMap = [];

        DoctorHospitalClinic::query()
            ->with(['city', 'doctorProfile.user'])
            ->orderBy('id')
            ->chunkById($chunk, function ($legacyClinics) use (&$legacyClinicMap): void {
                foreach ($legacyClinics as $legacyClinic) {
                    $this->summary['doctor_hospital_clinics_processed']++;

                    $clinic = $this->syncClinic($legacyClinic);
                    $normalizedAddress = $this->normalizeAddressLines($legacyClinic->address);

                    $meta = [
                        'legacy_source' => 'doctor_hospital_clinics',
                        'legacy_id' => $legacyClinic->id,
                    ];

                    if ($normalizedAddress['was_truncated']) {
                        $meta['full_address'] = $normalizedAddress['full_address'];
                    }

                    $address = $this->syncAddress(
                        Clinic::class,
                        (int) $clinic->id,
                        [
                            'line1' => $normalizedAddress['line1'],
                            'city_id' => $legacyClinic->city_id,
                        ],
                        [
                            'line1' => $normalizedAddress['line1'],
                            'line2' => $normalizedAddress['line2'],
                            'label' => 'Clinic Address',
                            'landmark' => $legacyClinic->landmarks,
                            'city' => $legacyClinic->city?->name,
                            'city_id' => $legacyClinic->city_id,
                            'state' => $legacyClinic->city?->state,
                            'pincode' => null,
                            'latitude' => $legacyClinic->latitude,
                            'longitude' => $legacyClinic->longitude,
                            'is_primary' => true,
                            'meta' => $meta,
                        ]
                    );

                    $practiceLocation = $this->syncPracticeLocation(
                        [
                            'doctor_profile_id' => $legacyClinic->doctor_profile_id,
                            'clinic_id' => $clinic->id,
                            'address_id' => $address->id,
                        ],
                        [
                            'display_name' => $legacyClinic->hospital_clinic_name,
                            'consultation_fee' => $legacyClinic->consultation_fee,
                            'contact_phone' => $legacyClinic->phone ?: $legacyClinic->doctorProfile?->user?->phone,
                            'contact_email' => $legacyClinic->email ?: $legacyClinic->doctorProfile?->user?->email,
                            'is_primary' => $this->shouldMarkPrimaryLocation((int) $legacyClinic->doctor_profile_id),
                            'is_active' => (bool) $legacyClinic->is_active,
                        ]
                    );

                    $legacyClinicMap[(int) $legacyClinic->id] = (int) $practiceLocation->id;
                }
            });

        return $legacyClinicMap;
    }

    /**
     * @param array<int, int> $legacyClinicMap
     */
    protected function backfillDoctorPracticeSchedules(array $legacyClinicMap, int $chunk): void
    {
        $this->info('Backfilling doctor schedule slots into practice schedules...');

        DoctorScheduleSlot::query()
            ->orderBy('id')
            ->chunkById($chunk, function ($slots) use ($legacyClinicMap): void {
                foreach ($slots as $slot) {
                    $this->summary['doctor_schedule_slots_processed']++;

                    $practiceLocationId = $legacyClinicMap[(int) $slot->doctor_hospital_clinic_id] ?? null;
                    if (!$practiceLocationId) {
                        continue;
                    }

                    $schedule = DoctorPracticeSchedule::query()->firstOrNew([
                        'doctor_practice_location_id' => $practiceLocationId,
                        'day_of_week' => $slot->day_of_week,
                    ]);

                    $isNew = !$schedule->exists;

                    $schedule->fill([
                        'opening_time' => $slot->opening_time,
                        'closing_time' => $slot->closing_time,
                        'break_start_time' => $slot->break_start_time,
                        'break_end_time' => $slot->break_end_time,
                        'slot_duration_minutes' => $slot->slot_duration_minutes ?: 30,
                        'max_appointments_per_slot' => $slot->max_appointments_per_slot ?: 1,
                        'is_available' => (bool) $slot->is_available,
                    ]);

                    if ($isNew || $schedule->isDirty()) {
                        $schedule->save();
                        $this->summary[$isNew ? 'practice_schedules_created' : 'practice_schedules_updated']++;
                    }
                }
            });
    }

    protected function backfillDirectDoctorAddresses(int $chunk): void
    {
        $this->info('Backfilling direct doctor addresses from doctor_cities for doctors without practice locations...');

        DB::table('doctor_cities')
            ->orderBy('id')
            ->chunkById($chunk, function ($rows): void {
                foreach ($rows as $row) {
                    $this->summary['doctor_city_rows_processed']++;

                    if (blank($row->address)) {
                        continue;
                    }

                    $doctor = DoctorProfile::query()
                        ->with(['user', 'practiceLocations'])
                        ->find($row->doctor_profile_id);

                    if (!$doctor || $doctor->practiceLocations->isNotEmpty()) {
                        continue;
                    }

                    $city = DB::table('cities')->where('id', $row->city_id)->first();
                    $normalizedAddress = $this->normalizeAddressLines($row->address);

                    $meta = [
                        'legacy_source' => 'doctor_cities',
                        'legacy_id' => $row->id,
                    ];

                    if ($normalizedAddress['was_truncated']) {
                        $meta['full_address'] = $normalizedAddress['full_address'];
                    }

                    $address = $this->syncAddress(
                        DoctorProfile::class,
                        (int) $row->doctor_profile_id,
                        [
                            'line1' => $normalizedAddress['line1'],
                            'city_id' => $row->city_id,
                        ],
                        [
                            'line1' => $normalizedAddress['line1'],
                            'line2' => $normalizedAddress['line2'],
                            'label' => 'Private Practice',
                            'landmark' => $row->landmarks,
                            'city' => $city->name ?? null,
                            'city_id' => $row->city_id,
                            'state' => $city->state ?? null,
                            'pincode' => null,
                            'latitude' => $row->latitude,
                            'longitude' => $row->longitude,
                            'is_primary' => true,
                            'meta' => $meta,
                        ]
                    );

                    $this->syncPracticeLocation(
                        [
                            'doctor_profile_id' => $row->doctor_profile_id,
                            'clinic_id' => null,
                            'address_id' => $address->id,
                        ],
                        [
                            'display_name' => 'Private Practice',
                            'consultation_fee' => $doctor->consultation_fee,
                            'contact_phone' => $doctor->user?->phone,
                            'contact_email' => $doctor->user?->email,
                            'is_primary' => true,
                            'is_active' => true,
                        ]
                    );
                }
            });
    }

    /**
     * @param array<int, int> $legacyClinicMap
     */
    protected function backfillAppointments(array $legacyClinicMap, int $chunk): void
    {
        $this->info('Backfilling appointments with practice location and snapshot data...');

        Appointment::query()
            ->with(['doctorHospitalClinic.city', 'doctorHospitalClinic.doctorProfile.user', 'doctorPracticeLocation.address', 'doctorPracticeLocation.clinic'])
            ->whereNotNull('doctor_hospital_clinic_id')
            ->orderBy('id')
            ->chunkById($chunk, function ($appointments) use ($legacyClinicMap): void {
                foreach ($appointments as $appointment) {
                    $practiceLocationId = $appointment->doctor_practice_location_id
                        ?: ($legacyClinicMap[(int) $appointment->doctor_hospital_clinic_id] ?? null);

                    if (!$practiceLocationId) {
                        continue;
                    }

                    $practiceLocation = $appointment->doctorPracticeLocation;
                    if (!$practiceLocation || (int) $practiceLocation->id !== (int) $practiceLocationId) {
                        $practiceLocation = DoctorPracticeLocation::query()
                            ->with(['address', 'clinic', 'doctorProfile.user'])
                            ->find($practiceLocationId);
                    }

                    if (!$practiceLocation) {
                        continue;
                    }

                    $dirty = false;

                    if (!$appointment->doctor_practice_location_id) {
                        $appointment->doctor_practice_location_id = $practiceLocation->id;
                        $dirty = true;
                    }

                    if (!$appointment->appointment_address_snapshot) {
                        $appointment->appointment_address_snapshot = $this->makeAppointmentAddressSnapshot($practiceLocation);
                        $dirty = true;
                    }

                    if (!$appointment->appointment_contact_phone) {
                        $appointment->appointment_contact_phone = $practiceLocation->resolved_contact_phone
                            ?: $appointment->doctorHospitalClinic?->phone
                            ?: $appointment->doctorHospitalClinic?->doctorProfile?->user?->phone;
                        $dirty = true;
                    }

                    if (!$appointment->appointment_contact_email) {
                        $appointment->appointment_contact_email = $practiceLocation->resolved_contact_email
                            ?: $appointment->doctorHospitalClinic?->email
                            ?: $appointment->doctorHospitalClinic?->doctorProfile?->user?->email;
                        $dirty = true;
                    }

                    if ($dirty) {
                        $appointment->save();
                        $this->summary['appointments_updated']++;
                    }
                }
            });
    }

    protected function backfillProviderBaseAddresses(int $chunk): void
    {
        $this->info('Backfilling provider base addresses when a unified user address already exists...');

        HomeServiceProvider::query()
            ->whereNull('base_address_id')
            ->orderBy('id')
            ->chunkById($chunk, function ($providers): void {
                foreach ($providers as $provider) {
                    $address = Address::query()
                        ->where('addressable_type', User::class)
                        ->where('addressable_id', $provider->user_id)
                        ->orderByDesc('is_primary')
                        ->orderBy('id')
                        ->first();

                    if (!$address) {
                        continue;
                    }

                    $provider->base_address_id = $address->id;
                    $provider->save();
                    $this->summary['provider_base_addresses_updated']++;
                }
            });
    }

    /**
     * @param array<string, mixed> $lookup
     * @param array<string, mixed> $values
     */
    protected function syncAddress(string $addressableType, int $addressableId, array $lookup, array $values): Address
    {
        $address = Address::query()->firstOrNew(array_merge([
            'addressable_type' => $addressableType,
            'addressable_id' => $addressableId,
        ], $lookup));

        $isNew = !$address->exists;
        $address->fill($values);

        if ($isNew || $address->isDirty()) {
            $address->save();
            $this->summary[$isNew ? 'addresses_created' : 'addresses_updated']++;
        }

        return $address;
    }

    protected function syncClinic(DoctorHospitalClinic $legacyClinic): Clinic
    {
        $clinic = Clinic::query()->firstOrNew([
            'name' => $legacyClinic->hospital_clinic_name,
            'phone' => $legacyClinic->phone,
            'email' => $legacyClinic->email,
        ]);

        $isNew = !$clinic->exists;

        $clinic->fill([
            'type' => 'clinic',
            'website' => $clinic->website,
            'is_active' => (bool) $legacyClinic->is_active,
        ]);

        if ($isNew || $clinic->isDirty()) {
            $clinic->save();
            $this->summary[$isNew ? 'clinics_created' : 'clinics_updated']++;
        }

        return $clinic;
    }

    /**
     * @param array<string, mixed> $lookup
     * @param array<string, mixed> $values
     */
    protected function syncPracticeLocation(array $lookup, array $values): DoctorPracticeLocation
    {
        $practiceLocation = DoctorPracticeLocation::query()->firstOrNew($lookup);
        $isNew = !$practiceLocation->exists;

        if (!$isNew && $practiceLocation->is_primary) {
            $values['is_primary'] = true;
        }

        $practiceLocation->fill($values);

        if ($isNew || $practiceLocation->isDirty()) {
            $practiceLocation->save();
            $this->summary[$isNew ? 'practice_locations_created' : 'practice_locations_updated']++;
        }

        return $practiceLocation;
    }

    protected function shouldMarkPrimaryLocation(int $doctorProfileId): bool
    {
        return !DoctorPracticeLocation::query()
            ->where('doctor_profile_id', $doctorProfileId)
            ->where('is_primary', true)
            ->exists();
    }

    /**
     * Normalize legacy address text into the new line1/line2 shape.
     *
     * @return array{line1: string, line2: ?string, full_address: string, was_truncated: bool}
     */
    protected function normalizeAddressLines(?string $line1, ?string $line2 = null): array
    {
        $rawLine1 = trim((string) $line1);
        $rawLine2 = $line2 !== null ? trim((string) $line2) : null;
        $fullAddress = trim(implode(', ', array_filter([$rawLine1, $rawLine2])));

        $normalizedLine1 = mb_substr($rawLine1, 0, 255);
        $overflow = trim(mb_substr($rawLine1, 255));

        $normalizedLine2 = trim(implode(' ', array_filter([$overflow, $rawLine2])));
        if ($normalizedLine2 === '') {
            $normalizedLine2 = null;
        }

        $wasTruncated = mb_strlen($rawLine1) > 255 || ($normalizedLine2 !== null && mb_strlen($normalizedLine2) > 255);

        if ($normalizedLine2 !== null) {
            $normalizedLine2 = mb_substr($normalizedLine2, 0, 255);
        }

        return [
            'line1' => $normalizedLine1,
            'line2' => $normalizedLine2,
            'full_address' => $fullAddress,
            'was_truncated' => $wasTruncated,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function makeServiceAddressSnapshot(HomeServiceAddress $legacyAddress): array
    {
        return [
            'label' => $legacyAddress->label,
            'contact_name' => $legacyAddress->contact_name,
            'contact_phone' => $legacyAddress->contact_phone,
            'line1' => $legacyAddress->line1,
            'line2' => $legacyAddress->line2,
            'landmark' => $legacyAddress->landmark,
            'city' => $legacyAddress->city?->name,
            'city_id' => $legacyAddress->city_id,
            'state' => $legacyAddress->city?->state,
            'pincode' => $legacyAddress->pincode,
            'latitude' => $legacyAddress->latitude,
            'longitude' => $legacyAddress->longitude,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function makeAppointmentAddressSnapshot(DoctorPracticeLocation $practiceLocation): array
    {
        return [
            'display_name' => $practiceLocation->display_name ?: $practiceLocation->clinic?->name,
            'clinic_name' => $practiceLocation->clinic?->name,
            'line1' => $practiceLocation->address?->line1,
            'line2' => $practiceLocation->address?->line2,
            'landmark' => $practiceLocation->address?->landmark,
            'city' => $practiceLocation->address?->city,
            'city_id' => $practiceLocation->address?->city_id,
            'state' => $practiceLocation->address?->state,
            'pincode' => $practiceLocation->address?->pincode,
            'latitude' => $practiceLocation->address?->latitude,
            'longitude' => $practiceLocation->address?->longitude,
        ];
    }

    protected function renderSummary(): void
    {
        $rows = [];

        foreach ($this->summary as $label => $count) {
            $rows[] = [$label, (string) $count];
        }

        $this->newLine();
        $this->table(['Metric', 'Count'], $rows);
    }
}
