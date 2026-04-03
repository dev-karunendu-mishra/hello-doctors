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
    public function __construct(
        private readonly AppointmentNotificationService $appointmentNotifications
    ) {}

    /**
     * Create a Razorpay order for an appointment or home service booking.
     * Returns the order details needed to open the Razorpay checkout popup.
     */
    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'                      => ['required', 'in:appointment,home_service'],
            // appointment
            'doctor_hospital_clinic_id' => ['required_if:type,appointment', 'nullable', 'exists:doctor_hospital_clinics,id'],
            'appointment_date'          => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time'          => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type'         => ['nullable', 'in:in-person,online,phone'],
            // home service
            'home_service_id'           => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id'                => ['required_if:type,home_service', 'nullable', 'exists:home_service_addresses,id'],
            'service_date'              => ['required_if:type,home_service', 'nullable', 'date', 'after_or_equal:today'],
            'service_time'              => ['required_if:type,home_service', 'nullable', 'date_format:H:i'],
            'provider_id'               => ['nullable', 'exists:home_service_providers,id'],
        ]);

        if ($validated['type'] === 'appointment') {
            $clinic = DoctorHospitalClinic::with('doctorProfile')
                ->findOrFail($validated['doctor_hospital_clinic_id']);

            if (!$clinic->is_active || !$clinic->doctorProfile?->is_verified) {
                return response()->json(['message' => 'Doctor clinic is not available for booking.'], 422);
            }

            $amountPaise = $this->determineAppointmentAmountPaise($clinic);
        } else {
            $service = HomeService::active()->findOrFail($validated['home_service_id']);

            $address = HomeServiceAddress::query()
                ->where('user_id', Auth::id())
                ->findOrFail($validated['address_id']);

            $price = $service->base_price;
            if (!empty($validated['provider_id'])) {
                $provider = HomeServiceProvider::find($validated['provider_id']);
                if ($provider) {
                    $customPrice = $provider->serviceLinks()
                        ->where('home_service_id', $service->id)
                        ->value('custom_price');
                    if ($customPrice !== null) {
                        $price = $customPrice;
                    }
                }
            }

            $amountPaise = (int) round((float) $price * 100);
        }

        // Free bookings skip payment and go direct
        if ($amountPaise === 0) {
            return response()->json(['skip_payment' => true, 'amount' => 0]);
        }

        $keyId     = config('services.razorpay.key_id');
        $keySecret = config('services.razorpay.key_secret');

        $api   = new RazorpayApi($keyId, $keySecret);
        $order = $api->order->create([
            'amount'          => $amountPaise,
            'currency'        => 'INR',
            'payment_capture' => 1,
        ]);

        return response()->json([
            'skip_payment' => false,
            'order_id'     => $order['id'],
            'amount'       => $amountPaise,
            'currency'     => 'INR',
            'key_id'       => $keyId,
        ]);
    }

    /**
     * Verify the Razorpay signature and create the appointment or home service booking.
     */
    public function verifyAndBook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'                      => ['required', 'in:appointment,home_service'],
            'razorpay_order_id'         => ['required', 'string'],
            'razorpay_payment_id'       => ['required', 'string'],
            'razorpay_signature'        => ['required', 'string'],
            // appointment
            'doctor_hospital_clinic_id' => ['required_if:type,appointment', 'nullable', 'exists:doctor_hospital_clinics,id'],
            'appointment_date'          => ['required_if:type,appointment', 'nullable', 'date', 'after_or_equal:today'],
            'appointment_time'          => ['required_if:type,appointment', 'nullable', 'date_format:H:i'],
            'consultation_type'         => ['nullable', 'in:in-person,online,phone'],
            'reason_for_visit'          => ['nullable', 'string', 'max:1000'],
            // home service
            'home_service_id'           => ['required_if:type,home_service', 'nullable', 'exists:home_services,id'],
            'address_id'                => ['required_if:type,home_service', 'nullable', 'exists:home_service_addresses,id'],
            'service_date'              => ['required_if:type,home_service', 'nullable', 'date', 'after_or_equal:today'],
            'service_time'              => ['required_if:type,home_service', 'nullable', 'date_format:H:i'],
            'provider_id'               => ['nullable', 'exists:home_service_providers,id'],
            'special_instructions'      => ['nullable', 'string', 'max:1000'],
        ]);

        // Verify Razorpay HMAC signature
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

    // -------------------------------------------------------------------------

    private function determineAppointmentAmountPaise(DoctorHospitalClinic $clinic): int
    {
        $fee = $clinic->consultation_fee ?? $clinic->doctorProfile?->consultation_fee ?? 0;
        return (int) round((float) $fee * 100);
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

        $feeAmount = $clinic->consultation_fee ?? $clinic->doctorProfile?->consultation_fee ?? 0;

        try {
            $appointment = DB::transaction(function () use ($validated, $appointmentDate, $appointmentTime, $feeAmount) {
                return Appointment::create([
                    'patient_id'               => Auth::id(),
                    'doctor_hospital_clinic_id'=> $validated['doctor_hospital_clinic_id'],
                    'appointment_date'         => $appointmentDate->toDateString(),
                    'appointment_time'         => $appointmentTime,
                    'consultation_type'        => $validated['consultation_type'] ?? Appointment::CONSULTATION_IN_PERSON,
                    'reason_for_visit'         => $validated['reason_for_visit'] ?? null,
                    'status'                   => Appointment::STATUS_PENDING,
                    'payment_status'           => 'paid',
                    'payment_amount'           => $feeAmount,
                    'razorpay_order_id'        => $validated['razorpay_order_id'],
                    'razorpay_payment_id'      => $validated['razorpay_payment_id'],
                    'razorpay_signature'       => $validated['razorpay_signature'],
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
            'message' => 'Appointment booked and payment verified successfully.',
            'data'    => $appointment->load([
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
        }

        $price = $service->base_price;
        if ($provider) {
            $customPrice = $provider->serviceLinks()
                ->where('home_service_id', $service->id)
                ->value('custom_price');
            if ($customPrice !== null) {
                $price = $customPrice;
            }
        }

        try {
            $booking = DB::transaction(function () use ($validated, $service, $provider, $address, $price) {
                $booking = HomeServiceBooking::create([
                    'user_id'              => Auth::id(),
                    'home_service_id'      => $service->id,
                    'provider_id'          => $provider?->id,
                    'address_id'           => $address->id,
                    'service_date'         => Carbon::parse($validated['service_date'])->toDateString(),
                    'service_time'         => Carbon::parse($validated['service_time'])->format('H:i:s'),
                    'duration_minutes'     => (int) $service->duration_minutes,
                    'price'                => $price,
                    'travel_fee'           => 0,
                    'discount_amount'      => 0,
                    'total_amount'         => $price,
                    'payment_status'       => HomeServiceBooking::PAYMENT_PAID,
                    'razorpay_order_id'    => $validated['razorpay_order_id'],
                    'razorpay_payment_id'  => $validated['razorpay_payment_id'],
                    'razorpay_signature'   => $validated['razorpay_signature'],
                    'status'               => $provider ? HomeServiceBooking::STATUS_ASSIGNED : HomeServiceBooking::STATUS_PENDING,
                    'special_instructions' => $validated['special_instructions'] ?? null,
                ]);

                $booking->statusLogs()->create([
                    'old_status'         => null,
                    'new_status'         => $booking->status,
                    'changed_by_user_id' => Auth::id(),
                    'notes'              => 'Booking created with Razorpay payment',
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
            'message' => 'Home service booked and payment verified successfully.',
            'data'    => $booking->load([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name',
            ]),
        ], 201);
    }
}
