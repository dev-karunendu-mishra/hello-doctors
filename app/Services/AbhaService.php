<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class AbhaService
{
    private const LOGIN_SCOPE = ['abha-login', 'mobile-verify'];

    public function isConfigured(): bool
    {
        return filled(config('services.abha.session_url'))
            && filled(config('services.abha.base_url'))
            && filled(config('services.abha.phr_base_url'))
            && filled(config('services.abha.client_id'))
            && filled(config('services.abha.client_secret'));
    }

    public function requestOtp(string $mobile): array
    {
        $this->ensureConfigured();

        /** @var Response $response */
        $response = $this->abhaClient()->post((string) config('services.abha.mobile_login_request_otp_endpoint'), [
            'scope' => self::LOGIN_SCOPE,
            'loginHint' => 'mobile',
            'loginId' => $this->encryptValue($mobile),
            'otpSystem' => 'abdm',
        ]);

        $data = $this->parseResponse($response);

        return [
            'request_id' => data_get($data, 'txnId'),
            'message' => data_get($data, 'message'),
            'raw' => $data,
        ];
    }

    public function verifyOtp(string $requestId, string $otp, int $userId): array
    {
        $this->ensureConfigured();

        /** @var Response $response */
        $response = $this->abhaClient()->post((string) config('services.abha.mobile_login_verify_otp_endpoint'), [
            'scope' => self::LOGIN_SCOPE,
            'authData' => [
                'authMethods' => ['otp'],
                'otp' => [
                    'txnId' => $requestId,
                    'otpValue' => $this->encryptValue($otp),
                ],
            ],
        ]);

        $data = $this->parseResponse($response);
        $txnId = (string) (data_get($data, 'txnId') ?: $requestId);
        $transferToken = (string) data_get($data, 'token', '');
        $accounts = $this->normalizeAccounts(data_get($data, 'accounts', []));

        if (!$transferToken) {
            throw new RuntimeException('ABHA mobile OTP was verified, but no transfer token was returned.');
        }

        Cache::put($this->pendingLoginCacheKey($userId), [
            'txn_id' => $txnId,
            'transfer_token' => $transferToken,
            'accounts' => $accounts,
        ], now()->addMinutes(5));

        return [
            'txn_id' => $txnId,
            'transfer_token' => $transferToken,
            'accounts' => $accounts,
            'raw' => $data,
        ];
    }

    public function linkAccount(int $userId, string $abhaNumber): array
    {
        $this->ensureConfigured();

        $pending = Cache::get($this->pendingLoginCacheKey($userId));
        if (!is_array($pending) || empty($pending['txn_id']) || empty($pending['transfer_token'])) {
            throw new RuntimeException('ABHA verification session expired. Please request OTP again.');
        }

        /** @var Response $response */
        $response = $this->abhaClient(
            extraHeaders: ['T-token' => 'Bearer ' . $pending['transfer_token']]
        )->post((string) config('services.abha.mobile_login_verify_user_endpoint'), [
            'ABHANumber' => $this->encryptValue($abhaNumber),
            'txnId' => $pending['txn_id'],
        ]);

        $verifyUserData = $this->parseResponse($response);
        $xToken = (string) data_get($verifyUserData, 'token', '');

        if (!$xToken) {
            throw new RuntimeException('ABHA user verification succeeded, but no X-token was returned.');
        }

        $ttl = max(300, ((int) data_get($verifyUserData, 'expiresIn', 1800)) - 60);
        Cache::put($this->userXTokenCacheKey($userId), $xToken, now()->addSeconds($ttl));

        $profile = $this->fetchProfile($xToken);

        return [
            'abha_number' => data_get($profile, 'abhaNumber') ?? $abhaNumber,
            'abha_address' => data_get($profile, 'abhaAddress') ?? data_get($profile, 'preferredAbhaAddress'),
            'reference_id' => data_get($pending, 'txn_id'),
            'access_token' => $xToken,
            'profile' => $profile,
            'raw' => [
                'verify_user' => $verifyUserData,
                'profile' => $profile,
            ],
        ];
    }

    public function fetchProfileForUser(int $userId): array
    {
        return $this->fetchProfile($this->getUserXToken($userId));
    }

    public function fetchQrCodeForUser(int $userId): array
    {
        /** @var Response $response */
        $response = $this->phrClient($this->getUserXToken($userId))
            ->get((string) config('services.abha.phr_qr_code_endpoint'));

        return $this->parseBinaryOrJsonResponse($response, 'qr');
    }

    public function fetchCardForUser(int $userId): array
    {
        /** @var Response $response */
        $response = $this->phrClient($this->getUserXToken($userId))
            ->get((string) config('services.abha.phr_card_endpoint'));

        return $this->parseBinaryOrJsonResponse($response, 'card');
    }

    private function fetchProfile(string $xToken): array
    {
        /** @var Response $response */
        $response = $this->phrClient($xToken)
            ->get((string) config('services.abha.phr_profile_endpoint'));

        return $this->parseResponse($response);
    }

    private function getSessionAccessToken(): string
    {
        $cacheKey = 'abha:session:access-token';
        $cached = Cache::get($cacheKey);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        /** @var Response $response */
        $response = Http::acceptJson()
            ->asJson()
            ->timeout((int) config('services.abha.timeout', 20))
            ->post((string) config('services.abha.session_url'), [
                'clientId' => config('services.abha.client_id'),
                'clientSecret' => config('services.abha.client_secret'),
            ]);

        $data = $this->parseResponse($response);
        $token = (string) data_get($data, 'accessToken', '');

        if (!$token) {
            throw new RuntimeException('ABDM session token was not returned by the gateway.');
        }

        $ttl = max(300, ((int) data_get($data, 'expiresIn', 1200)) - 60);
        Cache::put($cacheKey, $token, now()->addSeconds($ttl));

        return $token;
    }

    private function getPublicCertificate(): string
    {
        $cacheKey = 'abha:public-certificate';
        $cached = Cache::get($cacheKey);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        /** @var Response $response */
        $response = Http::baseUrl(rtrim((string) config('services.abha.base_url'), '/'))
            ->acceptJson()
            ->timeout((int) config('services.abha.timeout', 20))
            ->get((string) config('services.abha.public_certificate_endpoint'));

        $data = $this->parseResponse($response);
        $publicKey = (string) data_get($data, 'publicKey', '');

        if (!$publicKey) {
            throw new RuntimeException('ABHA public certificate could not be fetched.');
        }

        Cache::put($cacheKey, $publicKey, now()->addDay());

        return $publicKey;
    }

    private function encryptValue(string $value): string
    {
        $publicKey = trim($this->getPublicCertificate());
        $sanitized = preg_replace('/\s+/', '', $publicKey ?? '');

        if (!str_contains($publicKey, 'BEGIN PUBLIC KEY')) {
            $publicKey = "-----BEGIN PUBLIC KEY-----\n"
                . chunk_split($sanitized, 64, "\n")
                . "-----END PUBLIC KEY-----\n";
        }

        $encrypted = '';
        $result = openssl_public_encrypt($value, $encrypted, $publicKey, OPENSSL_PKCS1_OAEP_PADDING);

        if (!$result) {
            throw new RuntimeException('Unable to encrypt ABHA data using the public certificate.');
        }

        return base64_encode($encrypted);
    }

    private function abhaClient(array $extraHeaders = []): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.abha.base_url'), '/'))
            ->acceptJson()
            ->asJson()
            ->timeout((int) config('services.abha.timeout', 20))
            ->withHeaders($this->defaultHeaders($extraHeaders));
    }

    private function phrClient(string $xToken): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.abha.phr_base_url'), '/'))
            ->timeout((int) config('services.abha.timeout', 20))
            ->withHeaders($this->defaultHeaders([
                'X-token' => 'Bearer ' . $xToken,
            ]));
    }

    private function defaultHeaders(array $extraHeaders = []): array
    {
        return array_merge([
            'REQUEST-ID' => (string) Str::uuid(),
            'TIMESTAMP' => now()->utc()->format('Y-m-d\TH:i:s.v\Z'),
            'Authorization' => 'Bearer ' . $this->getSessionAccessToken(),
            'X-CM-ID' => config('services.abha.cm_id', 'sbx'),
            'Accept' => 'application/json',
        ], $extraHeaders);
    }

    private function getUserXToken(int $userId): string
    {
        $token = Cache::get($this->userXTokenCacheKey($userId));

        if (!is_string($token) || $token === '') {
            throw new RuntimeException('ABHA session expired. Please verify your ABHA again to continue.');
        }

        return $token;
    }

    private function normalizeAccounts(array $accounts): array
    {
        return collect($accounts)
            ->map(fn ($account) => [
                'abha_number' => data_get($account, 'ABHANumber') ?? data_get($account, 'abhaNumber'),
                'abha_address' => data_get($account, 'preferredAbhaAddress') ?? data_get($account, 'abhaAddress'),
                'name' => data_get($account, 'name') ?? data_get($account, 'fullName'),
                'status' => data_get($account, 'status'),
                'kyc_verified' => (bool) (data_get($account, 'kycVerified') ?? false),
            ])
            ->filter(fn ($account) => !empty($account['abha_number']))
            ->values()
            ->all();
    }

    private function parseResponse(Response $response): array
    {
        $payload = $response->json();
        $data = is_array($payload) ? $payload : [];

        if ($response->failed()) {
            $message = data_get($data, 'message')
                ?? data_get($data, 'error.message')
                ?? data_get($data, 'details.0.message')
                ?? 'ABHA request failed.';

            throw new RuntimeException((string) $message);
        }

        return $data;
    }

    private function parseBinaryOrJsonResponse(Response $response, string $type): array
    {
        if ($response->failed()) {
            $this->parseResponse($response);
        }

        $contentType = strtolower((string) $response->header('Content-Type'));

        if (str_contains($contentType, 'application/json')) {
            $data = $this->parseResponse($response);
            $raw = data_get($data, 'qrCode') ?? data_get($data, 'data') ?? null;

            return [
                'type' => $type,
                'content_type' => $contentType ?: 'application/json',
                'raw' => $raw,
                'data_url' => is_string($raw) && !str_starts_with($raw, 'data:')
                    ? 'data:image/png;base64,' . $raw
                    : $raw,
            ];
        }

        $body = $response->body();

        return [
            'type' => $type,
            'content_type' => $contentType ?: 'application/octet-stream',
            'raw' => base64_encode($body),
            'data_url' => str_starts_with($contentType, 'image/')
                ? 'data:' . $contentType . ';base64,' . base64_encode($body)
                : null,
            'body' => $body,
        ];
    }

    private function pendingLoginCacheKey(int $userId): string
    {
        return 'abha:user:' . $userId . ':pending-login';
    }

    private function userXTokenCacheKey(int $userId): string
    {
        return 'abha:user:' . $userId . ':x-token';
    }

    private function ensureConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('ABHA is not configured yet. Please add your ABDM ABHA V3 credentials in .env first.');
        }
    }
}
