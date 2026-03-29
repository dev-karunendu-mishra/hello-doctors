<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\HomeService;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    public function cities(): JsonResponse
    {
        $cities = City::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return response()->json(['data' => $cities]);
    }

    public function specialties(): JsonResponse
    {
        $specialties = Specialty::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return response()->json(['data' => $specialties]);
    }

    public function homeServices(): JsonResponse
    {
        $services = HomeService::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $services]);
    }
}
