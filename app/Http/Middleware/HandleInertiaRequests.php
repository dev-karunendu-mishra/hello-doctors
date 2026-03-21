<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
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
        // Get SEO settings from database (with caching)
        $seoSettings = cache()->remember('seo_settings', 3600, function () {
            return SiteSetting::where('group', 'seo')
                ->get()
                ->pluck('value', 'key')
                ->toArray();
        });

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'seo' => [
                'meta_title' => $seoSettings['meta_title'] ?? config('app.name', 'Hello Doctors'),
                'meta_description' => $seoSettings['meta_description'] ?? 'Find the best doctors and healthcare professionals',
                'meta_keywords' => $seoSettings['meta_keywords'] ?? 'doctors, healthcare, medical',
                'meta_author' => $seoSettings['meta_author'] ?? config('app.name'),
                'og_title' => $seoSettings['og_title'] ?? config('app.name'),
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
        ];
    }
}
