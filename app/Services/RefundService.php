<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\HomeServiceBooking;
use Carbon\CarbonInterface;
use Razorpay\Api\Api as RazorpayApi;
use RuntimeException;

class RefundService
{
    private const REFUND_BEFORE_ONE_HOUR = 90;
    private const REFUND_WITHIN_ONE_HOUR = 80;

    public function forAppointment(Appointment $appointment): array
    {
        return $this->process(
            paymentMethod: (string) ($appointment->payment_method ?? Appointment::PAYMENT_METHOD_COD),
            paymentStatus: (string) ($appointment->payment_status ?? Appointment::PAYMENT_PENDING),
            scheduledAt: $appointment->getAppointmentDateTime(),
            paidAmount: (float) ($appointment->payment_amount ?? 0),
            razorpayPaymentId: $appointment->razorpay_payment_id,
            note: 'Appointment ' . $appointment->appointment_number
        );
    }

    public function forHomeServiceBooking(HomeServiceBooking $booking): array
    {
        $scheduledAt = $booking->service_date->copy()->setTimeFromTimeString($booking->service_time);

        return $this->process(
            paymentMethod: (string) ($booking->payment_method ?? HomeServiceBooking::PAYMENT_METHOD_COD),
            paymentStatus: (string) ($booking->payment_status ?? HomeServiceBooking::PAYMENT_PENDING),
            scheduledAt: $scheduledAt,
            paidAmount: (float) ($booking->total_amount ?? 0),
            razorpayPaymentId: $booking->razorpay_payment_id,
            note: 'Home service booking ' . $booking->booking_number
        );
    }

    private function process(
        string $paymentMethod,
        string $paymentStatus,
        CarbonInterface $scheduledAt,
        float $paidAmount,
        ?string $razorpayPaymentId,
        string $note
    ): array {
        if ($paymentMethod !== Appointment::PAYMENT_METHOD_ONLINE || $paymentStatus !== Appointment::PAYMENT_PAID || $paidAmount <= 0) {
            return [
                'eligible' => false,
                'refund_amount' => 0,
                'refund_percentage' => 0,
                'refund_id' => null,
                'message' => 'No refund is applicable for this cancellation.',
            ];
        }

        $minutesUntilVisit = now()->diffInMinutes($scheduledAt, false);
        $refundPercentage = $minutesUntilVisit >= 60
            ? self::REFUND_BEFORE_ONE_HOUR
            : self::REFUND_WITHIN_ONE_HOUR;

        $refundAmount = round(($paidAmount * $refundPercentage) / 100, 2);

        if ($refundAmount <= 0) {
            return [
                'eligible' => false,
                'refund_amount' => 0,
                'refund_percentage' => 0,
                'refund_id' => null,
                'message' => 'No refund is applicable for this cancellation.',
            ];
        }

        if (!$razorpayPaymentId) {
            throw new RuntimeException('Refund cannot be processed because the payment reference is missing.');
        }

        $keyId = config('services.razorpay.key_id');
        $keySecret = config('services.razorpay.key_secret');

        if (!$keyId || !$keySecret) {
            throw new RuntimeException('Refund cannot be processed because Razorpay is not configured.');
        }

        $api = new RazorpayApi($keyId, $keySecret);
        $payment = $api->payment->fetch($razorpayPaymentId);
        $refund = $payment->refund([
            'amount' => (int) round($refundAmount * 100),
            'speed' => 'normal',
            'notes' => [
                'reason' => 'Patient cancelled before visit',
                'reference' => $note,
                'refund_percentage' => (string) $refundPercentage,
            ],
        ]);

        return [
            'eligible' => true,
            'refund_amount' => $refundAmount,
            'refund_percentage' => $refundPercentage,
            'refund_id' => $refund['id'] ?? null,
            'message' => sprintf(
                'A %d%% refund of ₹%0.2f has been initiated to your original payment method.',
                $refundPercentage,
                $refundAmount
            ),
        ];
    }
}
