<?php

namespace Tests\Feature;

use Tests\TestCase;

class PublicNotFoundPageTest extends TestCase
{
    public function test_missing_public_route_shows_clinic_style_404_page(): void
    {
        $response = $this->get('/this-route-should-not-exist-404-check');

        $response->assertStatus(404);
        $response->assertSee('Page Not Found');
        $response->assertSee('Back to Home');
        $response->assertSee('Browse Doctors');
    }
}
