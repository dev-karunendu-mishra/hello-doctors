<?php

namespace App\Services;

use Illuminate\Http\Client\ClientException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class CaptchaVerificationService
{
    public function __construct(
        private readonly string $secretKey = '',
        private readonly float $threshold = 0.5,
    ) {
        $this->secretKey = $secretKey ?: config('recaptcha.secret_key');
        $this->threshold = $threshold ?: config('recaptcha.threshold');
    }

    /**
     * Verify a reCAPTCHA v3 token
     *
     * @param  string  $token
     * @param  string  $action Expected action name (e.g., 'guest_booking')
     * @return array Array with 'success' boolean, 'score' float, and 'error_codes' array
     */
    public function verify(string $token, string $action = ''): array
    {
        if (!$token || empty($this->secretKey)) {
            return [
                'success' => false,
                'score' => 0.0,
                'error_codes' => ['missing_token_or_key'],
            ];
        }

        try {
            $response = Http::post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $this->secretKey,
                'response' => $token,
            ]);

            $data = $response->json();

            // Check if the response was successful
            if (!($data['success'] ?? false)) {
                return [
                    'success' => false,
                    'score' => 0.0,
                    'error_codes' => $data['error-codes'] ?? [],
                ];
            }

            // Verify action if provided
            if ($action && ($data['action'] ?? '') !== $action) {
                return [
                    'success' => false,
                    'score' => $data['score'] ?? 0.0,
                    'error_codes' => ['action_mismatch'],
                ];
            }

            $score = (float) ($data['score'] ?? 0.0);

            // Check score against threshold
            if ($score < $this->threshold) {
                return [
                    'success' => false,
                    'score' => $score,
                    'error_codes' => ['score_below_threshold'],
                ];
            }

            return [
                'success' => true,
                'score' => $score,
                'error_codes' => [],
                'challenge_ts' => $data['challenge_ts'] ?? null,
            ];
        } catch (ClientException|InvalidArgumentException $e) {
            return [
                'success' => false,
                'score' => 0.0,
                'error_codes' => ['verification_failed', $e->getMessage()],
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('CAPTCHA verification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'score' => 0.0,
                'error_codes' => ['server_error'],
            ];
        }
    }
}
