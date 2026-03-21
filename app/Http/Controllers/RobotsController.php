<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    /**
     * Generate dynamic robots.txt
     */
    public function index(): Response
    {
        $robotsTxt = SiteSetting::get('robots_txt', $this->getDefaultRobotsTxt());

        return response($robotsTxt, 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * Get default robots.txt content
     */
    private function getDefaultRobotsTxt(): string
    {
        return "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /\n\nSitemap: " . route('sitemap');
    }
}
