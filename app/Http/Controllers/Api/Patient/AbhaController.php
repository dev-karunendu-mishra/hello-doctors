<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Services\AbhaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbhaController extends Controller
{
    public function __construct(private readonly AbhaService $abhaService)
    {
    }

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeUserAbha($request->user()),
        ]);
    }

    public function requestOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mobile' => ['required', 'string', 'min:10', 'max:15'],
        ]);

        try {
            $otp = $this->abhaService->requestOtp($validated['mobile']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $request->user()->forceFill([
            'abha_status' => 'otp_sent',
        ])->save();

        return response()->json([
            'message' => 'ABHA OTP sent successfully.',
            'data' => $otp,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_id' => ['required', 'string'],
            'otp' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        try {
            $result = $this->abhaService->verifyOtp($validated['request_id'], $validated['otp']);
            $profile = $this->abhaService->fetchProfile($result['access_token'] ?? null, $result['abha_address'] ?? null);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $user = $request->user();
        $user->forceFill([
            'abha_number' => $result['abha_number'] ?? $user->abha_number,
            'abha_address' => $result['abha_address'] ?? $user->abha_address,
            'abha_status' => 'verified',
            'abha_reference_id' => $result['reference_id'] ?? $user->abha_reference_id,
            'abha_verified_at' => now(),
            'abha_last_synced_at' => now(),
            'abha_payload' => !empty($profile) ? $profile : ($result['raw'] ?? null),
        ])->save();

        return response()->json([
            'message' => 'ABHA linked successfully.',
            'data' => $this->serializeUserAbha($user->fresh()),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->abha_address) {
            return response()->json([
                'message' => 'No ABHA is linked to this account yet.',
            ], 422);
        }

        try {
            $profile = $this->abhaService->fetchProfile(abhaAddress: $user->abha_address);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $user->forceFill([
            'abha_status' => 'verified',
            'abha_last_synced_at' => now(),
            'abha_payload' => !empty($profile) ? $profile : $user->abha_payload,
            'abha_number' => data_get($profile, 'abhaNumber') ?? data_get($profile, 'healthIdNumber') ?? $user->abha_number,
            'abha_address' => data_get($profile, 'abhaAddress') ?? data_get($profile, 'healthId') ?? $user->abha_address,
        ])->save();

        return response()->json([
            'message' => 'ABHA profile synced successfully.',
            'data' => $this->serializeUserAbha($user->fresh()),
        ]);
    }

    private function serializeUserAbha($user): array
    {
        return [
            'abha_number' => $user?->abha_number,
            'abha_address' => $user?->abha_address,
            'abha_status' => $user?->abha_status ?? 'not_linked',
            'abha_verified_at' => optional($user?->abha_verified_at)?->toDateTimeString(),
            'abha_last_synced_at' => optional($user?->abha_last_synced_at)?->toDateTimeString(),
            'abha_payload' => $user?->abha_payload,
        ];
    }
}
