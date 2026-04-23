<?php

return [
    'site_key' => env('RECAPTCHA_SITE_KEY', ''),
    'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),
    'version' => env('RECAPTCHA_VERSION', 'v3'),
    'threshold' => (float) env('RECAPTCHA_THRESHOLD', 0.5),
    'enabled' => env('RECAPTCHA_ENABLED', true),
];
