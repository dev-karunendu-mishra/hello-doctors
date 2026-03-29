<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HomeServiceController extends Controller
{
    private const ALLOWED_PROVIDER_TRANSITIONS = [
        HomeServiceBooking::STATUS_ASSIGNED => [
            HomeServiceBooking::STATUS_CONFIRMED,
            HomeServiceBooking::STATUS_CANCELLED,
        ],
        HomeServiceBooking::STATUS_CONFIRMED => [
            HomeServiceBooking::STATUS_IN_PROGRESS,
            HomeServiceBooking::STATUS_CANCELLED,
            HomeServiceBooking::STATUS_NO_SHOW,
        ],
        HomeServiceBooking::STATUS_IN_PROGRESS => [
            HomeServiceBooking::STATUS_COMPLETED,
            HomeServiceBooking::STATUS_CANCELLED,
        ],
        HomeServiceBooking::STATUS_PENDING => [],
        HomeServiceBooking::STATUS_COMPLETED => [],
        HomeServiceBooking::STATUS_CANCELLED => [],
        HomeServiceBooking::STATUS_NO_SHOW => [],
    ];

    private function provider(): HomeServiceProvider
    {
        return HomeServiceProvider::query()
            ->where('user_id', Auth::id())
            ->firstOrFail();
    }

    public function profile(): JsonResponse
    {
        $provider = $this->provider()->load(['user:id,name,email,phone', 'city:id,name', 'serviceLinks.service:id,name']);
        $today = today()->toDateString();
        $nowTime = now()->format('H:i:s');

        $todayBookingsCount = $provider->bookings()
            ->whereDate('service_date', $today)
            ->count();

        $completedBookingsCount = $provider->bookings()
            ->where('status', HomeServiceBooking::STATUS_COMPLETED)
            ->count();

        $upcomingVisitsCount = $provider->bookings()
            ->where(function ($query) use ($today, $nowTime) {
                $query->whereDate('service_date', '>', $today)
                    ->orWhere(function ($sameDay) use ($today, $nowTime) {
                        $sameDay->whereDate('service_date', $today)
                            ->whereTime('service_time', '>=', $nowTime);
                    });
            })
            ->whereIn('status', [
                HomeServiceBooking::STATUS_ASSIGNED,
                HomeServiceBooking::STATUS_CONFIRMED,
                HomeServiceBooking::STATUS_IN_PROGRESS,
            ])
            ->count();

        $data = $provider->toArray();
        $data['analytics'] = [
            'today_bookings_count' => $todayBookingsCount,
            'completed_bookings_count' => $completedBookingsCount,
            'upcoming_visits_count' => $upcomingVisitsCount,
        ];

        return response()->json([
            'data' => $data,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $provider = $this->provider();

        $validated = $request->validate([
            'provider_type' => ['required', 'in:nurse,attendant,lab_tech,field_exec'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'experience_years' => ['nullable', 'integer', 'min:0', 'max:80'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
            'service_radius_km' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer', 'exists:home_services,id'],
        ]);

        DB::transaction(function () use ($provider, $validated) {
            $provider->update([
                'provider_type' => $validated['provider_type'],
                'license_number' => $validated['license_number'] ?? null,
                'experience_years' => $validated['experience_years'] ?? 0,
                'city_id' => $validated['city_id'],
                'service_radius_km' => $validated['service_radius_km'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (array_key_exists('service_ids', $validated)) {
                $syncData = collect($validated['service_ids'])
                    ->mapWithKeys(fn($id) => [(int) $id => ['is_active' => true]])
                    ->toArray();

                $provider->services()->sync($syncData);
            }
        });

        return response()->json([
            'message' => 'Provider profile updated successfully.',
            'data' => $provider->fresh(['serviceLinks.service:id,name']),
        ]);
    }

    public function availability(): JsonResponse
    {
        $provider = $this->provider();

        return response()->json([
            'data' => $provider->availability()->orderBy('day_of_week')->get(),
        ]);
    }

    public function saveAvailability(Request $request): JsonResponse
    {
        $provider = $this->provider();

        $validated = $request->validate([
            'schedules' => ['required', 'array'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.opening_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.closing_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.break_start_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.break_end_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.slot_duration_minutes' => ['nullable', 'integer', 'min:5', 'max:180'],
            'schedules.*.max_bookings_per_slot' => ['nullable', 'integer', 'min:1', 'max:10'],
            'schedules.*.is_available' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($provider, $validated) {
            $days = collect($validated['schedules'])->pluck('day_of_week')->map(fn($d) => (int) $d)->values();
            $provider->availability()->whereNotIn('day_of_week', $days)->delete();

            foreach ($validated['schedules'] as $schedule) {
                $isAvailable = (bool) $schedule['is_available'];

                $provider->availability()->updateOrCreate(
                    ['day_of_week' => (int) $schedule['day_of_week']],
                    [
                        'opening_time' => $isAvailable ? ($schedule['opening_time'] ?? null) : null,
                        'closing_time' => $isAvailable ? ($schedule['closing_time'] ?? null) : null,
                        'break_start_time' => $isAvailable ? ($schedule['break_start_time'] ?? null) : null,
                        'break_end_time' => $isAvailable ? ($schedule['break_end_time'] ?? null) : null,
                        'slot_duration_minutes' => (int) ($schedule['slot_duration_minutes'] ?? 30),
                        'max_bookings_per_slot' => (int) ($schedule['max_bookings_per_slot'] ?? 1),
                        'is_available' => $isAvailable,
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Availability updated successfully.',
            'data' => $provider->availability()->orderBy('day_of_week')->get(),
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:pending,assigned,confirmed,in_progress,completed,cancelled,no_show'],
            'date' => ['nullable', 'date'],
        ]);

        $provider = $this->provider();

        $query = HomeServiceBooking::query()
            ->with(['service:id,name', 'user:id,name,phone', 'address.city:id,name'])
            ->where('provider_id', $provider->id)
            ->orderBy('service_date')
            ->orderBy('service_time');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('date')) {
            $query->whereDate('service_date', $request->date('date')->toDateString());
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    public function updateBookingStatus(Request $request, HomeServiceBooking $booking): JsonResponse
    {
        $provider = $this->provider();
        abort_unless((int) $booking->provider_id === (int) $provider->id, 403, 'Unauthorized booking access.');

        $validated = $request->validate([
            'status' => ['required', 'in:confirmed,in_progress,completed,cancelled,no_show'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $booking->status;
        $allowedTransitions = self::ALLOWED_PROVIDER_TRANSITIONS[$oldStatus] ?? [];

        if (!in_array($validated['status'], $allowedTransitions, true)) {
            return response()->json([
                'message' => 'Invalid status transition for provider.',
                'errors' => [
                    'status' => [
                        sprintf(
                            'Cannot change booking status from %s to %s. Allowed: %s',
                            $oldStatus,
                            $validated['status'],
                            empty($allowedTransitions) ? 'none' : implode(', ', $allowedTransitions)
                        ),
                    ],
                ],
            ], 422);
        }

        $update = ['status' => $validated['status']];
        if ($validated['status'] === HomeServiceBooking::STATUS_COMPLETED) {
            $update['completed_at'] = now();
        }
        if ($validated['status'] === HomeServiceBooking::STATUS_CANCELLED) {
            $update['cancelled_at'] = now();
            $update['cancel_reason'] = $validated['notes'] ?? 'Cancelled by provider';
        }

        $booking->update($update);

        $booking->statusLogs()->create([
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'changed_by_user_id' => Auth::id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Booking status updated successfully.',
            'data' => $booking->fresh(['service:id,name', 'user:id,name']),
        ]);
    }
}
