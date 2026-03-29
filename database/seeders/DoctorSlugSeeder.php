<?php

namespace Database\Seeders;

use App\Models\DoctorProfile;
use Illuminate\Database\Seeder;

class DoctorSlugSeeder extends Seeder
{
    /**
     * Generate missing slugs for doctor profiles.
     */
    public function run(): void
    {
        $updated = 0;

        DoctorProfile::with('user')
            ->where(function ($query) {
                $query->whereNull('slug')->orWhere('slug', '');
            })
            ->chunkById(200, function ($profiles) use (&$updated) {
                foreach ($profiles as $profile) {
                    $name = $profile->user?->name;

                    if (empty($name)) {
                        continue;
                    }

                    $profile->slug = DoctorProfile::generateUniqueSlug($name, $profile->id);
                    $profile->save();
                    $updated++;
                }
            });

        $this->command?->info("Doctor slug seeding completed. Updated {$updated} profiles.");
    }
}
