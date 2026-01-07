<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\DoctorProfile;
use App\Models\DoctorWorkingHour;
use App\Models\SearchTag;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OldDataSeeder extends Seeder
{
    private array $cityMapping = [];
    private array $specialtyMapping = [];
    private int $processedDoctors = 0;
    private int $failedDoctors = 0;

    public function run(): void
    {
        $this->command->info('Starting migration of old doctor data...');

        // Load mappings
        $this->loadCityMapping();
        $this->loadSpecialtyMapping();

        // Define database to city mapping from old app
        $databases = [
            'hellodoc_agra' => 'Agra',
            'hellodoc_tutorial' => 'Allahabad', // Allahabad uses tutorial database
            'hellodoc_deoria' => 'Deoria',
            'hellodoc_gorakhpur' => 'Gorakhpur',
            'hellodoc_kanpur' => 'Kanpur',
            'hellodoc_lucknow' => 'Lucknow',
            'hellodoc_mirzapur' => 'Mirzapur',
            'hellodoc_varanasi' => 'Varanasi',
        ];

        // Get SQL file path
        $sqlFilePath = base_path('hello-doctors.sql');

        if (!file_exists($sqlFilePath)) {
            $this->command->error("SQL file not found at: {$sqlFilePath}");
            $this->command->info("Please ensure 'hello-doctors.sql' is in the project root directory.");
            return;
        }

        $this->command->info("Reading SQL file: {$sqlFilePath}");
        $this->command->info("File size: " . number_format(filesize($sqlFilePath) / 1024 / 1024, 2) . " MB");

        // Parse and import data from SQL file
        $this->parseSqlFile($sqlFilePath, $databases);

        $this->command->info("\n" . str_repeat('=', 60));
        $this->command->info("Migration completed!");
        $this->command->info("Successfully processed: {$this->processedDoctors} doctors");
        $this->command->info("Failed: {$this->failedDoctors} doctors");
        $this->command->info(str_repeat('=', 60));
    }

    /**
     * Load city ID mapping
     */
    private function loadCityMapping(): void
    {
        $cities = City::all();
        foreach ($cities as $city) {
            $this->cityMapping[strtolower($city->name)] = $city->id;
        }
        $this->command->info("Loaded " . count($this->cityMapping) . " cities");
    }

    /**
     * Load specialty mapping with fuzzy matching
     */
    private function loadSpecialtyMapping(): void
    {
        $specialties = Specialty::all();
        foreach ($specialties as $specialty) {
            $key = strtolower($specialty->name);
            $this->specialtyMapping[$key] = $specialty->id;
            
            // Add common variations
            $variations = [
                'dermatologist' => ['skin specialist', 'dermatology'],
                'ent surgeon' => ['ent', 'ear nose throat', 'otolaryngologist'],
                'orthopedic' => ['orthopedist', 'orthopaedic', 'bone specialist'],
                'nephrologist' => ['kidney specialist', 'nephrology'],
                'pediatric' => ['pediatrician', 'child specialist', 'paediatrician'],
                'neurologist' => ['neuro', 'brain specialist', 'neurology'],
                'anesthesiologist' => ['anaesthetist', 'anesthesia'],
                'dentist' => ['dental surgeon', 'dental', 'orthodontist'],
                'general physician' => ['physician', 'general doctor', 'md'],
                'gynecologist' => ['gynaecologist', 'obstetrician', 'obs & gynae'],
                'ophthalmologist' => ['eye specialist', 'eye doctor', 'ophthalmology'],
                'cardiologist' => ['heart specialist', 'cardiology'],
                'psychiatrist' => ['mental health', 'psychiatry'],
                'gastroenterologist' => ['gastro', 'stomach specialist'],
                'urologist' => ['uro', 'urology'],
                'pulmonologist' => ['chest specialist', 'lung specialist'],
            ];

            if (isset($variations[$key])) {
                foreach ($variations[$key] as $variation) {
                    $this->specialtyMapping[strtolower($variation)] = $specialty->id;
                }
            }
        }
        $this->command->info("Loaded " . count($specialties) . " specialties with variations");
    }

    /**
     * Parse SQL file and extract doctor data
     */
    private function parseSqlFile(string $filePath, array $databases): void
    {
        $currentDatabase = null;
        $currentCity = null;
        $inInsert = false;
        $insertBuffer = '';
        $totalLines = 0;

        // Open file for reading
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->command->error("Could not open SQL file");
            return;
        }

        $progressBar = $this->command->getOutput()->createProgressBar();
        $progressBar->setFormat('Processing: %current% lines | Doctors: ' . $this->processedDoctors . ' | Failed: ' . $this->failedDoctors);

        while (($line = fgets($handle)) !== false) {
            $totalLines++;
            $line = trim($line);

            // Update progress every 1000 lines
            if ($totalLines % 1000 === 0) {
                $progressBar->setFormat('Processing: %current% lines | Doctors: ' . $this->processedDoctors . ' | Failed: ' . $this->failedDoctors);
                $progressBar->advance(1000);
            }

            // Detect database switch
            if (preg_match('/USE `(hellodoc_[a-z]+)`/i', $line, $matches)) {
                $currentDatabase = $matches[1];
                $currentCity = $databases[$currentDatabase] ?? null;
                
                if ($currentCity) {
                    $this->command->newLine(2);
                    $this->command->info("Processing city: {$currentCity} (DB: {$currentDatabase})");
                }
                continue;
            }

            // Detect INSERT INTO search statements
            if (preg_match('/INSERT INTO `search`/i', $line)) {
                $inInsert = true;
                $insertBuffer = $line;
                continue;
            }

            // Continue collecting insert statement
            if ($inInsert) {
                $insertBuffer .= ' ' . $line;

                // Check if statement is complete (ends with semicolon)
                if (preg_match('/;$/', $line)) {
                    $inInsert = false;
                    
                    if ($currentCity) {
                        $this->processInsertStatement($insertBuffer, $currentCity);
                    }
                    
                    $insertBuffer = '';
                }
            }
        }

        fclose($handle);
        $progressBar->finish();
        $this->command->newLine(2);
    }

    /**
     * Process INSERT statement and extract doctor records
     */
    private function processInsertStatement(string $statement, string $cityName): void
    {
        // Extract column names
        if (!preg_match('/INSERT INTO `search` \((.*?)\) VALUES/i', $statement, $colMatches)) {
            return;
        }

        $columns = array_map('trim', explode(',', str_replace('`', '', $colMatches[1])));

        // Extract all value sets
        preg_match_all('/\(((?:[^()]++|\((?:[^()]++|\([^()]*+\))*+\))*+)\)/i', $statement, $valueMatches);

        foreach ($valueMatches[1] as $valueSet) {
            $values = $this->parseValueSet($valueSet);
            
            if (count($values) === count($columns)) {
                $doctorData = array_combine($columns, $values);
                $this->createDoctor($doctorData, $cityName);
            }
        }
    }

    /**
     * Parse value set from SQL INSERT
     */
    private function parseValueSet(string $valueSet): array
    {
        $values = [];
        $current = '';
        $inString = false;
        $escapeNext = false;
        $parenDepth = 0;

        for ($i = 0; $i < strlen($valueSet); $i++) {
            $char = $valueSet[$i];

            if ($escapeNext) {
                $current .= $char;
                $escapeNext = false;
                continue;
            }

            if ($char === '\\') {
                $escapeNext = true;
                continue;
            }

            if ($char === "'" && $parenDepth === 0) {
                $inString = !$inString;
                continue;
            }

            if (!$inString) {
                if ($char === '(') {
                    $parenDepth++;
                } elseif ($char === ')') {
                    $parenDepth--;
                } elseif ($char === ',' && $parenDepth === 0) {
                    $values[] = $this->cleanValue($current);
                    $current = '';
                    continue;
                }
            }

            $current .= $char;
        }

        if ($current !== '') {
            $values[] = $this->cleanValue($current);
        }

        return $values;
    }

    /**
     * Clean extracted value
     */
    private function cleanValue(string $value): string
    {
        $value = trim($value);
        
        // Handle NULL
        if (strtoupper($value) === 'NULL') {
            return '';
        }

        // Remove escaped quotes
        $value = str_replace(["\\'", '\\"'], ["'", '"'], $value);
        
        return $value;
    }

    /**
     * Create doctor profile from extracted data
     */
    private function createDoctor(array $data, string $cityName): void
    {
        DB::beginTransaction();

        try {
            // Extract fields
            $title = $data['title'] ?? '';
            $department = $data['department'] ?? '';
            $description = $data['description'] ?? '';
            $phone = $data['phone'] ?? '';
            $email = $data['email'] ?? '';
            $address = $data['address'] ?? '';
            $timing = $data['timing'] ?? '';
            $keyword = $data['keyword'] ?? '';
            $link = $data['link'] ?? '';
            $image = $data['image'] ?? '';

            // Validate required fields
            if (empty($title) || empty($department)) {
                $this->failedDoctors++;
                DB::rollBack();
                return;
            }

            // Find or map specialty
            $specialtyId = $this->findSpecialtyId($department);

            // Generate unique email if not provided
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $email = Str::slug($title) . '_' . Str::slug($cityName) . '_' . time() . '@hellodoctors.com';
            }

            // Check if user already exists by email
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Create user
                $user = User::create([
                    'name' => $title,
                    'email' => $email,
                    'password' => Hash::make('password123'), // Default password
                    'role' => 'doctor',
                    'phone' => $this->cleanPhone($phone),
                    'address' => $address,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            }

            // Create or get doctor profile
            $doctorProfile = DoctorProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'specialization_id' => $specialtyId,
                    'bio' => $description,
                    'website' => $link ?: null,
                    'is_verified' => true,
                    'is_available_online' => false,
                ]
            );

            // Handle image (convert BLOB to file if exists)
            if (!empty($image) && $image !== '0x') {
                $this->handleDoctorImage($doctorProfile, $image, $title);
            }

            // Associate with city
            $cityId = $this->cityMapping[strtolower($cityName)] ?? null;
            if ($cityId) {
                $doctorProfile->cities()->syncWithoutDetaching([
                    $cityId => [
                        'address' => $address,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                ]);
            }

            // Create working hours
            if (!empty($timing)) {
                DoctorWorkingHour::firstOrCreate(
                    [
                        'doctor_profile_id' => $doctorProfile->id,
                        'city_id' => $cityId,
                    ],
                    [
                        'timing_text' => $timing,
                        'is_available' => true,
                    ]
                );
            }

            // Create search tags
            $tags = $this->generateSearchTags($title, $department, $description, $keyword);
            SearchTag::updateOrCreate(
                [
                    'taggable_type' => DoctorProfile::class,
                    'taggable_id' => $doctorProfile->id,
                ],
                ['tags' => $tags]
            );

            DB::commit();
            $this->processedDoctors++;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->failedDoctors++;
            Log::error("Failed to create doctor: " . $e->getMessage(), [
                'data' => $data,
                'city' => $cityName,
            ]);
        }
    }

    /**
     * Find specialty ID by department name
     */
    private function findSpecialtyId(string $department): ?int
    {
        $key = strtolower(trim($department));
        
        // Direct match
        if (isset($this->specialtyMapping[$key])) {
            return $this->specialtyMapping[$key];
        }

        // Fuzzy match - find closest
        foreach ($this->specialtyMapping as $specialty => $id) {
            if (stripos($key, $specialty) !== false || stripos($specialty, $key) !== false) {
                return $id;
            }
        }

        return null; // Return null if no match
    }

    /**
     * Clean phone number
     */
    private function cleanPhone(string $phone): string
    {
        // Remove all non-numeric characters except + and spaces
        $phone = preg_replace('/[^0-9+\s]/', '', $phone);
        return substr(trim($phone), 0, 20);
    }

    /**
     * Handle doctor image from BLOB
     */
    private function handleDoctorImage(DoctorProfile $doctorProfile, string $imageData, string $doctorName): void
    {
        try {
            // Skip if it's a hex placeholder
            if (strlen($imageData) < 100) {
                return;
            }

            // Remove 0x prefix if present
            if (substr($imageData, 0, 2) === '0x') {
                $imageData = substr($imageData, 2);
            }

            // Convert hex to binary if it's hex encoded
            if (ctype_xdigit($imageData)) {
                $imageData = hex2bin($imageData);
            }

            if (!$imageData) {
                return;
            }

            // Create filename
            $filename = 'doctors/' . Str::slug($doctorName) . '_' . uniqid() . '.jpg';

            // Store image
            Storage::disk('public')->put($filename, $imageData);

            // Update doctor profile
            $doctorProfile->update(['profile_image' => $filename]);

        } catch (\Exception $e) {
            Log::warning("Failed to process doctor image: " . $e->getMessage());
        }
    }

    /**
     * Generate searchable tags
     */
    private function generateSearchTags(string $title, string $department, string $description, string $keyword): string
    {
        $tags = [];

        // Add title words
        $titleWords = explode(' ', strtolower($title));
        $tags = array_merge($tags, $titleWords);

        // Add department
        $tags[] = strtolower($department);

        // Add keywords
        if (!empty($keyword)) {
            $keywordWords = explode(',', strtolower($keyword));
            $keywordWords = array_map('trim', $keywordWords);
            $tags = array_merge($tags, $keywordWords);
        }

        // Add description words (first 50 words only)
        $descWords = explode(' ', strtolower($description));
        $descWords = array_slice($descWords, 0, 50);
        $tags = array_merge($tags, $descWords);

        // Remove duplicates and empty values
        $tags = array_unique(array_filter($tags));

        return implode(' ', $tags);
    }
}
