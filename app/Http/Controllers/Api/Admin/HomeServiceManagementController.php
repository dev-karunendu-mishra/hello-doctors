<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeServiceCategory;
use App\Models\HomeService;
use App\Models\HomeServiceBooking;
use App\Models\HomeServiceProvider;
use App\Models\HomeServiceProviderService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HomeServiceManagementController extends Controller
{
    public function categoriesIndex(): JsonResponse
    {
        $data = HomeServiceCategory::query()
            ->withCount('services')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function categoriesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:home_service_categories,name'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = HomeServiceCategory::query()->create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Home service category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function categoriesUpdate(Request $request, HomeServiceCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:home_service_categories,name,' . $category->id],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Home service category updated successfully.',
            'data' => $category->fresh()->loadCount('services'),
        ]);
    }

    public function servicesIndex(): JsonResponse
    {
        $data = HomeService::query()
            ->with('category:id,name')
            ->latest()
            ->paginate(20);

        return response()->json(['data' => $data]);
    }

    public function servicesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:home_service_categories,id'],
            'code' => ['required', 'string', 'max:50', 'unique:home_services,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'base_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'price_type' => ['nullable', 'in:fixed,hourly,package'],
            'buffer_minutes' => ['nullable', 'integer', 'min:0', 'max:180'],
            'requires_certification' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $service = HomeService::create([
            ...$validated,
            'duration_minutes' => $validated['duration_minutes'] ?? 30,
            'base_price' => $validated['base_price'] ?? 0,
            'price_type' => $validated['price_type'] ?? HomeService::PRICE_FIXED,
            'buffer_minutes' => $validated['buffer_minutes'] ?? 15,
            'requires_certification' => $validated['requires_certification'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Home service created successfully.',
            'data' => $service->load('category:id,name'),
        ], 201);
    }

    public function servicesUpdate(Request $request, HomeService $service): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:home_service_categories,id'],
            'code' => ['required', 'string', 'max:50', 'unique:home_services,code,' . $service->id],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'base_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'price_type' => ['nullable', 'in:fixed,hourly,package'],
            'buffer_minutes' => ['nullable', 'integer', 'min:0', 'max:180'],
            'requires_certification' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $service->update([
            ...$validated,
            'duration_minutes' => $validated['duration_minutes'] ?? 30,
            'base_price' => $validated['base_price'] ?? 0,
            'price_type' => $validated['price_type'] ?? HomeService::PRICE_FIXED,
            'buffer_minutes' => $validated['buffer_minutes'] ?? 15,
            'requires_certification' => $validated['requires_certification'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Home service updated successfully.',
            'data' => $service->fresh('category:id,name'),
        ]);
    }

    public function providersIndex(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'verified' => ['nullable', 'boolean'],
        ]);

        $query = HomeServiceProvider::query()
            ->with(['user:id,name,email,phone,is_active', 'city:id,name', 'serviceLinks.service:id,name'])
            ->latest();

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->integer('city_id'));
        }

        if ($request->filled('verified')) {
            $query->where('is_verified', $request->boolean('verified'));
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    public function providersStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'phone'              => ['required', 'string', 'max:20'],
            'password'           => ['required', 'string', 'min:8'],
            'provider_type'      => ['required', 'in:nurse,attendant,lab_tech,field_exec'],
            'city_id'            => ['required', 'integer', 'exists:cities,id'],
            'license_number'     => ['nullable', 'string', 'max:100'],
            'experience_years'   => ['nullable', 'integer', 'min:0', 'max:50'],
            'service_radius_km'  => ['nullable', 'numeric', 'min:0', 'max:500'],
            'service_ids'        => ['nullable', 'array'],
            'service_ids.*'      => ['integer', 'exists:home_services,id'],
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'phone'     => $validated['phone'],
                'password'  => Hash::make($validated['password']),
                'role'      => 'home_service_provider',
                'is_active' => true,
            ]);

            $provider = HomeServiceProvider::create([
                'user_id'           => $user->id,
                'provider_type'     => $validated['provider_type'],
                'city_id'           => $validated['city_id'],
                'license_number'    => $validated['license_number'] ?? null,
                'experience_years'  => $validated['experience_years'] ?? 0,
                'service_radius_km' => $validated['service_radius_km'] ?? null,
                'is_verified'       => false,
                'is_active'         => true,
            ]);

            if (!empty($validated['service_ids'])) {
                foreach ($validated['service_ids'] as $serviceId) {
                    HomeServiceProviderService::create([
                        'provider_id'     => $provider->id,
                        'home_service_id' => $serviceId,
                        'is_active'       => true,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Provider created successfully.',
                'data'    => $provider->load(['user:id,name,email,phone', 'city:id,name', 'serviceLinks.service:id,name']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function verifyProvider(Request $request, HomeServiceProvider $provider): JsonResponse
    {
        $validated = $request->validate([
            'is_verified' => ['required', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $provider->update([
            'is_verified' => $validated['is_verified'],
            'is_active' => $validated['is_active'] ?? $provider->is_active,
        ]);

        return response()->json([
            'message' => 'Provider verification updated.',
            'data' => $provider->fresh(['user:id,name,email', 'city:id,name']),
        ]);
    }

    public function bookingsIndex(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:pending,assigned,confirmed,in_progress,completed,cancelled,no_show'],
            'service_date' => ['nullable', 'date'],
            'service_id' => ['nullable', 'integer', 'exists:home_services,id'],
        ]);

        $query = HomeServiceBooking::query()
            ->with(['service:id,name', 'user:id,name,phone', 'provider.user:id,name', 'address.city:id,name'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('service_date')) {
            $query->whereDate('service_date', $request->date('service_date')->toDateString());
        }

        if ($request->filled('service_id')) {
            $query->where('home_service_id', $request->integer('service_id'));
        }

        return response()->json(['data' => $query->paginate(30)]);
    }

    public function assignProvider(Request $request, HomeServiceBooking $booking): JsonResponse
    {
        $validated = $request->validate([
            'provider_id' => ['required', 'integer', 'exists:home_service_providers,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $provider = HomeServiceProvider::query()
            ->active()
            ->verified()
            ->where('id', $validated['provider_id'])
            ->firstOrFail();

        if (!$provider->supportsService((int) $booking->home_service_id)) {
            return response()->json(['message' => 'Provider does not support this service.'], 422);
        }

        $oldStatus = $booking->status;

        $booking->update([
            'provider_id' => $provider->id,
            'status' => HomeServiceBooking::STATUS_ASSIGNED,
        ]);

        $booking->statusLogs()->create([
            'old_status' => $oldStatus,
            'new_status' => HomeServiceBooking::STATUS_ASSIGNED,
            'changed_by_user_id' => Auth::id(),
            'notes' => $validated['notes'] ?? 'Assigned by admin',
        ]);

        return response()->json([
            'message' => 'Provider assigned successfully.',
            'data' => $booking->fresh(['provider.user:id,name', 'service:id,name']),
        ]);
    }

    public function updateBookingStatus(Request $request, HomeServiceBooking $booking): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,assigned,confirmed,in_progress,completed,cancelled,no_show'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $booking->status;

        $update = ['status' => $validated['status']];
        if ($validated['status'] === HomeServiceBooking::STATUS_COMPLETED) {
            $update['completed_at'] = now();
        }
        if ($validated['status'] === HomeServiceBooking::STATUS_CANCELLED) {
            $update['cancelled_at'] = now();
            $update['cancel_reason'] = $validated['notes'] ?? 'Cancelled by admin';
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
            'data' => $booking->fresh(['service:id,name', 'provider.user:id,name']),
        ]);
    }
}
