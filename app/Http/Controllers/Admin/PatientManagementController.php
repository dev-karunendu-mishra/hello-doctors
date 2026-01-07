<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatientManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $patients = User::where('role', 'patient')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Patients/Index', [
            'patients' => $patients,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Patients/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $validated['role'] = 'patient';
        $validated['is_active'] = $request->boolean('is_active', true);

        User::create($validated);

        return redirect()->route('admin.patients.index')
            ->with('success', 'Patient created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $patient)
    {
        if ($patient->role !== 'patient') {
            abort(404);
        }
        
        return Inertia::render('Admin/Patients/Show', [
            'patient' => $patient,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $patient)
    {
        if ($patient->role !== 'patient') {
            abort(404);
        }
        
        return Inertia::render('Admin/Patients/Edit', [
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $patient)
    {
        if ($patient->role !== 'patient') {
            abort(404);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $patient->id,
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active', $patient->is_active);

        $patient->update($validated);

        return redirect()->route('admin.patients.index')
            ->with('success', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $patient)
    {
        if ($patient->role !== 'patient') {
            abort(404);
        }
        
        $patient->delete();

        return redirect()->route('admin.patients.index')
            ->with('success', 'Patient deleted successfully.');
    }
}
