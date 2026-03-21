<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SeoController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::where('group', 'seo')
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        $defaultSettings = [
            'meta_title' => 'Hello Doctors - Find Best Doctors Near You',
            'meta_description' => 'Connect with verified healthcare professionals across multiple cities. Find the best doctors near you.',
            'meta_keywords' => 'doctors, healthcare, medical professionals, find doctors, appointments',
            'meta_author' => 'Hello Doctors',
            'og_title' => 'Hello Doctors',
            'og_description' => 'Connect with verified healthcare professionals',
            'og_image' => '',
            'twitter_card' => 'summary_large_image',
            'twitter_site' => '@hellodoctors',
            'google_analytics_id' => '',
            'google_site_verification' => '',
            'facebook_pixel_id' => '',
            'robots_txt' => "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /",
            'sitemap_url' => '/sitemap.xml',
        ];

        return Inertia::render('Admin/Seo/Index', [
            'settings' => array_merge($defaultSettings, $settings),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        // Log incoming data for debugging
        Log::info('SEO Settings Update Request', [
            'data' => $validated['settings']
        ]);

        try {
            foreach ($validated['settings'] as $key => $value) {
                SiteSetting::set($key, $value ?? '', 'text', 'seo');
                Log::info("Saved SEO setting: {$key} = {$value}");
            }

            // Clear cache to reflect new settings
            cache()->forget('seo_settings');
            Artisan::call('cache:clear');

            Log::info('SEO settings updated successfully');

            return back()->with('success', 'SEO settings updated successfully');
        } catch (\Exception $e) {
            Log::error('SEO settings update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Failed to update SEO settings: ' . $e->getMessage()]);
        }
    }
}
