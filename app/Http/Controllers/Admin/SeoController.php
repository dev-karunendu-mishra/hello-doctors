<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeoController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::where('group', 'seo')
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        return Inertia::render('Admin/Seo/Index', [
            'settings' => array_merge([
                'meta_title' => 'Hello Doctors - Find Best Doctors Near You',
                'meta_description' => 'Connect with verified healthcare professionals across multiple cities. Find the best doctors near you.',
                'meta_keywords' => 'doctors, healthcare, medical professionals, find doctors, appointments',
                'meta_author' => 'Hello Doctors',
                'og_title' => 'Hello Doctors',
                'og_description' => 'Connect with verified healthcare professionals',
                'og_image' => null,
                'twitter_card' => 'summary_large_image',
                'twitter_site' => '@hellodoctors',
                'google_analytics_id' => '',
                'google_site_verification' => '',
                'facebook_pixel_id' => '',
                'robots_txt' => "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /",
                'sitemap_url' => '/sitemap.xml',
            ], $settings),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            SiteSetting::set($key, $value, 'text', 'seo');
        }

        return redirect()->back()->with('success', 'SEO settings updated successfully');
    }
}
