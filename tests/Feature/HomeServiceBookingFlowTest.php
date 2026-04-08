<?php

use App\Models\City;
use App\Models\HomeService;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceCategory;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Models\HomeServiceProviderAvailability;
use App\Notifications\HomeServiceBookedNotification;
use Carbon\Carbon;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

function createHomeServiceSetup(string $date): array
{
    $city = City::create([
        'name' => 'Lucknow',
        'slug' => 'lucknow',
        'state' => 'Uttar Pradesh',
        'is_active' => true,
    ]);

    $category = HomeServiceCategory::create([
        'name' => 'Nursing',
        'slug' => 'nursing',
        'description' => 'At home care',
        'is_active' => true,
    ]);

    $service = HomeService::create([
        'category_id' => $category->id,
        'code' => 'NURSE-VISIT',
        'name' => 'Nurse Visit',
        'description' => 'Qualified nurse visit at home',
        'duration_minutes' => 60,
        'base_price' => 1200,
        'price_type' => HomeService::PRICE_FIXED,
        'buffer_minutes' => 0,
        'requires_certification' => false,
        'is_active' => true,
    ]);

    $patient = User::factory()->create([
        'role' => 'patient',
        'is_active' => true,
        'phone' => '9999900100',
    ]);

    $providerUser = User::factory()->create([
        'role' => 'home_service_provider',
        'is_active' => true,
        'phone' => '9999900101',
    ]);

    $provider = HomeServiceProvider::create([
        'user_id' => $providerUser->id,
        'provider_type' => 'nurse',
        'license_number' => 'LIC-001',
        'experience_years' => 4,
        'city_id' => $city->id,
        'service_radius_km' => 15,
        'is_verified' => true,
        'is_active' => true,
    ]);

    $provider->serviceLinks()->create([
        'home_service_id' => $service->id,
        'custom_price' => 1500,
        'is_active' => true,
    ]);

    HomeServiceProviderAvailability::create([
        'provider_id' => $provider->id,
        'day_of_week' => Carbon::parse($date)->dayOfWeek,
        'opening_time' => '09:00:00',
        'closing_time' => '13:00:00',
        'slot_duration_minutes' => 30,
        'max_bookings_per_slot' => 1,
        'is_available' => true,
    ]);

    $address = HomeServiceAddress::create([
        'user_id' => $patient->id,
        'label' => 'Home',
        'contact_name' => $patient->name,
        'contact_phone' => $patient->phone,
        'line1' => 'Sector 10',
        'city_id' => $city->id,
        'pincode' => '226001',
        'is_default' => true,
    ]);

    return [$patient, $providerUser, $provider, $service, $address];
}

test('patient can book home service and booking notifications are sent', function () {
    Notification::fake();

    $date = now()->addDays(2)->toDateString();
    [$patient, $providerUser, $provider, $service, $address] = createHomeServiceSetup($date);

    $response = $this->actingAs($patient)->postJson('/api/patient/home-service-bookings', [
        'home_service_id' => $service->id,
        'address_id' => $address->id,
        'provider_id' => $provider->id,
        'service_date' => $date,
        'service_time' => '09:00',
        'special_instructions' => 'Please bring dressing supplies',
        'payment_method' => 'cod',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('home_service_bookings', [
        'user_id' => $patient->id,
        'home_service_id' => $service->id,
        'provider_id' => $provider->id,
        'service_date' => $date,
        'service_time' => '09:00:00',
        'status' => HomeServiceBooking::STATUS_ASSIGNED,
    ]);

    Notification::assertSentTo($patient, HomeServiceBookedNotification::class);
    Notification::assertSentTo($providerUser, HomeServiceBookedNotification::class);
});

test('online home service booking sends confirmation notifications', function () {
    Notification::fake();

    config(['services.razorpay.key_secret' => 'test_secret']);

    $date = now()->addDays(3)->toDateString();
    [$patient, $providerUser, $provider, $service, $address] = createHomeServiceSetup($date);

    $orderId = 'order_test_home_service';
    $paymentId = 'pay_test_home_service';
    $signature = hash_hmac('sha256', $orderId . '|' . $paymentId, 'test_secret');

    $response = $this->actingAs($patient)->postJson('/patient/data/payment/verify', [
        'type' => 'home_service',
        'payment_method' => 'online',
        'razorpay_order_id' => $orderId,
        'razorpay_payment_id' => $paymentId,
        'razorpay_signature' => $signature,
        'home_service_id' => $service->id,
        'address_id' => $address->id,
        'provider_id' => $provider->id,
        'service_date' => $date,
        'service_time' => '09:30',
        'special_instructions' => 'Ring the bell on arrival',
    ]);

    $response->assertCreated();

    Notification::assertSentTo($patient, HomeServiceBookedNotification::class);
    Notification::assertSentTo($providerUser, HomeServiceBookedNotification::class);
});

test('provider can mark a confirmed home service booking as completed directly', function () {
    $date = now()->addDays(2)->toDateString();
    [$patient, $providerUser, $provider, $service, $address] = createHomeServiceSetup($date);

    $booking = HomeServiceBooking::create([
        'user_id' => $patient->id,
        'home_service_id' => $service->id,
        'provider_id' => $provider->id,
        'address_id' => $address->id,
        'service_date' => $date,
        'service_time' => '09:00:00',
        'duration_minutes' => 60,
        'price' => 1500,
        'travel_fee' => 0,
        'discount_amount' => 0,
        'total_amount' => 1500,
        'payment_status' => HomeServiceBooking::PAYMENT_PENDING,
        'payment_method' => HomeServiceBooking::PAYMENT_METHOD_COD,
        'status' => HomeServiceBooking::STATUS_CONFIRMED,
    ]);

    $response = $this->actingAs($providerUser)->postJson("/provider/data/home-service/bookings/{$booking->id}/status", [
        'status' => HomeServiceBooking::STATUS_COMPLETED,
        'payment_status' => HomeServiceBooking::PAYMENT_PAID,
        'payment_method' => HomeServiceBooking::PAYMENT_METHOD_COD,
        'notes' => 'Visit completed successfully.',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.status', HomeServiceBooking::STATUS_COMPLETED)
        ->assertJsonPath('data.payment_status', HomeServiceBooking::PAYMENT_PAID);

    $this->assertDatabaseHas('home_service_bookings', [
        'id' => $booking->id,
        'status' => HomeServiceBooking::STATUS_COMPLETED,
        'payment_status' => HomeServiceBooking::PAYMENT_PAID,
    ]);
});

test('provider completion auto-marks cod payment as paid when cash is confirmed collected', function () {
    $date = now()->addDays(2)->toDateString();
    [$patient, $providerUser, $provider, $service, $address] = createHomeServiceSetup($date);

    $booking = HomeServiceBooking::create([
        'user_id' => $patient->id,
        'home_service_id' => $service->id,
        'provider_id' => $provider->id,
        'address_id' => $address->id,
        'service_date' => $date,
        'service_time' => '10:00:00',
        'duration_minutes' => 60,
        'price' => 1500,
        'travel_fee' => 0,
        'discount_amount' => 0,
        'total_amount' => 1500,
        'payment_status' => HomeServiceBooking::PAYMENT_PENDING,
        'payment_method' => HomeServiceBooking::PAYMENT_METHOD_COD,
        'status' => HomeServiceBooking::STATUS_IN_PROGRESS,
    ]);

    $response = $this->actingAs($providerUser)->postJson("/provider/data/home-service/bookings/{$booking->id}/status", [
        'status' => HomeServiceBooking::STATUS_COMPLETED,
        'payment_method' => HomeServiceBooking::PAYMENT_METHOD_COD,
        'cash_collected' => true,
        'notes' => 'Cash received from patient.',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.status', HomeServiceBooking::STATUS_COMPLETED)
        ->assertJsonPath('data.payment_status', HomeServiceBooking::PAYMENT_PAID);

    $this->assertDatabaseHas('home_service_bookings', [
        'id' => $booking->id,
        'status' => HomeServiceBooking::STATUS_COMPLETED,
        'payment_status' => HomeServiceBooking::PAYMENT_PAID,
        'payment_method' => HomeServiceBooking::PAYMENT_METHOD_COD,
    ]);
});
