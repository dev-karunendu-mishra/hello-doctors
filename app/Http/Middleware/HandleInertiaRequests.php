<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $getSiteSettings = function (string $group): array {
            if (!Schema::hasTable('site_settings')) {
                return [];
            }

            return cache()->remember("{$group}_settings", 3600, function () use ($group) {
                return SiteSetting::where('group', $group)
                    ->get()
                    ->pluck('value', 'key')
                    ->toArray();
            });
        };

        // Get site settings from database when available
        $seoSettings = $getSiteSettings('seo');
        $generalSettings = $getSiteSettings('general');
        $contactSettings = $getSiteSettings('contact');
        $authUser = $request->user();
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $authUser ? [
                    'id' => $authUser->id,
                    'name' => $authUser->name,
                    'email' => $authUser->email,
                    'role' => $authUser->role,
                ] : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'site' => [
                'name' => $generalSettings['site_name'] ?? $seoSettings['site_name'] ?? config('app.name', 'Hello Doctors'),
                'tagline' => $generalSettings['site_tagline'] ?? $seoSettings['site_tagline'] ?? 'Find the Best Healthcare Services',
                'description' => $generalSettings['site_description'] ?? 'Connect with verified healthcare professionals',
                'logo' => $generalSettings['site_logo'] ?? null,
                'favicon' => $generalSettings['site_favicon'] ?? null,
                'contact' => [
                    'email' => $contactSettings['contact_email'] ?? 'support@hellodoctors.in',
                    'secondary_email' => $contactSettings['contact_secondary_email'] ?? 'contact@hellodoctors.in',
                    'phone' => $contactSettings['contact_phone'] ?? '+91 (555) 123-4567',
                    'address' => $contactSettings['contact_address'] ?? 'Healthcare Network, Uttar Pradesh, India',
                    'hours_weekdays' => $contactSettings['contact_hours_weekdays'] ?? 'Monday-Friday: 9 AM - 6 PM',
                    'hours_weekend' => $contactSettings['contact_hours_weekend'] ?? 'Saturday: 9 AM - 4 PM',
                    'map_embed_url' => $contactSettings['map_embed_url'] ?? 'https://www.google.com/maps?q=Prayagraj%2C%20Uttar%20Pradesh&z=10&output=embed',
                    'facebook_url' => $contactSettings['facebook_url'] ?? '',
                    'twitter_url' => $contactSettings['twitter_url'] ?? '',
                    'linkedin_url' => $contactSettings['linkedin_url'] ?? '',
                    'instagram_url' => $contactSettings['instagram_url'] ?? '',
                    'youtube_url' => $contactSettings['youtube_url'] ?? '',
                ],
            ],
            'seo' => [
                'meta_title' => $seoSettings['meta_title'] ?? null,
                'meta_description' => $seoSettings['meta_description'] ?? 'Find the best doctors and healthcare professionals',
                'meta_keywords' => $seoSettings['meta_keywords'] ?? 'doctors, healthcare, medical',
                'meta_author' => $seoSettings['meta_author'] ?? config('app.name'),
                'og_title' => $seoSettings['og_title'] ?? null,
                'og_description' => $seoSettings['og_description'] ?? 'Find the best doctors',
                'og_image' => $seoSettings['og_image'] ?? null,
                'twitter_card' => $seoSettings['twitter_card'] ?? 'summary_large_image',
                'twitter_site' => $seoSettings['twitter_site'] ?? '',
                'app_url' => config('app.url'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'payments' => [
                'online_enabled' => (bool) config('services.razorpay.enabled', true),
            ],
            'razorpay_key_id' => config('services.razorpay.key_id'),
            'recaptcha' => [
                'site_key' => config('recaptcha.site_key'),
                'enabled' => config('recaptcha.enabled', true),
            ],
        ];
    }
}
