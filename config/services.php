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
        'base_url' => env('ABHA_BASE_URL'),
        'client_id' => env('ABHA_CLIENT_ID'),
        'client_secret' => env('ABHA_CLIENT_SECRET'),
        'cm_id' => env('ABHA_CM_ID', 'sbx'),
        'request_otp_endpoint' => env('ABHA_REQUEST_OTP_ENDPOINT', '/request-otp'),
        'verify_otp_endpoint' => env('ABHA_VERIFY_OTP_ENDPOINT', '/verify-otp'),
        'profile_endpoint' => env('ABHA_PROFILE_ENDPOINT', '/profile'),
        'system_bearer_token' => env('ABHA_SYSTEM_BEARER_TOKEN'),
        'timeout' => env('ABHA_TIMEOUT', 20),
    ],

];
