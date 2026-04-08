<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\City;
use App\Models\HomeServiceAddress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HomeServiceAddressController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();
        abort_unless($user, 401, 'Unauthorized.');

        $legacyAddresses = HomeServiceAddress::query()
            ->with('city:id,name,state')
            ->where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->latest()
            ->get()
            ->keyBy('id');

        $unifiedAddresses = Address::query()
            ->with('cityRecord:id,name,state')
            ->where('addressable_type', User::class)
            ->where('addressable_id', $user->id)
            ->orderByDesc('is_primary')
            ->latest()
            ->get();

        $data = $unifiedAddresses->map(function (Address $address) use ($legacyAddresses, $user) {
            $legacyAddress = $this->resolveLegacyAddressFromUnified($address, $legacyAddresses);

            return $this->formatUnifiedAddressResponse($address, $legacyAddress, $user);
        });

        $legacyOnly = $legacyAddresses
            ->filter(function (HomeServiceAddress $legacyAddress) use ($data) {
                return !$data->contains(fn(array $row) => (int) ($row['id'] ?? 0) === (int) $legacyAddress->id);
            })
            ->map(fn(HomeServiceAddress $legacyAddress) => $this->formatLegacyAddressResponse($legacyAddress, $user));

        return response()->json(['data' => $data->concat($legacyOnly)->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        abort_unless($user, 401, 'Unauthorized.');

        $validated = $this->validateAddressPayload($request);

        [$legacyAddress, $unifiedAddress] = DB::transaction(function () use ($validated, $user) {
            if (!empty($validated['is_default'])) {
                $this->resetDefaultAddresses($user->id);
            }

            $legacyAddress = HomeServiceAddress::create([
                ...$validated,
                'user_id' => $user->id,
                'label' => $validated['label'] ?? 'Home',
                'is_default' => $validated['is_default'] ?? false,
            ]);

            $unifiedAddress = $this->upsertUnifiedAddress($user, $validated, $legacyAddress);

            return [$legacyAddress->fresh('city:id,name,state'), $unifiedAddress];
        });

        return response()->json([
            'message' => 'Address saved successfully.',
            'data' => $this->formatUnifiedAddressResponse($unifiedAddress, $legacyAddress, $user),
        ], 201);
    }

    public function update(Request $request, string $address): JsonResponse
    {
        $user = Auth::user();
        abort_unless($user, 401, 'Unauthorized.');

        [$legacyAddress, $unifiedAddress] = $this->resolveAddressRecords($address, $user->id);
        abort_unless($legacyAddress || $unifiedAddress, 404, 'Address not found.');

        $validated = $this->validateAddressPayload($request);

        [$legacyAddress, $unifiedAddress] = DB::transaction(function () use ($validated, $user, $legacyAddress, $unifiedAddress) {
            if (!empty($validated['is_default'])) {
                $this->resetDefaultAddresses($user->id, $legacyAddress?->id, $unifiedAddress?->id);
            }

            if ($legacyAddress) {
                $legacyAddress->update([
                    ...$validated,
                    'label' => $validated['label'] ?? $legacyAddress->label,
                    'is_default' => $validated['is_default'] ?? $legacyAddress->is_default,
                ]);
            } else {
                $legacyAddress = HomeServiceAddress::create([
                    ...$validated,
                    'user_id' => $user->id,
                    'label' => $validated['label'] ?? 'Home',
                    'is_default' => $validated['is_default'] ?? false,
                ]);
            }

            $unifiedAddress = $this->upsertUnifiedAddress($user, $validated, $legacyAddress, $unifiedAddress);

            return [$legacyAddress->fresh('city:id,name,state'), $unifiedAddress];
        });

        return response()->json([
            'message' => 'Address updated successfully.',
            'data' => $this->formatUnifiedAddressResponse($unifiedAddress, $legacyAddress, $user),
        ]);
    }

    public function destroy(string $address): JsonResponse
    {
        $userId = (int) Auth::id();
        [$legacyAddress, $unifiedAddress] = $this->resolveAddressRecords($address, $userId);

        abort_unless($legacyAddress || $unifiedAddress, 404, 'Address not found.');

        DB::transaction(function () use ($legacyAddress, $unifiedAddress) {
            if ($legacyAddress) {
                $legacyAddress->delete();
            }

            if ($unifiedAddress) {
                $unifiedAddress->delete();
            }
        });

        return response()->json(['message' => 'Address deleted successfully.']);
    }

    private function validateAddressPayload(Request $request): array
    {
        return $request->validate([
            'label' => ['nullable', 'string', 'max:30'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:20'],
            'line1' => ['required', 'string', 'max:255'],
            'line2' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
            'pincode' => ['required', 'string', 'max:10'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }

    private function resetDefaultAddresses(int $userId, ?int $exceptLegacyId = null, ?int $exceptUnifiedId = null): void
    {
        HomeServiceAddress::query()
            ->where('user_id', $userId)
            ->when($exceptLegacyId, fn($query) => $query->where('id', '!=', $exceptLegacyId))
            ->update(['is_default' => false]);

        Address::query()
            ->where('addressable_type', User::class)
            ->where('addressable_id', $userId)
            ->when($exceptUnifiedId, fn($query) => $query->where('id', '!=', $exceptUnifiedId))
            ->update(['is_primary' => false]);
    }

    private function upsertUnifiedAddress(User $user, array $validated, HomeServiceAddress $legacyAddress, ?Address $existingAddress = null): Address
    {
        $address = $existingAddress ?: $this->findUnifiedAddressForLegacy($user->id, $legacyAddress->id) ?: new Address();
        $city = City::query()->find($validated['city_id']);
        $meta = array_merge(is_array($address->meta) ? $address->meta : [], [
            'legacy_source' => 'home_service_addresses',
            'legacy_id' => $legacyAddress->id,
            'contact_name' => $validated['contact_name'],
            'contact_phone' => $validated['contact_phone'],
        ]);

        $address->fill([
            'addressable_type' => User::class,
            'addressable_id' => $user->id,
            'label' => $validated['label'] ?? $legacyAddress->label ?? $address->label ?? 'Home',
            'line1' => trim((string) $validated['line1']),
            'line2' => $validated['line2'] ?? null,
            'landmark' => $validated['landmark'] ?? null,
            'city' => $city?->name,
            'city_id' => $validated['city_id'],
            'state' => $city?->state,
            'pincode' => $validated['pincode'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'is_primary' => array_key_exists('is_default', $validated)
                ? (bool) $validated['is_default']
                : (bool) ($legacyAddress->is_default ?? $address->is_primary ?? false),
            'meta' => $meta,
        ]);
        $address->save();

        return $address->fresh('cityRecord:id,name,state');
    }

    private function findUnifiedAddressForLegacy(int $userId, int $legacyAddressId): ?Address
    {
        return Address::query()
            ->with('cityRecord:id,name,state')
            ->where('addressable_type', User::class)
            ->where('addressable_id', $userId)
            ->where('meta->legacy_source', 'home_service_addresses')
            ->where('meta->legacy_id', $legacyAddressId)
            ->first();
    }

    private function resolveAddressRecords(string $identifier, int $userId): array
    {
        $legacyAddress = HomeServiceAddress::query()
            ->with('city:id,name,state')
            ->where('user_id', $userId)
            ->find($identifier);

        $unifiedAddress = Address::query()
            ->with('cityRecord:id,name,state')
            ->where('addressable_type', User::class)
            ->where('addressable_id', $userId)
            ->where(function ($query) use ($identifier, $legacyAddress) {
                $query->whereKey($identifier);

                if ($legacyAddress) {
                    $query->orWhere('meta->legacy_id', $legacyAddress->id);
                } elseif (is_numeric($identifier)) {
                    $query->orWhere('meta->legacy_id', (int) $identifier);
                }
            })
            ->first();

        if (!$legacyAddress && $unifiedAddress) {
            $meta = is_array($unifiedAddress->meta) ? $unifiedAddress->meta : [];
            if (!empty($meta['legacy_id'])) {
                $legacyAddress = HomeServiceAddress::query()
                    ->with('city:id,name,state')
                    ->where('user_id', $userId)
                    ->find((int) $meta['legacy_id']);
            }
        }

        return [$legacyAddress, $unifiedAddress];
    }

    private function resolveLegacyAddressFromUnified(Address $address, $legacyAddresses): ?HomeServiceAddress
    {
        $meta = is_array($address->meta) ? $address->meta : [];
        $legacyId = $meta['legacy_id'] ?? null;

        return $legacyId ? $legacyAddresses->get((int) $legacyId) : null;
    }

    private function formatUnifiedAddressResponse(Address $address, ?HomeServiceAddress $legacyAddress, User $user): array
    {
        $meta = is_array($address->meta) ? $address->meta : [];
        $legacyId = $legacyAddress?->id ?? ($meta['legacy_id'] ?? null);
        $cityName = $address->cityRecord?->name ?: $address->city;
        $state = $address->cityRecord?->state ?: $address->state;

        return [
            'id' => $legacyId ?: $address->id,
            'legacy_address_id' => $legacyId,
            'unified_address_id' => $address->id,
            'label' => $address->label ?: ($legacyAddress?->label ?? 'Home'),
            'contact_name' => $meta['contact_name'] ?? $legacyAddress?->contact_name ?? $user->name,
            'contact_phone' => $meta['contact_phone'] ?? $legacyAddress?->contact_phone ?? $user->phone,
            'line1' => $address->line1,
            'line2' => $address->line2,
            'landmark' => $address->landmark,
            'city_id' => $address->city_id,
            'city' => [
                'id' => $address->city_id,
                'name' => $cityName,
                'state' => $state,
            ],
            'pincode' => $address->pincode,
            'latitude' => $address->latitude,
            'longitude' => $address->longitude,
            'is_default' => (bool) $address->is_primary,
            'created_at' => optional($legacyAddress?->created_at ?? $address->created_at)?->toISOString(),
            'updated_at' => optional($legacyAddress?->updated_at ?? $address->updated_at)?->toISOString(),
        ];
    }

    private function formatLegacyAddressResponse(HomeServiceAddress $address, User $user): array
    {
        return [
            'id' => $address->id,
            'legacy_address_id' => $address->id,
            'unified_address_id' => null,
            'label' => $address->label,
            'contact_name' => $address->contact_name ?? $user->name,
            'contact_phone' => $address->contact_phone ?? $user->phone,
            'line1' => $address->line1,
            'line2' => $address->line2,
            'landmark' => $address->landmark,
            'city_id' => $address->city_id,
            'city' => $address->city ? [
                'id' => $address->city->id,
                'name' => $address->city->name,
                'state' => $address->city->state,
            ] : null,
            'pincode' => $address->pincode,
            'latitude' => $address->latitude,
            'longitude' => $address->longitude,
            'is_default' => (bool) $address->is_default,
            'created_at' => optional($address->created_at)?->toISOString(),
            'updated_at' => optional($address->updated_at)?->toISOString(),
        ];
    }
}
