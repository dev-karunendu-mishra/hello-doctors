<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Appointment;
use App\Models\DoctorHospitalClinic;
use App\Models\DoctorPracticeLocation;
use App\Models\HomeService;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Models\User;
use App\Services\AppointmentNotificationService;
use App\Services\HomeServiceNotificationService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Razorpay\Api\Api as RazorpayApi;

class PaymentController extends Controller
{
    private const ONLINE_DISCOUNT_PERCENT = 10.0;

    public function __construct(
        private readonly AppointmentNotificationService $appointmentNotifications,
        private readonly HomeServiceNotificationService $homeServiceNotifications,
    ) {
    }

    /**
     * Create a Razorpay order for an appointment or home service booking.
     * For COD / pay-at-visit, it returns skip_payment=true with pricing details.
     */
    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:appointment,home_service'],
            'payment_method' => ['required', 'in:online,cod'],
            // appointment
            'doctor_hospital_clinic_id' => ['exclude_unless:type,appointment', 'nullable', 'integer', 'exists:doctor_hospital_clinics,id', 'required_without:doctor_practice_location_id'],
            'doctor_practice_location_id' => ['exclude_unless:type,appointment', 'nullable', 'integer', 'exists:doctor_practice_locations,id', 'required_without:doctor_hospital_clinic_id'],
            'appointment_date' => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type' => ['exclude_unless:type,appointment', 'nullable', 'in:in-person,online,phone'],
            // home service
            'home_service_id' => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id' => ['exclude_unless:type,home_service', 'nullable', 'integer', 'required_without:unified_address_id'],
            'unified_address_id' => ['exclude_unless:type,home_service', 'nullable', 'integer', 'exists:addresses,id', 'required_without:address_id'],
            'service_date' => ['required_if:type,home_service', 'nullable', 'date', 'after_or_equal:today'],
            'service_time' => ['required_if:type,home_service', 'nullable', 'date_format:H:i'],
            'provider_id' => ['nullable', 'exists:home_service_providers,id'],
        ]);

        $baseAmount = $validated['type'] === 'appointment'
            ? $this->determineAppointmentBaseAmount($validated)
            : $this->determineHomeServiceBaseAmount($validated);

        $discountAmount = $this->calculateOnlineDiscount($baseAmount, $validated['payment_method']);
        $payableAmount = max($baseAmount - $discountAmount, 0);

        if ($validated['payment_method'] !== Appointment::PAYMENT_METHOD_ONLINE || $payableAmount <= 0) {
            return response()->json([
                'skip_payment' => true,
                'payment_method' => $validated['payment_method'],
                'pricing' => [
                    'base_amount' => round($baseAmount, 2),
                    'discount_amount' => round($discountAmount, 2),
                    'payable_amount' => round($payableAmount, 2),
                    'discount_percent' => $validated['payment_method'] === Appointment::PAYMENT_METHOD_ONLINE ? self::ONLINE_DISCOUNT_PERCENT : 0,
                ],
            ]);
        }

        $keyId = config('services.razorpay.key_id');
        $keySecret = config('services.razorpay.key_secret');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'message' => 'Online payment is not configured yet. Please choose pay on visit for now.',
            ], 422);
        }

        $api = new RazorpayApi($keyId, $keySecret);
        $order = $api->order->create([
            'amount' => (int) round($payableAmount * 100),
            'currency' => 'INR',
            'payment_capture' => 1,
        ]);

        return response()->json([
            'skip_payment' => false,
            'payment_method' => $validated['payment_method'],
            'order_id' => $order['id'],
            'amount' => (int) round($payableAmount * 100),
            'currency' => 'INR',
            'key_id' => $keyId,
            'pricing' => [
                'base_amount' => round($baseAmount, 2),
                'discount_amount' => round($discountAmount, 2),
                'payable_amount' => round($payableAmount, 2),
                'discount_percent' => self::ONLINE_DISCOUNT_PERCENT,
            ],
        ]);
    }

    /**
     * Verify the Razorpay signature and create the appointment or home service booking.
     */
    public function verifyAndBook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:appointment,home_service'],
            'payment_method' => ['required', 'in:online'],
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
            // appointment
            'doctor_hospital_clinic_id' => ['exclude_unless:type,appointment', 'nullable', 'integer', 'exists:doctor_hospital_clinics,id', 'required_without:doctor_practice_location_id'],
            'doctor_practice_location_id' => ['exclude_unless:type,appointment', 'nullable', 'integer', 'exists:doctor_practice_locations,id', 'required_without:doctor_hospital_clinic_id'],
            'appointment_date' => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type' => ['exclude_unless:type,appointment', 'nullable', 'in:in-person,online,phone'],
            'reason_for_visit' => ['exclude_unless:type,appointment', 'nullable', 'string', 'max:1000'],
            // home service
            'home_service_id' => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id' => ['exclude_unless:type,home_service', 'nullable', 'integer', 'required_without:unified_address_id'],
            'unified_address_id' => ['exclude_unless:type,home_service', 'nullable', 'integer', 'exists:addresses,id', 'required_without:address_id'],
            'service_date' => ['required_if:type,home_service', 'nullable', 'date', 'after_or_equal:today'],
            'service_time' => ['required_if:type,home_service', 'nullable', 'date_format:H:i'],
            'provider_id' => ['exclude_unless:type,home_service', 'nullable', 'exists:home_service_providers,id'],
            'special_instructions' => ['exclude_unless:type,home_service', 'nullable', 'string', 'max:1000'],
        ]);

        $expectedSignature = hash_hmac(
            'sha256',
            $validated['razorpay_order_id'] . '|' . $validated['razorpay_payment_id'],
            config('services.razorpay.key_secret')
        );

        if (!hash_equals($expectedSignature, $validated['razorpay_signature'])) {
            return response()->json([
                'message' => 'Payment verification failed. Please contact support if amount was deducted.',
            ], 422);
        }

        if ($validated['type'] === 'appointment') {
            return $this->createAppointmentAfterPayment($validated);
        }

        return $this->createHomeServiceAfterPayment($validated);
    }

    private function determineAppointmentBaseAmount(array $validated): float
    {
        [$practiceLocation, $clinic, $legacyClinicId] = $this->resolveAppointmentBookingTarget($validated);

        if (!$legacyClinicId) {
            abort(response()->json([
                'message' => 'Selected practice location is not yet available for direct online booking in the current transition flow.',
            ], 422));
        }

        $doctorProfile = $practiceLocation?->doctorProfile ?: $clinic?->doctorProfile;

        if ((!$practiceLocation && !$clinic)
            || !($practiceLocation?->is_active ?? true)
            || !($clinic?->is_active ?? true)
            || !$doctorProfile?->is_verified
            || !$doctorProfile?->user?->is_active) {
            abort(response()->json(['message' => 'Doctor clinic is not available for booking.'], 422));
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        if (!$this->isAppointmentSlotAvailable($practiceLocation, $clinic, $legacyClinicId, $appointmentDate, $appointmentTime)) {
            abort(response()->json(['message' => 'Selected slot is no longer available.'], 422));
        }

        return (float) ($practiceLocation?->resolved_consultation_fee
            ?? $clinic?->consultation_fee
            ?? $doctorProfile?->consultation_fee
            ?? 0);
    }

    private function determineHomeServiceBaseAmount(array $validated): float
    {
        $service = HomeService::active()->findOrFail($validated['home_service_id']);
        [$address, $unifiedAddress] = $this->resolveServiceAddress($validated, (int) Auth::id());

        if (!$address && !$unifiedAddress) {
            abort(response()->json(['message' => 'Selected address is not available for this service.'], 422));
        }

        $addressCityId = $unifiedAddress?->city_id ?: $address?->city_id;
        $provider = null;

        if (!empty($validated['provider_id'])) {
            $provider = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->where('id', $validated['provider_id'])
                ->where('city_id', $addressCityId)
                ->first();

            if (!$provider || !$provider->supportsService($service->id)) {
                abort(response()->json(['message' => 'Selected provider is not available for this service.'], 422));
            }

            $slots = $provider->getAvailableSlotsForDate($validated['service_date'], $service->id, (int) $service->duration_minutes);
            $requested = Carbon::parse($validated['service_time'])->format('H:i');

            if (!collect($slots)->contains(fn($slot) => ($slot['time'] ?? null) === $requested)) {
                abort(response()->json(['message' => 'Selected slot is no longer available.'], 422));
            }
        }

        $price = (float) $service->base_price;
        if ($provider) {
            $customPrice = $provider->serviceLinks()
                ->where('home_service_id', $service->id)
                ->value('custom_price');

            if ($customPrice !== null) {
                $price = (float) $customPrice;
            }
        }

        return $price;
    }

    private function calculateOnlineDiscount(float $baseAmount, string $paymentMethod): float
    {
        if ($paymentMethod !== Appointment::PAYMENT_METHOD_ONLINE || $baseAmount <= 0) {
            return 0.0;
        }

        return round(($baseAmount * self::ONLINE_DISCOUNT_PERCENT) / 100, 2);
    }

    private function createAppointmentAfterPayment(array $validated): JsonResponse
    {
        [$practiceLocation, $clinic, $legacyClinicId] = $this->resolveAppointmentBookingTarget($validated);

        if (!$legacyClinicId || !$clinic) {
            return response()->json([
                'message' => 'Selected practice location is not yet available for direct online booking in the current transition flow.',
            ], 422);
        }

        $doctorProfile = $practiceLocation?->doctorProfile ?: $clinic->doctorProfile;

        if ((!$practiceLocation && !$clinic)
            || !($practiceLocation?->is_active ?? true)
            || !$clinic->is_active
            || !$doctorProfile?->is_verified
            || !$doctorProfile?->user?->is_active) {
            return response()->json(['message' => 'Doctor clinic is not available.'], 422);
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        if (!$this->isAppointmentSlotAvailable($practiceLocation, $clinic, $legacyClinicId, $appointmentDate, $appointmentTime)) {
            return response()->json(['message' => 'Selected slot is no longer available.'], 422);
        }

        $alreadyBooked = Appointment::query()
            ->where('patient_id', Auth::id())
            ->whereDate('appointment_date', $appointmentDate->toDateString())
            ->where('appointment_time', $appointmentTime)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->exists();

        if ($alreadyBooked) {
            return response()->json(['message' => 'You already have an appointment at this time.'], 422);
        }

        $baseAmount = (float) ($practiceLocation?->resolved_consultation_fee
            ?? $clinic->consultation_fee
            ?? $doctorProfile?->consultation_fee
            ?? 0);
        $discountAmount = $this->calculateOnlineDiscount($baseAmount, $validated['payment_method']);
        $payableAmount = max($baseAmount - $discountAmount, 0);

        try {
            $appointment = DB::transaction(function () use ($validated, $practiceLocation, $clinic, $legacyClinicId, $appointmentDate, $appointmentTime, $payableAmount, $discountAmount) {
                return Appointment::create([
                    'patient_id' => Auth::id(),
                    'doctor_hospital_clinic_id' => $legacyClinicId,
                    'doctor_practice_location_id' => $practiceLocation?->id,
                    'appointment_address_snapshot' => $this->makeAppointmentAddressSnapshot($practiceLocation, $clinic),
                    'appointment_contact_phone' => $practiceLocation?->resolved_contact_phone ?: $clinic->phone ?: $clinic->doctorProfile?->user?->phone,
                    'appointment_contact_email' => $practiceLocation?->resolved_contact_email ?: $clinic->email ?: $clinic->doctorProfile?->user?->email,
                    'appointment_date' => $appointmentDate->toDateString(),
                    'appointment_time' => $appointmentTime,
                    'consultation_type' => $validated['consultation_type'] ?? Appointment::CONSULTATION_IN_PERSON,
                    'reason_for_visit' => $validated['reason_for_visit'] ?? null,
                    'status' => Appointment::STATUS_PENDING,
                    'payment_status' => Appointment::PAYMENT_PAID,
                    'payment_method' => Appointment::PAYMENT_METHOD_ONLINE,
                    'payment_amount' => $payableAmount,
                    'discount_amount' => $discountAmount,
                    'razorpay_order_id' => $validated['razorpay_order_id'],
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                ]);
            });
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'Selected slot is no longer available.'], 422);
            }

            throw $e;
        }

        $this->appointmentNotifications->sendBookingNotifications($appointment);

        return response()->json([
            'message' => 'Appointment booked with online payment successfully.',
            'data' => $appointment->load([
                'doctorHospitalClinic.city',
                'doctorHospitalClinic.doctorProfile.user',
                'doctorPracticeLocation.address.cityRecord',
                'doctorPracticeLocation.clinic',
                'doctorPracticeLocation.doctorProfile.user',
                'doctorPracticeLocation.doctorProfile.specialty',
            ])->ensureDisplayRelations(),
        ], 201);
    }

    private function createHomeServiceAfterPayment(array $validated): JsonResponse
    {
        $service = HomeService::active()->findOrFail($validated['home_service_id']);
        [$address, $unifiedAddress] = $this->resolveServiceAddress($validated, (int) Auth::id(), true);

        if (!$address && !$unifiedAddress) {
            return response()->json(['message' => 'Selected address is not available for this service.'], 422);
        }

        $addressCityId = $unifiedAddress?->city_id ?: $address?->city_id;
        $provider = null;

        if (!empty($validated['provider_id'])) {
            $provider = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->where('id', $validated['provider_id'])
                ->where('city_id', $addressCityId)
                ->first();

            if (!$provider || !$provider->supportsService($service->id)) {
                return response()->json(['message' => 'Selected provider is not available for this service.'], 422);
            }

            $slots = $provider->getAvailableSlotsForDate($validated['service_date'], $service->id, (int) $service->duration_minutes);
            $requested = Carbon::parse($validated['service_time'])->format('H:i');

            if (!collect($slots)->contains(fn($slot) => ($slot['time'] ?? null) === $requested)) {
                return response()->json(['message' => 'Selected slot is no longer available.'], 422);
            }
        }

        $price = (float) $service->base_price;
        if ($provider) {
            $customPrice = $provider->serviceLinks()
                ->where('home_service_id', $service->id)
                ->value('custom_price');

            if ($customPrice !== null) {
                $price = (float) $customPrice;
            }
        }

        $discountAmount = $this->calculateOnlineDiscount($price, $validated['payment_method']);
        $payableAmount = max($price - $discountAmount, 0);

        try {
            $booking = DB::transaction(function () use ($validated, $service, $provider, $address, $unifiedAddress, $price, $discountAmount, $payableAmount) {
                $booking = HomeServiceBooking::create([
                    'user_id' => Auth::id(),
                    'home_service_id' => $service->id,
                    'provider_id' => $provider?->id,
                    'address_id' => $address?->id,
                    'unified_address_id' => $unifiedAddress?->id,
                    'service_address_snapshot' => $this->makeServiceAddressSnapshot($address, $unifiedAddress),
                    'service_date' => Carbon::parse($validated['service_date'])->toDateString(),
                    'service_time' => Carbon::parse($validated['service_time'])->format('H:i:s'),
                    'duration_minutes' => (int) $service->duration_minutes,
                    'price' => $price,
                    'travel_fee' => 0,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $payableAmount,
                    'payment_status' => HomeServiceBooking::PAYMENT_PAID,
                    'payment_method' => HomeServiceBooking::PAYMENT_METHOD_ONLINE,
                    'razorpay_order_id' => $validated['razorpay_order_id'],
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                    'status' => $provider ? HomeServiceBooking::STATUS_ASSIGNED : HomeServiceBooking::STATUS_PENDING,
                    'special_instructions' => $validated['special_instructions'] ?? null,
                ]);

                $booking->statusLogs()->create([
                    'old_status' => null,
                    'new_status' => $booking->status,
                    'changed_by_user_id' => Auth::id(),
                    'notes' => 'Booking created with online payment',
                ]);

                return $booking;
            });
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'Selected slot is no longer available.'], 422);
            }

            throw $e;
        }

        $this->homeServiceNotifications->sendBookingNotifications($booking);

        return response()->json([
            'message' => 'Home service booked with online payment successfully.',
            'data' => $booking->load([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name,state',
                'unifiedAddress.cityRecord:id,name,state',
            ]),
        ], 201);
    }

    private function resolveAppointmentBookingTarget(array $validated): array
    {
        $practiceLocation = !empty($validated['doctor_practice_location_id'])
            ? DoctorPracticeLocation::query()
                ->with(['address.cityRecord', 'clinic', 'doctorProfile.user', 'schedules'])
                ->findOrFail($validated['doctor_practice_location_id'])
            : null;

        $legacyClinicId = !empty($validated['doctor_hospital_clinic_id'])
            ? (int) $validated['doctor_hospital_clinic_id']
            : $this->resolveLegacyClinicIdFromPracticeLocation($practiceLocation);

        $clinic = $legacyClinicId
            ? DoctorHospitalClinic::query()->with(['city', 'doctorProfile.user'])->find($legacyClinicId)
            : null;

        if (!$practiceLocation && $legacyClinicId) {
            $practiceLocation = $this->resolvePracticeLocationFromLegacyClinicId($legacyClinicId);
        }

        return [$practiceLocation, $clinic, $legacyClinicId];
    }

    private function resolvePracticeLocationFromLegacyClinicId(int $legacyClinicId): ?DoctorPracticeLocation
    {
        return DoctorPracticeLocation::query()
            ->with(['address.cityRecord', 'clinic', 'doctorProfile.user', 'schedules'])
            ->whereHas('address', function ($query) use ($legacyClinicId) {
                $query->where('meta->legacy_source', 'doctor_hospital_clinics')
                    ->where('meta->legacy_id', $legacyClinicId);
            })
            ->first();
    }

    private function resolveLegacyClinicIdFromPracticeLocation(?DoctorPracticeLocation $practiceLocation): ?int
    {
        if (!$practiceLocation) {
            return null;
        }

        $meta = $practiceLocation->address?->meta ?? [];

        if (($meta['legacy_source'] ?? null) === 'doctor_hospital_clinics' && !empty($meta['legacy_id'])) {
            return (int) $meta['legacy_id'];
        }

        return null;
    }

    private function isAppointmentSlotAvailable(?DoctorPracticeLocation $practiceLocation, ?DoctorHospitalClinic $clinic, ?int $legacyClinicId, Carbon $date, string $appointmentTime): bool
    {
        if ($practiceLocation) {
            $schedule = $practiceLocation->schedules
                ->where('is_available', true)
                ->firstWhere('day_of_week', $date->dayOfWeek);

            if ($schedule && $schedule->opening_time && $schedule->closing_time) {
                $slotTime = Carbon::parse($appointmentTime);
                $opening = Carbon::parse($schedule->opening_time);
                $closing = Carbon::parse($schedule->closing_time);

                if ($slotTime->lt($opening) || $slotTime->gte($closing)) {
                    return false;
                }

                if ($schedule->break_start_time && $schedule->break_end_time) {
                    $breakStart = Carbon::parse($schedule->break_start_time);
                    $breakEnd = Carbon::parse($schedule->break_end_time);

                    if ($slotTime->betweenIncluded($breakStart, $breakEnd->copy()->subMinute())) {
                        return false;
                    }
                }

                $slotEnd = (clone $slotTime)->addMinutes(max((int) $schedule->slot_duration_minutes, 5));
                if ($slotEnd->gt($closing)) {
                    return false;
                }

                $bookingCount = Appointment::query()
                    ->whereDate('appointment_date', $date->toDateString())
                    ->where('appointment_time', $slotTime->format('H:i:s'))
                    ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
                    ->where(function ($query) use ($practiceLocation, $legacyClinicId) {
                        $query->where('doctor_practice_location_id', $practiceLocation->id);

                        if ($legacyClinicId) {
                            $query->orWhere('doctor_hospital_clinic_id', $legacyClinicId);
                        }
                    })
                    ->count();

                return $bookingCount < (int) $schedule->max_appointments_per_slot;
            }
        }

        return $clinic ? $clinic->isSlotAvailable($date, $appointmentTime) : false;
    }

    private function makeAppointmentAddressSnapshot(?DoctorPracticeLocation $practiceLocation, ?DoctorHospitalClinic $clinic = null): array
    {
        if ($practiceLocation?->address) {
            return [
                'display_name' => $practiceLocation->display_name ?: $practiceLocation->clinic?->name,
                'clinic_name' => $practiceLocation->clinic?->name,
                'line1' => $practiceLocation->address->line1,
                'line2' => $practiceLocation->address->line2,
                'landmark' => $practiceLocation->address->landmark,
                'city' => $practiceLocation->address->city ?: $practiceLocation->address->cityRecord?->name,
                'city_id' => $practiceLocation->address->city_id,
                'state' => $practiceLocation->address->state,
                'pincode' => $practiceLocation->address->pincode,
                'latitude' => $practiceLocation->address->latitude,
                'longitude' => $practiceLocation->address->longitude,
            ];
        }

        if ($clinic) {
            return [
                'display_name' => $clinic->hospital_clinic_name,
                'clinic_name' => $clinic->hospital_clinic_name,
                'line1' => $clinic->address,
                'line2' => null,
                'landmark' => $clinic->landmarks,
                'city' => $clinic->city?->name,
                'city_id' => $clinic->city_id,
                'state' => $clinic->city?->state,
                'pincode' => null,
                'latitude' => $clinic->latitude,
                'longitude' => $clinic->longitude,
            ];
        }

        return [];
    }

    private function resolveServiceAddress(array $validated, int $userId, bool $createLegacyIfNeeded = false): array
    {
        $legacyAddress = null;
        $unifiedAddress = null;

        if (!empty($validated['address_id'])) {
            $legacyAddress = HomeServiceAddress::query()
                ->with('city:id,name,state')
                ->where('user_id', $userId)
                ->find($validated['address_id']);

            if (!$legacyAddress) {
                $unifiedAddress = Address::query()
                    ->with('cityRecord:id,name,state')
                    ->where('addressable_type', User::class)
                    ->where('addressable_id', $userId)
                    ->find($validated['address_id']);
            }
        }

        if (!empty($validated['unified_address_id'])) {
            $unifiedAddress = Address::query()
                ->with('cityRecord:id,name,state')
                ->where('addressable_type', User::class)
                ->where('addressable_id', $userId)
                ->find($validated['unified_address_id']);
        }

        if ($legacyAddress && !$unifiedAddress) {
            $unifiedAddress = Address::query()
                ->with('cityRecord:id,name,state')
                ->where('addressable_type', User::class)
                ->where('addressable_id', $userId)
                ->where('meta->legacy_source', 'home_service_addresses')
                ->where('meta->legacy_id', $legacyAddress->id)
                ->first();
        }

        if (!$legacyAddress && $unifiedAddress) {
            $legacyAddress = $this->resolveLegacyAddressFromUnified($unifiedAddress, $userId);

            if (!$legacyAddress && $createLegacyIfNeeded) {
                $legacyAddress = $this->ensureLegacyAddressForUnified($unifiedAddress, $userId);
            }
        }

        if ($legacyAddress && $unifiedAddress) {
            $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];
            $legacyId = (int) ($meta['legacy_id'] ?? 0);

            if ($legacyId > 0 && $legacyId !== (int) $legacyAddress->id) {
                abort(response()->json(['message' => 'Selected address identifiers do not match.'], 422));
            }
        }

        return [$legacyAddress, $unifiedAddress];
    }

    private function resolveLegacyAddressFromUnified(Address $unifiedAddress, int $userId): ?HomeServiceAddress
    {
        $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];
        $legacyId = $meta['legacy_id'] ?? null;

        if (!$legacyId) {
            return null;
        }

        return HomeServiceAddress::query()
            ->with('city:id,name,state')
            ->where('user_id', $userId)
            ->find((int) $legacyId);
    }

    private function ensureLegacyAddressForUnified(Address $unifiedAddress, int $userId): HomeServiceAddress
    {
        $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];

        $legacyAddress = HomeServiceAddress::query()
            ->with('city:id,name,state')
            ->where('user_id', $userId)
            ->where('city_id', $unifiedAddress->city_id)
            ->where('line1', $unifiedAddress->line1)
            ->where('line2', $unifiedAddress->line2)
            ->where('pincode', $unifiedAddress->pincode)
            ->first();

        if (!$legacyAddress) {
            $legacyAddress = HomeServiceAddress::create([
                'user_id' => $userId,
                'label' => $unifiedAddress->label ?: 'Home',
                'contact_name' => $meta['contact_name'] ?? Auth::user()?->name,
                'contact_phone' => $meta['contact_phone'] ?? Auth::user()?->phone,
                'line1' => $unifiedAddress->line1,
                'line2' => $unifiedAddress->line2,
                'landmark' => $unifiedAddress->landmark,
                'city_id' => $unifiedAddress->city_id,
                'pincode' => $unifiedAddress->pincode,
                'latitude' => $unifiedAddress->latitude,
                'longitude' => $unifiedAddress->longitude,
                'is_default' => (bool) $unifiedAddress->is_primary,
            ]);
        }

        $unifiedAddress->update([
            'meta' => array_merge($meta, [
                'legacy_source' => 'home_service_addresses',
                'legacy_id' => $legacyAddress->id,
                'contact_name' => $meta['contact_name'] ?? $legacyAddress->contact_name,
                'contact_phone' => $meta['contact_phone'] ?? $legacyAddress->contact_phone,
            ]),
        ]);

        return $legacyAddress->fresh('city:id,name,state');
    }

    private function makeServiceAddressSnapshot(?HomeServiceAddress $legacyAddress, ?Address $unifiedAddress): array
    {
        $meta = is_array($unifiedAddress?->meta) ? $unifiedAddress?->meta : [];

        return array_filter([
            'legacy_address_id' => $legacyAddress?->id ?? ($meta['legacy_id'] ?? null),
            'unified_address_id' => $unifiedAddress?->id,
            'label' => $legacyAddress?->label ?? $unifiedAddress?->label,
            'contact_name' => $legacyAddress?->contact_name ?? ($meta['contact_name'] ?? Auth::user()?->name),
            'contact_phone' => $legacyAddress?->contact_phone ?? ($meta['contact_phone'] ?? Auth::user()?->phone),
            'line1' => $unifiedAddress?->line1 ?? $legacyAddress?->line1,
            'line2' => $unifiedAddress?->line2 ?? $legacyAddress?->line2,
            'landmark' => $unifiedAddress?->landmark ?? $legacyAddress?->landmark,
            'city_id' => $unifiedAddress?->city_id ?? $legacyAddress?->city_id,
            'city' => $unifiedAddress?->cityRecord?->name ?? $legacyAddress?->city?->name ?? $unifiedAddress?->city,
            'state' => $unifiedAddress?->cityRecord?->state ?? $legacyAddress?->city?->state ?? $unifiedAddress?->state,
            'pincode' => $unifiedAddress?->pincode ?? $legacyAddress?->pincode,
            'latitude' => $unifiedAddress?->latitude ?? $legacyAddress?->latitude,
            'longitude' => $unifiedAddress?->longitude ?? $legacyAddress?->longitude,
        ], fn($value) => $value !== null && $value !== '');
    }
}
