<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use App\Http\Requests\StoreAdvertisementRequest;
use App\Http\Requests\UpdateAdvertisementRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdvertisementController extends Controller
{
    /**
     * Display advertisements list
     */
    public function index(): Response
    {
        $advertisements = Advertisement::orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn($ad) => [
                'id' => $ad->id,
                'title' => $ad->title,
                'image' => $ad->image ? Storage::url($ad->image) : null,
                'link' => $ad->link,
                'position' => $ad->position,
                'start_date' => $ad->start_date->format('Y-m-d'),
                'end_date' => $ad->end_date?->format('Y-m-d'),
                'is_active' => $ad->is_active,
                'click_count' => $ad->click_count,
            ]);

        return Inertia::render('Admin/Advertisements/Index', [
            'advertisements' => $advertisements,
        ]);
    }

    /**
     * Show create form
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Advertisements/Create');
    }

    /**
     * Store new advertisement
     */
    public function store(StoreAdvertisementRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('advertisements', 'public');
        }

        Advertisement::create($data);

        return redirect()->route('admin.advertisements.index')
            ->with('success', 'Advertisement created successfully!');
    }

    /**
     * Show edit form
     */
    public function edit(Advertisement $advertisement): Response
    {
        return Inertia::render('Admin/Advertisements/Edit', [
            'advertisement' => [
                'id' => $advertisement->id,
                'title' => $advertisement->title,
                'image' => $advertisement->image ? Storage::url($advertisement->image) : null,
                'link' => $advertisement->link,
                'position' => $advertisement->position,
                'start_date' => $advertisement->start_date->format('Y-m-d'),
                'end_date' => $advertisement->end_date?->format('Y-m-d'),
                'is_active' => $advertisement->is_active,
            ],
        ]);
    }

    /**
     * Update advertisement
     */
    public function update(UpdateAdvertisementRequest $request, Advertisement $advertisement): RedirectResponse
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($advertisement->image) {
                Storage::disk('public')->delete($advertisement->image);
            }
            $data['image'] = $request->file('image')->store('advertisements', 'public');
        }

        $advertisement->update($data);

        return redirect()->route('admin.advertisements.index')
            ->with('success', 'Advertisement updated successfully!');
    }

    /**
     * Delete advertisement
     */
    public function destroy(Advertisement $advertisement): RedirectResponse
    {
        // Delete image
        if ($advertisement->image) {
            Storage::disk('public')->delete($advertisement->image);
        }

        $advertisement->delete();

        return back()->with('success', 'Advertisement deleted successfully!');
    }
}
