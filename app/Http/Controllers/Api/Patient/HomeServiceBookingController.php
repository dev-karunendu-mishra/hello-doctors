<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\HomeService;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\HomeServiceNotificationService;
use App\Services\RefundService;

class HomeServiceBookingController extends Controller
{
    public function __construct(
        private readonly RefundService $refundService,
        private readonly HomeServiceNotificationService $homeServiceNotifications,
    ) {
    }
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:pending,assigned,confirmed,in_progress,completed,cancelled,no_show,upcoming,past'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = HomeServiceBooking::query()
            ->with(['service:id,name', 'provider.user:id,name', 'address.city:id,name'])
            ->where('user_id', Auth::id())
            ->orderByDesc('service_date')
            ->orderByDesc('service_time');

        if ($request->filled('status')) {
            $status = $request->string('status')->value();

            if ($status === 'upcoming') {
                $query->upcoming();
            } elseif ($status === 'past') {
                $query->whereDate('service_date', '<', today());
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('service_date', [
                $request->date('date_from')->toDateString(),
                $request->date('date_to')->toDateString(),
            ]);
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'home_service_id' => ['required', 'integer', 'exists:home_services,id'],
            'address_id' => ['required', 'integer', 'exists:home_service_addresses,id'],
            'provider_id' => ['nullable', 'integer', 'exists:home_service_providers,id'],
            'service_date' => ['required', 'date', 'after_or_equal:today'],
            'service_time' => ['required', 'date_format:H:i'],
            'special_instructions' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'in:cod'],
        ]);

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

        try {
            $booking = DB::transaction(function () use ($validated, $service, $provider, $address) {
                $price = $service->base_price;

                if ($provider) {
                    $customPrice = $provider->serviceLinks()
                        ->where('home_service_id', $service->id)
                        ->value('custom_price');

                    if ($customPrice !== null) {
                        $price = $customPrice;
                    }
                }

                $totalAmount = (float) $price;
                $paymentMethod = $validated['payment_method'] ?? HomeServiceBooking::PAYMENT_METHOD_COD;
                $paymentStatus = $totalAmount > 0 ? HomeServiceBooking::PAYMENT_PENDING : HomeServiceBooking::PAYMENT_PAID;

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
                    'changed_by_user_id' => Auth::id(),
                    'notes' => 'Booking created',
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
            'message' => 'Home service booking created successfully.',
            'data' => $booking->load(['service:id,name', 'provider.user:id,name', 'address.city:id,name']),
        ], 201);
    }

    public function show(HomeServiceBooking $booking): JsonResponse
    {
        abort_unless((int) $booking->user_id === (int) Auth::id(), 403, 'Unauthorized booking access.');

        return response()->json([
            'data' => $booking->load([
                'service',
                'provider.user:id,name,phone',
                'address.city:id,name',
                'statusLogs.changedBy:id,name',
            ]),
        ]);
    }

    public function cancel(Request $request, HomeServiceBooking $booking): JsonResponse
    {
        abort_unless((int) $booking->user_id === (int) Auth::id(), 403, 'Unauthorized booking access.');

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if (!$booking->canBeCancelled()) {
            return response()->json(['message' => 'Booking cannot be cancelled now.'], 422);
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
        ]);

        $booking->statusLogs()->create([
            'old_status' => $oldStatus,
            'new_status' => HomeServiceBooking::STATUS_CANCELLED,
            'changed_by_user_id' => Auth::id(),
            'notes' => trim(($validated['reason'] ?? 'Cancelled by patient') . (($refund['eligible'] ?? false) ? ' | ' . ($refund['message'] ?? 'Refund initiated successfully.') : '')),
        ]);

        $message = 'Booking cancelled successfully.';
        if (($refund['eligible'] ?? false) && ($refund['refund_amount'] ?? 0) > 0) {
            $message .= ' ' . ($refund['message'] ?? 'Refund initiated successfully.');
        } elseif (($booking->payment_method ?? null) === HomeServiceBooking::PAYMENT_METHOD_COD) {
            $message .= ' No refund applies for pay-on-visit bookings.';
        }

        return response()->json([
            'message' => $message,
            'data' => $booking->fresh(['service:id,name', 'provider.user:id,name']),
        ]);
    }
}
