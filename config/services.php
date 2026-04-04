<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'razorpay' => [
        'key_id'     => env('RAZORPAY_KEY_ID'),
        'key_secret' => env('RAZORPAY_KEY_SECRET'),
    ],

    'abha' => [
        'session_url' => env('ABHA_SESSION_URL', 'https://dev.abdm.gov.in/api/hiecm/gateway/v3/sessions'),
        'base_url' => env('ABHA_BASE_URL', 'https://abhasbx.abdm.gov.in/abha/api'),
        'phr_base_url' => env('ABHA_PHR_BASE_URL', 'https://abhasbx.abdm.gov.in/abha/api/v3/phr/web'),
        'client_id' => env('ABHA_CLIENT_ID'),
        'client_secret' => env('ABHA_CLIENT_SECRET'),
        'cm_id' => env('ABHA_CM_ID', 'sbx'),
        'public_certificate_endpoint' => env('ABHA_PUBLIC_CERTIFICATE_ENDPOINT', '/v3/profile/public/certificate'),
        'mobile_login_request_otp_endpoint' => env('ABHA_MOBILE_LOGIN_REQUEST_OTP_ENDPOINT', '/v3/profile/login/request/otp'),
        'mobile_login_verify_otp_endpoint' => env('ABHA_MOBILE_LOGIN_VERIFY_OTP_ENDPOINT', '/v3/profile/login/verify'),
        'mobile_login_verify_user_endpoint' => env('ABHA_MOBILE_LOGIN_VERIFY_USER_ENDPOINT', '/v3/profile/login/verify/user'),
        'phr_profile_endpoint' => env('ABHA_PHR_PROFILE_ENDPOINT', '/login/profile/abha-profile'),
        'phr_qr_code_endpoint' => env('ABHA_PHR_QR_CODE_ENDPOINT', '/login/profile/abha/qr-code'),
        'phr_card_endpoint' => env('ABHA_PHR_CARD_ENDPOINT', '/abha/phr-card'),
        'timeout' => env('ABHA_TIMEOUT', 20),
    ],

];
