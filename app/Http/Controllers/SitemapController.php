<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate XML sitemap
     */
    public function index(): Response
    {
        $sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
        $sitemap .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Homepage
        $sitemap .= $this->addUrl(route('home'), now(), 'daily', '1.0');

        // Departments page
        $sitemap .= $this->addUrl(route('departments'), now(), 'weekly', '0.8');

        // Services page
        $sitemap .= $this->addUrl(route('services'), now(), 'weekly', '0.8');

        // Doctors listing page
        $sitemap .= $this->addUrl(route('doctors.index'), now(), 'daily', '0.9');

        // About page
        $sitemap .= $this->addUrl(route('about'), now(), 'monthly', '0.7');

        // FAQ page
        $sitemap .= $this->addUrl(route('faq'), now(), 'monthly', '0.7');

        // Testimonials page
        $sitemap .= $this->addUrl(route('testimonials'), now(), 'monthly', '0.7');

        // Terms page
        $sitemap .= $this->addUrl(route('terms'), now(), 'monthly', '0.7');

        // Privacy page
        $sitemap .= $this->addUrl(route('privacy'), now(), 'monthly', '0.7');

        // Contact page
        $sitemap .= $this->addUrl(route('contact'), now(), 'monthly', '0.7');

        // Doctor profiles
        $doctors = DoctorProfile::with('user')
            ->verified()
            ->active()
            ->whereNotNull('slug')
            ->get();

        foreach ($doctors as $doctor) {
            $sitemap .= $this->addUrl(
                route('doctors.show', $doctor->slug),
                $doctor->updated_at,
                'weekly',
                '0.8'
            );
        }

        // Cities (if you add city pages in the future)
        $cities = City::active()->get();
        foreach ($cities as $city) {
            // Commented out until city detail pages are implemented
            // $sitemap .= $this->addUrl(route('city.show', $city->slug), $city->updated_at, 'weekly', '0.6');
        }

        // Department detail pages
        $specialties = Specialty::active()->get();
        foreach ($specialties as $specialty) {
            $sitemap .= $this->addUrl(
                route('departments.show', $specialty->slug ?: $specialty->id),
                $specialty->updated_at,
                'weekly',
                '0.6'
            );
        }

        // Service detail pages
        if (\Illuminate\Support\Facades\Schema::hasTable('home_services')) {
            $services = \App\Models\HomeService::query()->active()->get();
            foreach ($services as $service) {
                $sitemap .= $this->addUrl(
                    route('services.show', $service->code ?: $service->id),
                    $service->updated_at,
                    'weekly',
                    '0.6'
                );
            }
        }

        $sitemap .= '</urlset>';

        return response($sitemap, 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Add URL to sitemap
     */
    private function addUrl($loc, $lastmod = null, $changefreq = 'monthly', $priority = '0.5'): string
    {
        $url = '<url>';
        $url .= '<loc>' . htmlspecialchars($loc) . '</loc>';
        
        if ($lastmod) {
            $url .= '<lastmod>' . $lastmod->format('Y-m-d') . '</lastmod>';
        }
        
        $url .= '<changefreq>' . $changefreq . '</changefreq>';
        $url .= '<priority>' . $priority . '</priority>';
        $url .= '</url>';
        
        return $url;
    }
}
