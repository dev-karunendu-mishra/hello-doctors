<?php

namespace App\Http\Controllers\Api\Guest;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorHospitalClinic;
use App\Models\HomeService;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Services\AppointmentNotificationService;
use App\Services\CaptchaVerificationService;
use App\Services\GuestAbuseMonitorService;
use App\Services\HomeServiceNotificationService;
use App\Services\RefundService;
use App\Services\SmsNotificationService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    private const VERIFY_CODE_TTL_MINUTES = 15;

    public function __construct(
        private readonly RefundService $refundService,
        private readonly AppointmentNotificationService $appointmentNotifications,
        private readonly HomeServiceNotificationService $homeServiceNotifications,
        private readonly SmsNotificationService $sms,
        private readonly CaptchaVerificationService $captchaService,
        private readonly GuestAbuseMonitorService $abuseMonitor,
    ) {
    }

    public function storeAppointment(Request $request): JsonResponse
    {
        $clientIp = $request->ip();
        $operation = 'booking_attempt';

        // Check abuse patterns before validation
        $abuseCheck = $this->abuseMonitor->shouldBlock($clientIp, $operation, [
            'email' => $request->input('guest_email'),
            'phone' => $request->input('guest_phone'),
            'booking_type' => 'appointment',
        ]);

        if ($abuseCheck['blocked']) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $request->input('guest_email'),
                'phone' => $request->input('guest_phone'),
                'booking_type' => 'appointment',
                'error' => 'abuse_detected',
            ], false);

            return response()->json([
                'message' => $abuseCheck['reason'] ?? 'Request blocked due to suspicious activity.',
            ], 429);
        }

        $validated = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required_without:guest_phone', 'nullable', 'email', 'max:255'],
            'guest_phone' => ['required_without:guest_email', 'nullable', 'string', 'max:20'],
            'doctor_hospital_clinic_id' => ['required', 'exists:doctor_hospital_clinics,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'consultation_type' => ['nullable', 'in:in-person,online,phone'],
            'reason_for_visit' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['nullable', 'in:cod'],
            'captcha_token' => ['required_if:' . (config('recaptcha.enabled') ? 'true' : 'false'), 'nullable', 'string'],
        ]);

        // Verify CAPTCHA if enabled
        if (config('recaptcha.enabled')) {
            $captchaResult = $this->captchaService->verify(
                $validated['captcha_token'] ?? '',
                'guest_appointment_booking'
            );

            if (!$captchaResult['success']) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'appointment',
                    'error' => 'captcha_failed',
                ], false);

                return response()->json([
                    'message' => 'CAPTCHA verification failed. Please try again.',
                    'error_details' => $captchaResult['error_codes'],
                ], 422);
            }
        }

        $clinic = DoctorHospitalClinic::with('doctorProfile.user')->findOrFail($validated['doctor_hospital_clinic_id']);

        if (!$clinic->is_active || !$clinic->doctorProfile || !$clinic->doctorProfile->is_verified || !$clinic->doctorProfile->user?->is_active) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $validated['guest_email'],
                'phone' => $validated['guest_phone'],
                'booking_type' => 'appointment',
                'error' => 'clinic_unavailable',
            ], false);

            return response()->json([
                'message' => 'Doctor clinic is not available for booking.',
            ], 422);
        }

        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $appointmentTime = Carbon::parse($validated['appointment_time'])->format('H:i:s');

        if (!$clinic->isSlotAvailable($appointmentDate, $appointmentTime)) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $validated['guest_email'],
                'phone' => $validated['guest_phone'],
                'booking_type' => 'appointment',
                'error' => 'slot_unavailable',
            ], false);

            return response()->json([
                'message' => 'Selected slot is no longer available.',
            ], 422);
        }

        $duplicateQuery = Appointment::query()
            ->where('is_guest', true)
            ->whereDate('appointment_date', $appointmentDate->toDateString())
            ->where('appointment_time', $appointmentTime)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED]);

        if (!empty($validated['guest_email'])) {
            $duplicateQuery->where('guest_email', $validated['guest_email']);
        }

        if (!empty($validated['guest_phone'])) {
            $duplicateQuery->where('guest_phone', $validated['guest_phone']);
        }

        if ($duplicateQuery->exists()) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $validated['guest_email'],
                'phone' => $validated['guest_phone'],
                'booking_type' => 'appointment',
                'error' => 'duplicate_booking',
            ], false);

            return response()->json([
                'message' => 'A guest booking already exists for this contact at the selected time.',
            ], 422);
        }

        $feeAmount = (float) ($clinic->consultation_fee ?? $clinic->doctorProfile?->consultation_fee ?? 0);
        $paymentMethod = $validated['payment_method'] ?? Appointment::PAYMENT_METHOD_COD;
        $paymentStatus = $feeAmount > 0 ? Appointment::PAYMENT_PENDING : Appointment::PAYMENT_PAID;

        try {
            $appointment = DB::transaction(function () use ($validated, $appointmentDate, $appointmentTime, $paymentMethod, $paymentStatus, $feeAmount) {
                return Appointment::create([
                    'patient_id' => null,
                    'is_guest' => true,
                    'guest_name' => $validated['guest_name'],
                    'guest_email' => $validated['guest_email'] ?? null,
                    'guest_phone' => $validated['guest_phone'] ?? null,
                    'doctor_hospital_clinic_id' => $validated['doctor_hospital_clinic_id'],
                    'appointment_date' => $appointmentDate->toDateString(),
                    'appointment_time' => $appointmentTime,
                    'consultation_type' => $validated['consultation_type'] ?? Appointment::CONSULTATION_IN_PERSON,
                    'reason_for_visit' => $validated['reason_for_visit'] ?? null,
                    'status' => Appointment::STATUS_PENDING,
                    'payment_status' => $paymentStatus,
                    'payment_method' => $paymentMethod,
                    'payment_amount' => $feeAmount,
                    'discount_amount' => 0,
                ]);
            });
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'appointment',
                    'error' => 'constraint_violation',
                ], false);

                return response()->json([
                    'message' => 'Selected slot is no longer available.',
                ], 422);
            }

            throw $e;
        }

        $this->abuseMonitor->logOperation($clientIp, $operation, [
            'email' => $validated['guest_email'],
            'phone' => $validated['guest_phone'],
            'booking_type' => 'appointment',
        ], true);

        $this->appointmentNotifications->sendBookingNotifications($appointment);

        return response()->json([
            'message' => 'Guest appointment booked successfully.',
            'data' => [
                'appointment_number' => $appointment->appointment_number,
                'status' => $appointment->status,
            ],
        ], 201);
    }

    public function storeHomeServiceBooking(Request $request): JsonResponse
    {
        $clientIp = $request->ip();
        $operation = 'booking_attempt';

        // Check abuse patterns before validation
        $abuseCheck = $this->abuseMonitor->shouldBlock($clientIp, $operation, [
            'email' => $request->input('guest_email'),
            'phone' => $request->input('guest_phone'),
            'booking_type' => 'home_service',
        ]);

        if ($abuseCheck['blocked']) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $request->input('guest_email'),
                'phone' => $request->input('guest_phone'),
                'booking_type' => 'home_service',
                'error' => 'abuse_detected',
            ], false);

            return response()->json([
                'message' => $abuseCheck['reason'] ?? 'Request blocked due to suspicious activity.',
            ], 429);
        }

        $validated = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required_without:guest_phone', 'nullable', 'email', 'max:255'],
            'guest_phone' => ['required_without:guest_email', 'nullable', 'string', 'max:20'],
            'home_service_id' => ['required', 'integer', 'exists:home_services,id'],
            'provider_id' => ['nullable', 'integer', 'exists:home_service_providers,id'],
            'service_date' => ['required', 'date', 'after_or_equal:today'],
            'service_time' => ['required', 'date_format:H:i'],
            'special_instructions' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['nullable', 'in:cod'],

            'guest_line1' => ['required', 'string', 'max:255'],
            'guest_line2' => ['nullable', 'string', 'max:255'],
            'guest_landmark' => ['nullable', 'string', 'max:255'],
            'guest_city_id' => ['required', 'integer', 'exists:cities,id'],
            'guest_pincode' => ['required', 'string', 'max:10'],
            'guest_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'guest_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'captcha_token' => ['required_if:' . (config('recaptcha.enabled') ? 'true' : 'false'), 'nullable', 'string'],
        ]);

        // Verify CAPTCHA if enabled
        if (config('recaptcha.enabled')) {
            $captchaResult = $this->captchaService->verify(
                $validated['captcha_token'] ?? '',
                'guest_home_service_booking'
            );

            if (!$captchaResult['success']) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'home_service',
                    'error' => 'captcha_failed',
                ], false);

                return response()->json([
                    'message' => 'CAPTCHA verification failed. Please try again.',
                    'error_details' => $captchaResult['error_codes'],
                ], 422);
            }
        }

        $service = HomeService::active()->findOrFail($validated['home_service_id']);

        $provider = null;
        if (!empty($validated['provider_id'])) {
            $provider = HomeServiceProvider::query()
                ->active()
                ->verified()
                ->where('id', $validated['provider_id'])
                ->where('city_id', $validated['guest_city_id'])
                ->first();

            if (!$provider || !$provider->supportsService($service->id)) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'home_service',
                    'error' => 'provider_unavailable',
                ], false);

                return response()->json(['message' => 'Selected provider is not available for this service.'], 422);
            }

            $slots = $provider->getAvailableSlotsForDate($validated['service_date'], $service->id, (int) $service->duration_minutes);
            $requested = Carbon::parse($validated['service_time'])->format('H:i');

            if (!collect($slots)->contains(fn($slot) => ($slot['time'] ?? null) === $requested)) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'home_service',
                    'error' => 'slot_unavailable',
                ], false);

                return response()->json(['message' => 'Selected slot is no longer available.'], 422);
            }
        }

        try {
            $booking = DB::transaction(function () use ($validated, $service, $provider) {
                $price = (float) $service->base_price;

                if ($provider) {
                    $customPrice = $provider->serviceLinks()
                        ->where('home_service_id', $service->id)
                        ->value('custom_price');

                    if ($customPrice !== null) {
                        $price = (float) $customPrice;
                    }
                }

                $totalAmount = (float) $price;
                $paymentMethod = $validated['payment_method'] ?? HomeServiceBooking::PAYMENT_METHOD_COD;
                $paymentStatus = $totalAmount > 0 ? HomeServiceBooking::PAYMENT_PENDING : HomeServiceBooking::PAYMENT_PAID;

                $booking = HomeServiceBooking::create([
                    'user_id' => null,
                    'is_guest' => true,
                    'guest_name' => $validated['guest_name'],
                    'guest_email' => $validated['guest_email'] ?? null,
                    'guest_phone' => $validated['guest_phone'] ?? null,
                    'home_service_id' => $service->id,
                    'provider_id' => $provider?->id,
                    'address_id' => null,
                    'guest_line1' => $validated['guest_line1'],
                    'guest_line2' => $validated['guest_line2'] ?? null,
                    'guest_landmark' => $validated['guest_landmark'] ?? null,
                    'guest_city_id' => $validated['guest_city_id'],
                    'guest_pincode' => $validated['guest_pincode'],
                    'guest_latitude' => $validated['guest_latitude'] ?? null,
                    'guest_longitude' => $validated['guest_longitude'] ?? null,
                    'service_date' => Carbon::parse($validated['service_date'])->toDateString(),
                    'service_time' => Carbon::parse($validated['service_time'])->format('H:i:s'),
                    'duration_minutes' => (int) $service->duration_minutes,
                    'price' => $price,
                    'travel_fee' => 0,
                    'discount_amount' => 0,
                    'total_amount' => $totalAmount,
                    'payment_status' => $paymentStatus,
                    'payment_method' => $paymentMethod,
                    'status' => $provider ? HomeServiceBooking::STATUS_ASSIGNED : HomeServiceBooking::STATUS_PENDING,
                    'special_instructions' => $validated['special_instructions'] ?? null,
                ]);

                $booking->statusLogs()->create([
                    'old_status' => null,
                    'new_status' => $booking->status,
                    'changed_by_user_id' => null,
                    'notes' => 'Guest booking created',
                ]);

                return $booking;
            });
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'booking_type' => 'home_service',
                    'error' => 'constraint_violation',
                ], false);

                return response()->json(['message' => 'Selected slot is no longer available.'], 422);
            }

            throw $e;
        }

        $this->abuseMonitor->logOperation($clientIp, $operation, [
            'email' => $validated['guest_email'],
            'phone' => $validated['guest_phone'],
            'booking_type' => 'home_service',
        ], true);

        $this->homeServiceNotifications->sendBookingNotifications($booking);

        return response()->json([
            'message' => 'Guest home service booking created successfully.',
            'data' => [
                'booking_number' => $booking->booking_number,
                'status' => $booking->status,
            ],
        ], 201);
    }

    public function initiateCancellation(Request $request): JsonResponse
    {
        $clientIp = $request->ip();
        $operation = 'cancellation_init';

        // Check abuse patterns before validation
        $abuseCheck = $this->abuseMonitor->shouldBlock($clientIp, $operation, [
            'email' => $request->input('guest_email'),
            'phone' => $request->input('guest_phone'),
        ]);

        if ($abuseCheck['blocked']) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $request->input('guest_email'),
                'phone' => $request->input('guest_phone'),
                'error' => 'abuse_detected',
            ], false);

            return response()->json([
                'message' => $abuseCheck['reason'] ?? 'Request blocked due to suspicious activity.',
            ], 429);
        }

        $validated = $request->validate([
            'type' => ['required', 'in:appointment,home_service'],
            'booking_number' => ['required', 'string', 'max:50'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:20'],
            'captcha_token' => ['required_if:' . (config('recaptcha.enabled') ? 'true' : 'false'), 'nullable', 'string'],
        ]);

        if (empty($validated['guest_email']) && empty($validated['guest_phone'])) {
            return response()->json([
                'message' => 'Provide guest_email or guest_phone to verify cancellation access.',
            ], 422);
        }

        // Verify CAPTCHA if enabled
        if (config('recaptcha.enabled')) {
            $captchaResult = $this->captchaService->verify(
                $validated['captcha_token'] ?? '',
                'guest_cancellation_init'
            );

            if (!$captchaResult['success']) {
                $this->abuseMonitor->logOperation($clientIp, $operation, [
                    'email' => $validated['guest_email'],
                    'phone' => $validated['guest_phone'],
                    'error' => 'captcha_failed',
                ], false);

                return response()->json([
                    'message' => 'CAPTCHA verification failed. Please try again.',
                    'error_details' => $captchaResult['error_codes'],
                ], 422);
            }
        }

        $booking = $this->resolveGuestBooking($validated['type'], $validated['booking_number']);

        // Generic response for privacy and anti-enumeration.
        if (!$booking || !$this->matchesGuestContact($booking, $validated['guest_email'] ?? null, $validated['guest_phone'] ?? null)) {
            $this->abuseMonitor->logOperation($clientIp, $operation, [
                'email' => $validated['guest_email'],
                'phone' => $validated['guest_phone'],
                'booking_type' => $validated['type'],
                'error' => 'booking_not_found_or_mismatch',
            ], false);

            return response()->json([
                'message' => 'If the booking exists, a verification code has been sent to the registered contact.',
            ]);
        }

        $code = (string) random_int(100000, 999999);

        $booking->update([
            'guest_access_token_hash' => hash('sha256', $code),
            'guest_token_expires_at' => now()->addMinutes(self::VERIFY_CODE_TTL_MINUTES),
            'guest_cancel_verified_at' => null,
        ]);

        if (!empty($booking->guest_email)) {
            Mail::raw(
                sprintf(
                    'Your cancellation verification code for booking %s is %s. It expires in %d minutes.',
                    $validated['booking_number'],
                    $code,
                    self::VERIFY_CODE_TTL_MINUTES,
                ),
                static function ($message) use ($booking) {
                    $message->to($booking->guest_email)
                        ->subject('Booking cancellation verification code');
                }
            );
        }

        if (!empty($booking->guest_phone)) {
            $this->sms->send(
                $booking->guest_phone,
                sprintf('Your cancellation code for %s is %s.', $validated['booking_number'], $code)
            );
        }

        $this->abuseMonitor->logOperation($clientIp, $operation, [
            'email' => $validated['guest_email'],
            'phone' => $validated['guest_phone'],
            'booking_type' => $validated['type'],
        ], true);

        return response()->json([
            'message' => 'If the booking exists, a verification code has been sent to the registered contact.',
            'debug_code' => config('app.debug') ? $code : null,
        ]);
    }

    public function verifyCancellation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:appointment,home_service'],
            'booking_number' => ['required', 'string', 'max:50'],
            'verification_code' => ['required', 'digits:6'],
        ]);

        $booking = $this->resolveGuestBooking($validated['type'], $validated['booking_number']);

        if (!$booking || empty($booking->guest_access_token_hash) || empty($booking->guest_token_expires_at)) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        if (now()->greaterThan($booking->guest_token_expires_at)) {
            return response()->json([
                'message' => 'Verification code has expired. Please request a new one.',
            ], 422);
        }

        if (!hash_equals((string) $booking->guest_access_token_hash, hash('sha256', $validated['verification_code']))) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        $cancelToken = Str::random(64);

        $booking->update([
            'guest_access_token_hash' => hash('sha256', $cancelToken),
            'guest_token_expires_at' => now()->addMinutes(self::VERIFY_CODE_TTL_MINUTES),
            'guest_cancel_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Verification successful. You can now cancel the booking.',
            'cancel_token' => $cancelToken,
            'expires_at' => $booking->guest_token_expires_at,
        ]);
    }

    public function cancelAppointment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'appointment_number' => ['required', 'string', 'max:50'],
            'cancel_token' => ['required', 'string', 'min:32'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $appointment = Appointment::query()
            ->where('appointment_number', $validated['appointment_number'])
            ->where('is_guest', true)
            ->first();

        if (!$appointment || !$this->hasValidCancelToken($appointment, $validated['cancel_token'])) {
            return response()->json([
                'message' => 'Invalid or expired cancellation token.',
            ], 422);
        }

        if (!$appointment->canBeCancelled()) {
            return response()->json([
                'message' => 'Appointment cannot be cancelled now.',
            ], 422);
        }

        try {
            $refund = $this->refundService->forAppointment($appointment);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Cancellation failed while processing the refund: ' . $e->getMessage(),
            ], 422);
        }

        $appointment->update([
            'status' => Appointment::STATUS_CANCELLED,
            'cancellation_reason' => $validated['reason'] ?? null,
            'cancelled_at' => now(),
            'payment_status' => ($refund['eligible'] ?? false) ? Appointment::PAYMENT_REFUNDED : $appointment->payment_status,
            'refund_amount' => $refund['refund_amount'] ?? 0,
            'refund_percentage' => $refund['refund_percentage'] ?? 0,
            'refunded_at' => ($refund['eligible'] ?? false) ? now() : null,
            'razorpay_refund_id' => $refund['refund_id'] ?? null,
            'guest_access_token_hash' => null,
            'guest_token_expires_at' => null,
            'guest_cancel_verified_at' => null,
        ]);

        $this->appointmentNotifications->sendCancellationNotifications(
            $appointment,
            $validated['reason'] ?? null,
            'guest'
        );

        $message = 'Appointment cancelled successfully.';
        if (($refund['eligible'] ?? false) && ($refund['refund_amount'] ?? 0) > 0) {
            $message .= ' ' . ($refund['message'] ?? 'Refund initiated successfully.');
        } elseif (($appointment->payment_method ?? null) === Appointment::PAYMENT_METHOD_COD) {
            $message .= ' No refund applies for pay-at-clinic bookings.';
        }

        return response()->json([
            'message' => $message,
            'data' => [
                'appointment_number' => $appointment->appointment_number,
                'status' => $appointment->status,
            ],
        ]);
    }

    public function cancelHomeServiceBooking(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_number' => ['required', 'string', 'max:50'],
            'cancel_token' => ['required', 'string', 'min:32'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = HomeServiceBooking::query()
            ->where('booking_number', $validated['booking_number'])
            ->where('is_guest', true)
            ->first();

        if (!$booking || !$this->hasValidCancelToken($booking, $validated['cancel_token'])) {
            return response()->json([
                'message' => 'Invalid or expired cancellation token.',
            ], 422);
        }

        if (!$booking->canBeCancelled()) {
            return response()->json([
                'message' => 'Booking cannot be cancelled now.',
            ], 422);
        }

        try {
            $refund = $this->refundService->forHomeServiceBooking($booking);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Cancellation failed while processing the refund: ' . $e->getMessage(),
            ], 422);
        }

        $oldStatus = $booking->status;

        $booking->update([
            'status' => HomeServiceBooking::STATUS_CANCELLED,
            'cancel_reason' => $validated['reason'] ?? null,
            'cancelled_at' => now(),
            'payment_status' => ($refund['eligible'] ?? false) ? HomeServiceBooking::PAYMENT_REFUNDED : $booking->payment_status,
            'refund_amount' => $refund['refund_amount'] ?? 0,
            'refund_percentage' => $refund['refund_percentage'] ?? 0,
            'refunded_at' => ($refund['eligible'] ?? false) ? now() : null,
            'razorpay_refund_id' => $refund['refund_id'] ?? null,
            'guest_access_token_hash' => null,
            'guest_token_expires_at' => null,
            'guest_cancel_verified_at' => null,
        ]);

        $booking->statusLogs()->create([
            'old_status' => $oldStatus,
            'new_status' => HomeServiceBooking::STATUS_CANCELLED,
            'changed_by_user_id' => null,
            'notes' => $validated['reason'] ?? 'Cancelled by guest',
        ]);

        $message = 'Booking cancelled successfully.';
        if (($refund['eligible'] ?? false) && ($refund['refund_amount'] ?? 0) > 0) {
            $message .= ' ' . ($refund['message'] ?? 'Refund initiated successfully.');
        } elseif (($booking->payment_method ?? null) === HomeServiceBooking::PAYMENT_METHOD_COD) {
            $message .= ' No refund applies for pay-on-visit bookings.';
        }

        return response()->json([
            'message' => $message,
            'data' => [
                'booking_number' => $booking->booking_number,
                'status' => $booking->status,
            ],
        ]);
    }

    private function resolveGuestBooking(string $type, string $bookingNumber): Appointment|HomeServiceBooking|null
    {
        if ($type === 'appointment') {
            return Appointment::query()
                ->where('appointment_number', $bookingNumber)
                ->where('is_guest', true)
                ->first();
        }

        return HomeServiceBooking::query()
            ->where('booking_number', $bookingNumber)
            ->where('is_guest', true)
            ->first();
    }

    private function matchesGuestContact(Appointment|HomeServiceBooking $booking, ?string $email, ?string $phone): bool
    {
        if ($email !== null && strcasecmp((string) ($booking->guest_email ?? ''), $email) !== 0) {
            return false;
        }

        if ($phone !== null && (string) ($booking->guest_phone ?? '') !== (string) $phone) {
            return false;
        }

        return true;
    }

    private function hasValidCancelToken(Appointment|HomeServiceBooking $booking, string $cancelToken): bool
    {
        if (empty($booking->guest_access_token_hash) || empty($booking->guest_token_expires_at) || empty($booking->guest_cancel_verified_at)) {
            return false;
        }

        if (now()->greaterThan($booking->guest_token_expires_at)) {
            return false;
        }

        return hash_equals((string) $booking->guest_access_token_hash, hash('sha256', $cancelToken));
    }
}
