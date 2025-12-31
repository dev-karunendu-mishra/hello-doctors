<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    /**
     * Display about page
     */
    public function index(): Response
    {
        return Inertia::render('Public/About', [
            'stats' => [
                'doctors' => \App\Models\DoctorProfile::verified()->count(),
                'cities' => \App\Models\City::active()->count(),
                'specialties' => \App\Models\Specialty::active()->count(),
                'years' => 10, // Years in operation
            ],
        ]);
    }
}
