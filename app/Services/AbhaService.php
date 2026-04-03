<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AbhaService
{
    public function isConfigured(): bool
    {
        return filled(config('services.abha.base_url'))
            && filled(config('services.abha.client_id'))
            && filled(config('services.abha.client_secret'));
    }

    public function requestOtp(string $mobile): array
    {
        $this->ensureConfigured();

        /** @var Response $response */
        $response = $this->client()->post((string) config('services.abha.request_otp_endpoint'), [
            'mobile' => $mobile,
            'clientId' => config('services.abha.client_id'),
            'clientSecret' => config('services.abha.client_secret'),
        ]);

        $data = $this->parseResponse($response->status(), $response->json());

        return [
            'request_id' => data_get($data, 'requestId')
                ?? data_get($data, 'txnId')
                ?? data_get($data, 'data.requestId')
                ?? data_get($data, 'data.txnId'),
            'raw' => $data,
        ];
    }

    public function verifyOtp(string $requestId, string $otp): array
    {
        $this->ensureConfigured();

        /** @var Response $response */
        $response = $this->client()->post((string) config('services.abha.verify_otp_endpoint'), [
            'requestId' => $requestId,
            'txnId' => $requestId,
            'otp' => $otp,
            'clientId' => config('services.abha.client_id'),
            'clientSecret' => config('services.abha.client_secret'),
        ]);

        $data = $this->parseResponse($response->status(), $response->json());

        return [
            'abha_number' => data_get($data, 'abhaNumber')
                ?? data_get($data, 'healthIdNumber')
                ?? data_get($data, 'data.abhaNumber')
                ?? data_get($data, 'data.healthIdNumber'),
            'abha_address' => data_get($data, 'abhaAddress')
                ?? data_get($data, 'healthId')
                ?? data_get($data, 'data.abhaAddress')
                ?? data_get($data, 'data.healthId'),
            'reference_id' => data_get($data, 'referenceId')
                ?? data_get($data, 'token')
                ?? data_get($data, 'data.referenceId')
                ?? data_get($data, 'data.token'),
            'access_token' => data_get($data, 'accessToken')
                ?? data_get($data, 'token')
                ?? data_get($data, 'data.accessToken'),
            'raw' => $data,
        ];
    }

    public function fetchProfile(?string $accessToken = null, ?string $abhaAddress = null): array
    {
        $this->ensureConfigured();

        $bearerToken = $accessToken ?: config('services.abha.system_bearer_token');
        if (!$bearerToken) {
            return [];
        }

        $query = array_filter([
            'abhaAddress' => $abhaAddress,
            'healthId' => $abhaAddress,
        ]);

        /** @var Response $response */
        $response = $this->client($bearerToken)->get((string) config('services.abha.profile_endpoint'), $query);

        return $this->parseResponse($response->status(), $response->json());
    }

    private function client(?string $bearerToken = null): PendingRequest
    {
        $headers = array_filter([
            'X-CM-ID' => config('services.abha.cm_id', 'sbx'),
            'Accept' => 'application/json',
            'Authorization' => $bearerToken ? 'Bearer ' . $bearerToken : null,
        ]);

        return Http::baseUrl(rtrim((string) config('services.abha.base_url'), '/'))
            ->timeout((int) config('services.abha.timeout', 20))
            ->acceptJson()
            ->asJson()
            ->withHeaders($headers);
    }

    private function ensureConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('ABHA is not configured yet. Please add your ABHA sandbox credentials in .env first.');
        }
    }

    private function parseResponse(int $status, mixed $payload): array
    {
        $data = is_array($payload) ? $payload : [];

        if ($status >= 400) {
            $message = data_get($data, 'message')
                ?? data_get($data, 'error.message')
                ?? data_get($data, 'details.0.message')
                ?? 'ABHA request failed.';

            throw new RuntimeException((string) $message);
        }

        return $data;
    }
}
