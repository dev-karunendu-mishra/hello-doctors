<?php

use App\Models\Appointment;
use App\Models\City;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorProfile;
use App\Models\DoctorScheduleSlot;
use App\Models\Specialty;
use App\Models\User;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Notifications\AppointmentCompletedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;

function createDoctorClinicWithSchedule(string $date): array
{
    $city = City::create([
        'name' => 'Noida',
        'slug' => 'noida',
        'state' => 'Uttar Pradesh',
        'is_active' => true,
    ]);

    $specialty = Specialty::create([
        'name' => 'Cardiology',
        'slug' => 'cardiology',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $doctorUser = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'phone' => '9999900001',
    ]);

    $doctorProfile = DoctorProfile::create([
        'user_id' => $doctorUser->id,
        'specialization_id' => $specialty->id,
        'consultation_fee' => 700,
        'is_verified' => true,
        'is_available_online' => true,
    ]);

    $clinic = DoctorHospitalClinic::create([
        'doctor_profile_id' => $doctorProfile->id,
        'hospital_clinic_name' => 'City Care',
        'address' => 'Sector 18, Noida',
        'city_id' => $city->id,
        'consultation_fee' => 500,
        'phone' => '9999900002',
        'email' => 'citycare@example.com',
        'is_active' => true,
    ]);

    DoctorScheduleSlot::create([
        'doctor_hospital_clinic_id' => $clinic->id,
        'day_of_week' => Carbon::parse($date)->dayOfWeek,
        'opening_time' => '09:00:00',
        'closing_time' => '13:00:00',
        'break_start_time' => '11:00:00',
        'break_end_time' => '11:30:00',
        'slot_duration_minutes' => 30,
        'max_appointments_per_slot' => 1,
        'is_available' => true,
    ]);

    return [$doctorUser, $doctorProfile, $clinic];
}

test('patient can book appointment and booking notifications are sent', function () {
    Notification::fake();

    $date = now()->addDays(2)->toDateString();
    [$doctorUser, $doctorProfile, $clinic] = createDoctorClinicWithSchedule($date);

    $patient = User::factory()->create([
        'role' => 'patient',
        'is_active' => true,
        'phone' => '9999900003',
    ]);

    $response = $this->actingAs($patient)->postJson('/api/patient/appointments', [
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '09:00',
        'consultation_type' => 'in-person',
        'reason_for_visit' => 'Chest pain',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('appointments', [
        'patient_id' => $patient->id,
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => Carbon::parse($date)->startOfDay()->toDateTimeString(),
        'appointment_time' => '09:00:00',
        'status' => Appointment::STATUS_PENDING,
    ]);

    Notification::assertSentTo($patient, AppointmentBookedNotification::class);
    Notification::assertSentTo($doctorUser, AppointmentBookedNotification::class);
});

test('patient cannot book same time slot when already booked by same patient', function () {
    $date = now()->addDays(2)->toDateString();
    [$doctorUser, $doctorProfile, $clinic] = createDoctorClinicWithSchedule($date);

    $clinic->scheduleSlots()->update(['max_appointments_per_slot' => 2]);

    $patient = User::factory()->create([
        'role' => 'patient',
        'is_active' => true,
    ]);

    Appointment::create([
        'patient_id' => $patient->id,
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '09:00:00',
        'status' => Appointment::STATUS_PENDING,
        'consultation_type' => Appointment::CONSULTATION_IN_PERSON,
    ]);

    $response = $this->actingAs($patient)->postJson('/api/patient/appointments', [
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '09:00',
        'consultation_type' => 'in-person',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'You already have an appointment at this time.');
});

test('patient can cancel own upcoming appointment and cancellation notifications are sent', function () {
    Notification::fake();

    $date = now()->addDays(3)->toDateString();
    [$doctorUser, $doctorProfile, $clinic] = createDoctorClinicWithSchedule($date);

    $patient = User::factory()->create([
        'role' => 'patient',
        'is_active' => true,
        'phone' => '9999900005',
    ]);

    $appointment = Appointment::create([
        'patient_id' => $patient->id,
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '10:00:00',
        'status' => Appointment::STATUS_CONFIRMED,
        'consultation_type' => Appointment::CONSULTATION_IN_PERSON,
    ]);

    $response = $this->actingAs($patient)->postJson("/api/patient/appointments/{$appointment->id}/cancel", [
        'reason' => 'Travel plan changed',
    ]);

    $response->assertOk();

    $this->assertDatabaseHas('appointments', [
        'id' => $appointment->id,
        'status' => Appointment::STATUS_CANCELLED,
        'cancellation_reason' => 'Travel plan changed',
    ]);

    Notification::assertSentTo($patient, AppointmentCancelledNotification::class);
    Notification::assertSentTo($doctorUser, AppointmentCancelledNotification::class);
});

test('patient cannot cancel someone else appointment', function () {
    $date = now()->addDays(3)->toDateString();
    [$doctorUser, $doctorProfile, $clinic] = createDoctorClinicWithSchedule($date);

    $owner = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $otherPatient = User::factory()->create(['role' => 'patient', 'is_active' => true]);

    $appointment = Appointment::create([
        'patient_id' => $owner->id,
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '10:30:00',
        'status' => Appointment::STATUS_PENDING,
        'consultation_type' => Appointment::CONSULTATION_IN_PERSON,
    ]);

    $this->actingAs($otherPatient)
        ->postJson("/api/patient/appointments/{$appointment->id}/cancel", ['reason' => 'Not mine'])
        ->assertForbidden();
});

test('doctor can mark appointment completed and completion notifications are sent', function () {
    Notification::fake();

    $date = now()->addDays(4)->toDateString();
    [$doctorUser, $doctorProfile, $clinic] = createDoctorClinicWithSchedule($date);

    $patient = User::factory()->create([
        'role' => 'patient',
        'is_active' => true,
        'phone' => '9999900011',
    ]);

    $appointment = Appointment::create([
        'patient_id' => $patient->id,
        'doctor_hospital_clinic_id' => $clinic->id,
        'appointment_date' => $date,
        'appointment_time' => '09:30:00',
        'status' => Appointment::STATUS_CONFIRMED,
        'consultation_type' => Appointment::CONSULTATION_IN_PERSON,
    ]);

    $response = $this->actingAs($doctorUser)->putJson("/api/doctor/appointments/{$appointment->id}", [
        'status' => 'completed',
        'notes' => 'Consultation finished',
    ]);

    $response->assertOk();

    $this->assertDatabaseHas('appointments', [
        'id' => $appointment->id,
        'status' => Appointment::STATUS_COMPLETED,
    ]);

    Notification::assertSentTo($patient, AppointmentCompletedNotification::class);
    Notification::assertSentTo($doctorUser, AppointmentCompletedNotification::class);
});

test('patient and doctor appointment pages render for authorized users', function () {
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

    DoctorProfile::create([
        'user_id' => $doctor->id,
        'is_verified' => true,
    ]);

    $this->actingAs($patient)
        ->get('/patient/find-doctors')
        ->assertOk();

    $this->actingAs($patient)
        ->get('/patient/appointments')
        ->assertOk();

    $this->actingAs($doctor)
        ->get('/doctor/appointments')
        ->assertOk();

    $this->actingAs($doctor)
        ->get('/doctor/schedule')
        ->assertOk();
});
