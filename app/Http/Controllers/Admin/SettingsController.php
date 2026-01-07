<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display settings page
     */
    public function index()
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
            ],
        ]);
    }
}
