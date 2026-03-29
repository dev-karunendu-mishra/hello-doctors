<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\HomeService;
use App\Models\HomeServiceProvider;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:home_service_categories,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
        ]);

        $services = HomeService::query()
            ->with('category')
            ->active()
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('category_id', $request->integer('category_id'));
            })
            ->orderBy('name')
            ->get();

        if ($request->filled('city_id')) {
            $cityId = $request->integer('city_id');

            $services = $services->filter(function (HomeService $service) use ($cityId) {
                return HomeServiceProvider::query()
                    ->active()
                    ->verified()
                    ->where('city_id', $cityId)
                    ->whereHas('serviceLinks', function ($query) use ($service) {
                        $query->where('home_service_id', $service->id)
                            ->where('is_active', true);
                    })
                    ->exists();
            })->values();
        }

        return response()->json(['data' => $services]);
    }

    public function availableSlots(Request $request, HomeService $service): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
        ]);

        if (!$service->is_active) {
            return response()->json(['data' => []]);
        }

        $date = Carbon::parse($validated['date']);

        $providers = HomeServiceProvider::query()
            ->with(['user', 'city'])
            ->active()
            ->verified()
            ->where('city_id', $validated['city_id'])
            ->whereHas('serviceLinks', function ($query) use ($service) {
                $query->where('home_service_id', $service->id)
                    ->where('is_active', true);
            })
            ->get();

        $data = $providers->map(function (HomeServiceProvider $provider) use ($service, $date) {
            $slots = $provider->getAvailableSlotsForDate($date, $service->id, (int) $service->duration_minutes);

            return [
                'provider' => [
                    'id' => $provider->id,
                    'name' => $provider->user?->name,
                    'provider_type' => $provider->provider_type,
                ],
                'slots' => $slots,
            ];
        })->filter(fn($item) => !empty($item['slots']))->values();

        return response()->json([
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'duration_minutes' => $service->duration_minutes,
                'base_price' => $service->base_price,
            ],
            'date' => $date->toDateString(),
            'data' => $data,
        ]);
    }
}
