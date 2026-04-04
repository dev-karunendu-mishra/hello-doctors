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
            'message' => $otp['message'] ?? 'ABHA login OTP sent successfully.',
            'data' => $otp,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_id' => ['required', 'string'],
            'otp' => ['required', 'string', 'min:4', 'max:10'],
            'abha_number' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        try {
            $otpResult = $this->abhaService->verifyOtp($validated['request_id'], $validated['otp'], (int) $user->id);
            $accounts = $otpResult['accounts'] ?? [];

            if (empty($accounts)) {
                return response()->json([
                    'message' => 'OTP verified, but no ABHA accounts were found for this mobile number.',
                ], 422);
            }

            $selectedAbhaNumber = $validated['abha_number'] ?? null;
            if (!$selectedAbhaNumber) {
                if (count($accounts) > 1) {
                    return response()->json([
                        'message' => 'OTP verified. Please select the ABHA account you want to link.',
                        'data' => [
                            'selection_required' => true,
                            'accounts' => $accounts,
                        ],
                    ]);
                }

                $selectedAbhaNumber = $accounts[0]['abha_number'] ?? null;
            }

            $result = $this->abhaService->linkAccount((int) $user->id, (string) $selectedAbhaNumber);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->persistLinkedProfile($user, $result);

        return response()->json([
            'message' => 'ABHA linked successfully using ABDM ABHA V3 mobile OTP flow.',
            'data' => $this->serializeUserAbha($user->fresh()),
        ]);
    }

    public function linkAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'abha_number' => ['required', 'string'],
        ]);

        $user = $request->user();

        try {
            $result = $this->abhaService->linkAccount((int) $user->id, $validated['abha_number']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->persistLinkedProfile($user, $result);

        return response()->json([
            'message' => 'ABHA account linked successfully.',
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
            $profile = $this->abhaService->fetchProfileForUser((int) $user->id);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $user->forceFill([
            'abha_status' => 'verified',
            'abha_last_synced_at' => now(),
            'abha_payload' => !empty($profile) ? $profile : $user->abha_payload,
            'abha_number' => data_get($profile, 'abhaNumber') ?? $user->abha_number,
            'abha_address' => data_get($profile, 'abhaAddress') ?? $user->abha_address,
        ])->save();

        return response()->json([
            'message' => 'ABHA profile synced successfully.',
            'data' => $this->serializeUserAbha($user->fresh()),
        ]);
    }

    public function qrCode(Request $request): JsonResponse
    {
        try {
            $qr = $this->abhaService->fetchQrCodeForUser((int) $request->user()->id);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'data' => $qr,
        ]);
    }

    public function card(Request $request)
    {
        try {
            $card = $this->abhaService->fetchCardForUser((int) $request->user()->id);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response($card['body'] ?? base64_decode((string) ($card['raw'] ?? '')), 200, [
            'Content-Type' => $card['content_type'] ?? 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="abha-card"',
        ]);
    }

    private function persistLinkedProfile($user, array $result): void
    {
        $profile = $result['profile'] ?? [];

        $user->forceFill([
            'abha_number' => $result['abha_number'] ?? $user->abha_number,
            'abha_address' => $result['abha_address'] ?? $user->abha_address,
            'abha_status' => 'verified',
            'abha_reference_id' => $result['reference_id'] ?? $user->abha_reference_id,
            'abha_verified_at' => now(),
            'abha_last_synced_at' => now(),
            'abha_payload' => !empty($profile) ? $profile : ($result['raw'] ?? null),
        ])->save();
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
