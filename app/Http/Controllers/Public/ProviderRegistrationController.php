<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\HomeService;
use App\Models\HomeServiceProvider;
use App\Models\HomeServiceProviderService;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class ProviderRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/RegisterProvider', [
            'cities'   => City::active()->orderBy('name')->get(['id', 'name']),
            'services' => HomeService::active()->with('category:id,name')->orderBy('name')->get(['id', 'name', 'category_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'phone'                 => ['required', 'string', 'max:20'],
            'password'              => ['required', 'confirmed', Rules\Password::defaults()],
            'provider_type'         => ['required', 'in:nurse,attendant,lab_tech,field_exec'],
            'city_id'               => ['required', 'integer', 'exists:cities,id'],
            'license_number'        => ['nullable', 'string', 'max:100'],
            'experience_years'      => ['nullable', 'integer', 'min:0', 'max:50'],
            'service_radius_km'     => ['nullable', 'numeric', 'min:0', 'max:500'],
            'service_ids'           => ['nullable', 'array'],
            'service_ids.*'         => ['integer', 'exists:home_services,id'],
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'phone'     => $request->phone,
                'password'  => Hash::make($request->password),
                'role'      => 'home_service_provider',
                'is_active' => true,
            ]);

            $provider = HomeServiceProvider::create([
                'user_id'           => $user->id,
                'provider_type'     => $request->provider_type,
                'city_id'           => $request->city_id,
                'license_number'    => $request->license_number,
                'experience_years'  => $request->experience_years ?? 0,
                'service_radius_km' => $request->service_radius_km,
                'is_verified'       => false,
                'is_active'         => false,
            ]);

            if ($request->filled('service_ids')) {
                foreach ($request->service_ids as $serviceId) {
                    HomeServiceProviderService::create([
                        'provider_id'     => $provider->id,
                        'home_service_id' => $serviceId,
                        'is_active'       => true,
                    ]);
                }
            }

            DB::commit();

            event(new Registered($user));
            Auth::login($user);

            return redirect()->route('provider.home-services.profile');
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
