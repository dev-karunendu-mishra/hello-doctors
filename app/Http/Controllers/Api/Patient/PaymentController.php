<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorHospitalClinic;
use App\Models\HomeService;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Services\AppointmentNotificationService;
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
        private readonly AppointmentNotificationService $appointmentNotifications
    ) {}

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
            'doctor_hospital_clinic_id' => ['required_if:type,appointment', 'nullable', 'exists:doctor_hospital_clinics,id'],
            'appointment_date' => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type' => ['nullable', 'in:in-person,online,phone'],
            // home service
            'home_service_id' => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id' => ['required_if:type,home_service', 'nullable', 'exists:home_service_addresses,id'],
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
            'doctor_hospital_clinic_id' => ['required_if:type,appointment', 'nullable', 'exists:doctor_hospital_clinics,id'],
            'appointment_date' => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type' => ['nullable', 'in:in-person,online,phone'],
            'reason_for_visit' => ['nullable', 'string', 'max:1000'],
            // home service
            'home_service_id' => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id' => ['required_if:type,home_service', 'nullable', 'exists:home_service_addresses,id'],
            'service_date' => ['required_if:type,home_service', 'nullable', 'date', 'after_or_equal:today'],
            'service_time' => ['required_if:type,home_service', 'nullable', 'date_format:H:i'],
            'provider_id' => ['nullable', 'exists:home_service_providers,id'],
            'special_instructions' => ['nullable', 'string', 'max:1000'],
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
        $clinic = DoctorHospitalClinic::with('doctorProfile.user')->findOrFail($validated['doctor_hospital_clinic_id']);

        if (!$clinic->is_active || !$clinic->doctorProfile?->is_verified || !$clinic->doctorProfile?->user?->is_active) {
            abort(response()->json(['message' => 'Doctor clinic is not available for booking.'], 422));
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        if (!$clinic->isSlotAvailable($appointmentDate, $appointmentTime)) {
            abort(response()->json(['message' => 'Selected slot is no longer available.'], 422));
        }

        return (float) ($clinic->consultation_fee ?? $clinic->doctorProfile?->consultation_fee ?? 0);
    }

    private function determineHomeServiceBaseAmount(array $validated): float
    {
        $service = HomeService::active()->findOrFail($validated['home_service_id']);

        $address = HomeServiceAddress::query()
            ->where('user_id', Auth::id())
            ->findOrFail($validated['address_id']);

        $provider = null;
        if (!empty($validated['provider_id'])) {
            $provider = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->where('id', $validated['provider_id'])
                ->where('city_id', $address->city_id)
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
        $clinic = DoctorHospitalClinic::with('doctorProfile.user')
            ->findOrFail($validated['doctor_hospital_clinic_id']);

        if (!$clinic->is_active || !$clinic->doctorProfile?->is_verified || !$clinic->doctorProfile?->user?->is_active) {
            return response()->json(['message' => 'Doctor clinic is not available.'], 422);
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        if (!$clinic->isSlotAvailable($appointmentDate, $appointmentTime)) {
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

        $baseAmount = (float) ($clinic->consultation_fee ?? $clinic->doctorProfile?->consultation_fee ?? 0);
        $discountAmount = $this->calculateOnlineDiscount($baseAmount, $validated['payment_method']);
        $payableAmount = max($baseAmount - $discountAmount, 0);

        try {
            $appointment = DB::transaction(function () use ($validated, $appointmentDate, $appointmentTime, $payableAmount, $discountAmount) {
                return Appointment::create([
                    'patient_id' => Auth::id(),
                    'doctor_hospital_clinic_id' => $validated['doctor_hospital_clinic_id'],
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
            ]),
        ], 201);
    }

    private function createHomeServiceAfterPayment(array $validated): JsonResponse
    {
        $service = HomeService::active()->findOrFail($validated['home_service_id']);

        $address = HomeServiceAddress::query()
            ->where('user_id', Auth::id())
            ->findOrFail($validated['address_id']);

        $provider = null;
        if (!empty($validated['provider_id'])) {
            $provider = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->where('id', $validated['provider_id'])
                ->where('city_id', $address->city_id)
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
            $booking = DB::transaction(function () use ($validated, $service, $provider, $address, $price, $discountAmount, $payableAmount) {
                $booking = HomeServiceBooking::create([
                    'user_id' => Auth::id(),
                    'home_service_id' => $service->id,
                    'provider_id' => $provider?->id,
                    'address_id' => $address->id,
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

        return response()->json([
            'message' => 'Home service booked with online payment successfully.',
            'data' => $booking->load([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name',
            ]),
        ], 201);
    }
}
