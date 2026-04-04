<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SiteCustomizationController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::whereIn('group', ['general', 'appearance', 'contact'])
            ->get()
            ->groupBy('group');

        // Define default structure if settings don't exist
        $generalSettings = $settings->get('general', collect())->pluck('value', 'key')->toArray();
        $appearanceSettings = $settings->get('appearance', collect())->pluck('value', 'key')->toArray();
        $contactSettings = $settings->get('contact', collect())->pluck('value', 'key')->toArray();

        return Inertia::render('Admin/SiteCustomization/Index', [
            'settings' => [
                'general' => array_merge([
                    'site_name' => 'Hello Doctors',
                    'site_tagline' => 'Find the Best Doctors Near You',
                    'site_description' => 'Connect with verified healthcare professionals',
                    'site_logo' => null,
                    'site_favicon' => null,
                ], $generalSettings),
                'appearance' => array_merge([
                    'primary_color' => '#1890ff',
                    'secondary_color' => '#52c41a',
                    'hero_title' => 'Find the Best Doctors Near You',
                    'hero_subtitle' => 'Connect with verified healthcare professionals across multiple cities',
                    'hero_background' => null,
                ], $appearanceSettings),
                'contact' => array_merge([
                    'contact_email' => 'support@hellodoctors.in',
                    'contact_secondary_email' => 'contact@hellodoctors.in',
                    'contact_phone' => '+91 (555) 123-4567',
                    'contact_address' => 'Healthcare Network, Uttar Pradesh, India',
                    'contact_hours_weekdays' => 'Monday-Friday: 9 AM - 6 PM',
                    'contact_hours_weekend' => 'Saturday: 9 AM - 4 PM',
                    'map_embed_url' => 'https://www.google.com/maps?q=Prayagraj%2C%20Uttar%20Pradesh&z=10&output=embed',
                    'facebook_url' => '',
                    'twitter_url' => '',
                    'linkedin_url' => '',
                    'instagram_url' => '',
                    'youtube_url' => '',
                ], $contactSettings),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'group' => 'required|string',
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            SiteSetting::set($key, $value, 'text', $validated['group']);
        }

        return redirect()->back()->with('success', 'Settings updated successfully');
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,jpg,gif,svg,webp,ico|max:4096',
            'key' => 'required|string',
            'group' => 'required|string',
        ]);

        $file = $request->file('image');
        $path = $file->store('site-images', 'public');
        $url = Storage::url($path);

        SiteSetting::set($request->key, $url, 'image', $request->group);

        return response()->json([
            'success' => true,
            'url' => $url,
            'message' => 'Image uploaded successfully.',
        ]);
    }
}
