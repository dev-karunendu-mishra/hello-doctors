<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\HomeService;
use App\Models\HomeServiceAddress;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Models\User;
use App\Services\HomeServiceNotificationService;
use App\Services\RefundService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
            ->with([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name,state',
                'unifiedAddress.cityRecord:id,name,state',
            ])
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

        $bookings = $query->paginate(20);
        $bookings->getCollection()->transform(fn(HomeServiceBooking $booking) => $this->decorateBookingResponse($booking));

        return response()->json(['data' => $bookings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'home_service_id' => ['required', 'integer', 'exists:home_services,id'],
            'address_id' => ['nullable', 'integer'],
            'unified_address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'provider_id' => ['nullable', 'integer', 'exists:home_service_providers,id'],
            'service_date' => ['required', 'date', 'after_or_equal:today'],
            'service_time' => ['required', 'date_format:H:i'],
            'special_instructions' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'in:cod'],
        ]);

        if (empty($validated['address_id']) && empty($validated['unified_address_id'])) {
            return response()->json(['message' => 'Please select a service address.'], 422);
        }

        $service = HomeService::active()->findOrFail($validated['home_service_id']);
        [$address, $unifiedAddress] = $this->resolveServiceAddress($validated, (int) Auth::id());

        if (!$address && !$unifiedAddress) {
            return response()->json(['message' => 'Selected address is not available.'], 422);
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

        try {
            $booking = DB::transaction(function () use ($validated, $service, $provider, $address, $unifiedAddress) {
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
                    'address_id' => $address?->id,
                    'unified_address_id' => $unifiedAddress?->id,
                    'service_address_snapshot' => $this->makeServiceAddressSnapshot($address, $unifiedAddress),
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
            'data' => $this->decorateBookingResponse($booking->load([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name,state',
                'unifiedAddress.cityRecord:id,name,state',
            ])),
        ], 201);
    }

    public function show(HomeServiceBooking $booking): JsonResponse
    {
        abort_unless((int) $booking->user_id === (int) Auth::id(), 403, 'Unauthorized booking access.');

        return response()->json([
            'data' => $this->decorateBookingResponse($booking->load([
                'service',
                'provider.user:id,name,phone',
                'address.city:id,name,state',
                'unifiedAddress.cityRecord:id,name,state',
                'statusLogs.changedBy:id,name',
            ])),
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
            'data' => $this->decorateBookingResponse($booking->fresh([
                'service:id,name',
                'provider.user:id,name',
                'address.city:id,name,state',
                'unifiedAddress.cityRecord:id,name,state',
            ])),
        ]);
    }

    private function resolveServiceAddress(array $validated, int $userId): array
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
            $legacyAddress = $this->resolveLegacyAddressFromUnified($unifiedAddress, $userId)
                ?: $this->ensureLegacyAddressForUnified($unifiedAddress, $userId);
        }

        if ($legacyAddress && $unifiedAddress) {
            $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];
            $legacyId = (int) ($meta['legacy_id'] ?? 0);

            if ($legacyId > 0 && $legacyId !== (int) $legacyAddress->id) {
                abort(422, 'Selected address identifiers do not match.');
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
        $meta = is_array($unifiedAddress?->meta) ? $unifiedAddress->meta : [];

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

    private function decorateBookingResponse(HomeServiceBooking $booking): HomeServiceBooking
    {
        $legacyAddress = $booking->relationLoaded('address') ? $booking->address : null;
        $unifiedAddress = $booking->relationLoaded('unifiedAddress') ? $booking->unifiedAddress : null;

        if (!$legacyAddress && $unifiedAddress) {
            $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];

            $legacyAddress = HomeServiceAddress::make([
                'id' => $booking->address_id ?: ($meta['legacy_id'] ?? $unifiedAddress->id),
                'user_id' => $booking->user_id,
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

            if ($unifiedAddress->relationLoaded('cityRecord')) {
                $legacyAddress->setRelation('city', $unifiedAddress->cityRecord);
            }

            $booking->setRelation('address', $legacyAddress);
        }

        if ($legacyAddress && $unifiedAddress) {
            $legacyAddress->setAttribute('unified_address_id', $unifiedAddress->id);
        }

        if (!$booking->service_address_snapshot && ($legacyAddress || $unifiedAddress)) {
            $booking->setAttribute('service_address_snapshot', $this->makeServiceAddressSnapshot($legacyAddress, $unifiedAddress));
        }

        return $booking;
    }
}
