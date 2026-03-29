<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\HomeServiceAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HomeServiceAddressController extends Controller
{
    public function index(): JsonResponse
    {
        $data = HomeServiceAddress::query()
            ->with('city:id,name')
            ->where('user_id', Auth::id())
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
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

        if (!empty($validated['is_default'])) {
            HomeServiceAddress::query()
                ->where('user_id', Auth::id())
                ->update(['is_default' => false]);
        }

        $address = HomeServiceAddress::create([
            ...$validated,
            'user_id' => Auth::id(),
            'label' => $validated['label'] ?? 'Home',
            'is_default' => $validated['is_default'] ?? false,
        ]);

        return response()->json([
            'message' => 'Address saved successfully.',
            'data' => $address->load('city:id,name'),
        ], 201);
    }

    public function update(Request $request, HomeServiceAddress $address): JsonResponse
    {
        abort_unless((int) $address->user_id === (int) Auth::id(), 403, 'Unauthorized address access.');

        $validated = $request->validate([
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

        if (!empty($validated['is_default'])) {
            HomeServiceAddress::query()
                ->where('user_id', Auth::id())
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update([
            ...$validated,
            'label' => $validated['label'] ?? $address->label,
            'is_default' => $validated['is_default'] ?? $address->is_default,
        ]);

        return response()->json([
            'message' => 'Address updated successfully.',
            'data' => $address->fresh('city:id,name'),
        ]);
    }

    public function destroy(HomeServiceAddress $address): JsonResponse
    {
        abort_unless((int) $address->user_id === (int) Auth::id(), 403, 'Unauthorized address access.');

        $address->delete();

        return response()->json(['message' => 'Address deleted successfully.']);
    }
}
