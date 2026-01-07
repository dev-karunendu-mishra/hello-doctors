<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SpecialtyManagementController extends Controller
{
    /**
     * Display specialties list
     */
    public function index(Request $request): Response
    {
        $query = Specialty::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $specialties = $query->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn($specialty) => [
                'id' => $specialty->id,
                'name' => $specialty->name,
                'slug' => $specialty->slug,
                'icon' => $specialty->icon,
                'image_path' => $specialty->image_path,
                'description' => $specialty->description,
                'is_active' => $specialty->is_active,
                'sort_order' => $specialty->sort_order,
                'doctors_count' => $specialty->doctors()->count(),
                'created_at' => $specialty->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Admin/Specialties/Index', [
            'specialties' => $specialties,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show create form
     */
    public function create(): Response
    {
        $existingImages = $this->getExistingImages();
        
        // Debug
        \Log::info('Existing Images Count: ' . count($existingImages));
        if (count($existingImages) > 0) {
            \Log::info('First Image: ' . json_encode($existingImages[0]));
        }
        
        return Inertia::render('Admin/Specialties/Create', [
            'existingImages' => $existingImages,
        ]);
    }

    /**
     * Store new specialty
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name',
            'icon' => 'nullable|string|max:255',
            'image_path' => 'nullable|string|max:500',
            'image_file' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Handle file upload
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = time() . '_' . preg_replace('/[^A-Za-z0-9_.-]/', '_', $file->getClientOriginalName());
            $file->move(public_path('images/specialties'), $filename);
            $validated['image_path'] = 'images/specialties/' . $filename;
            unset($validated['image_file']);
        }

        $validated['slug'] = Str::slug($validated['name']);

        Specialty::create($validated);

        return redirect()->route('admin.specialties.index')
            ->with('success', 'Specialty created successfully!');
    }

    /**
     * Show specialty details
     */
    public function show(Specialty $specialty): Response
    {
        $specialty->load('doctors.user');

        return Inertia::render('Admin/Specialties/Show', [
            'specialty' => [
                'id' => $specialty->id,
                'name' => $specialty->name,
                'slug' => $specialty->slug,
                'icon' => $specialty->icon,
                'image_path' => $specialty->image_path,
                'description' => $specialty->description,
                'is_active' => $specialty->is_active,
                'sort_order' => $specialty->sort_order,
                'doctors_count' => $specialty->doctors->count(),
                'created_at' => $specialty->created_at->format('Y-m-d H:i'),
                'updated_at' => $specialty->updated_at->format('Y-m-d H:i'),
                'doctors' => $specialty->doctors->take(10)->map(fn($doctor) => [
                    'id' => $doctor->id,
                    'name' => $doctor->user->name,
                    'email' => $doctor->user->email,
                ]),
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Specialty $specialty): Response
    {
        $existingImages = $this->getExistingImages();
        
        return Inertia::render('Admin/Specialties/Edit', [
            'specialty' => [
                'id' => $specialty->id,
                'name' => $specialty->name,
                'slug' => $specialty->slug,
                'icon' => $specialty->icon,
                'image_path' => $specialty->image_path,
                'description' => $specialty->description,
                'is_active' => $specialty->is_active,
                'sort_order' => $specialty->sort_order,
            ],
            'existingImages' => $existingImages,
        ]);
    }

    /**
     * Update specialty
     */
    public function update(Request $request, Specialty $specialty): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name,' . $specialty->id,
            'icon' => 'nullable|string|max:255',
            'image_path' => 'nullable|string|max:500',
            'image_file' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // Handle file upload
        if ($request->hasFile('image_file')) {
            // Delete old image if it exists and is a custom upload
            if ($specialty->image_path && file_exists(public_path($specialty->image_path))) {
                $filename = basename($specialty->image_path);
                // Only delete if it's a timestamped file (custom upload)
                if (preg_match('/^\d+_/', $filename)) {
                    @unlink(public_path($specialty->image_path));
                }
            }
            
            $file = $request->file('image_file');
            $filename = time() . '_' . preg_replace('/[^A-Za-z0-9_.-]/', '_', $file->getClientOriginalName());
            $file->move(public_path('images/specialties'), $filename);
            $validated['image_path'] = 'images/specialties/' . $filename;
            unset($validated['image_file']);
        }

        // Update slug if name changed
        if ($validated['name'] !== $specialty->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $specialty->update($validated);

        return redirect()->route('admin.specialties.index')
            ->with('success', 'Specialty updated successfully!');
    }

    /**
     * Delete specialty
     */
    public function destroy(Specialty $specialty): RedirectResponse
    {
        // Check if specialty has doctors
        if ($specialty->doctors()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete specialty that has doctors assigned. Please reassign doctors first.'
            ]);
        }

        $specialty->delete();

        return redirect()->route('admin.specialties.index')
            ->with('success', 'Specialty deleted successfully!');
    }

    /**
     * Get list of existing images from specialties folder
     */
    private function getExistingImages(): array
    {
        $imagesPath = public_path('images/specialties');
        
        if (!is_dir($imagesPath)) {
            return [];
        }
        
        $files = array_diff(scandir($imagesPath), ['.', '..']);
        $images = [];
        
        foreach ($files as $file) {
            $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                $images[] = [
                    'name' => $file,
                    'path' => 'images/specialties/' . $file,
                    'url' => asset('images/specialties/' . $file),
                ];
            }
        }
        
        // Sort alphabetically
        usort($images, fn($a, $b) => strcmp($a['name'], $b['name']));
        
        return $images;
    }
}
