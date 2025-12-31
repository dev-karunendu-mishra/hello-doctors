<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateOldData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:old-data 
                            {--fresh : Drop all tables and re-run all migrations}
                            {--force : Force the operation to run in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate doctor data from old PHP application to Laravel';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('╔════════════════════════════════════════════════╗');
        $this->info('║  Hello Doctors - Data Migration Tool          ║');
        $this->info('╚════════════════════════════════════════════════╝');
        $this->newLine();

        // Check if SQL file exists
        $sqlFile = base_path('hello-doctors.sql');
        if (!file_exists($sqlFile)) {
            $this->error('❌ SQL file not found!');
            $this->warn('Please place "hello-doctors.sql" in the project root directory.');
            $this->info('Expected location: ' . $sqlFile);
            return Command::FAILURE;
        }

        $this->info('✓ SQL file found: ' . number_format(filesize($sqlFile) / 1024 / 1024, 2) . ' MB');
        $this->newLine();

        // Confirm in production
        if ($this->laravel->environment('production') && !$this->option('force')) {
            $this->error('❌ This command is running in PRODUCTION environment!');
            
            if (!$this->confirm('Are you sure you want to continue?', false)) {
                $this->info('Operation cancelled.');
                return Command::FAILURE;
            }
        }

        // Confirm fresh migration
        if ($this->option('fresh')) {
            $this->warn('⚠️  This will DROP ALL TABLES and start fresh!');
            
            if (!$this->confirm('Are you absolutely sure?', false)) {
                $this->info('Operation cancelled.');
                return Command::FAILURE;
            }
        }

        $startTime = microtime(true);

        try {
            // Step 1: Run migrations
            $this->info('Step 1: Running migrations...');
            
            if ($this->option('fresh')) {
                Artisan::call('migrate:fresh', ['--force' => true]);
                $this->info('✓ Fresh migrations completed');
            } else {
                Artisan::call('migrate', ['--force' => true]);
                $this->info('✓ Migrations completed');
            }
            
            $this->newLine();

            // Step 2: Seed data
            $this->info('Step 2: Seeding database...');
            $this->warn('This may take several minutes. Please be patient...');
            $this->newLine();

            Artisan::call('db:seed', [
                '--class' => 'Database\\Seeders\\DatabaseSeeder',
                '--force' => true
            ], $this->getOutput());

            $this->newLine(2);

            // Calculate time
            $endTime = microtime(true);
            $duration = round($endTime - $startTime, 2);

            // Success message
            $this->info('╔════════════════════════════════════════════════╗');
            $this->info('║  ✓ Migration Completed Successfully!          ║');
            $this->info('╚════════════════════════════════════════════════╝');
            $this->newLine();
            $this->info("Duration: {$duration} seconds");
            $this->newLine();

            // Show statistics
            $this->showStatistics();

            // Next steps
            $this->newLine();
            $this->info('Next Steps:');
            $this->line('1. Review migrated data in the database');
            $this->line('2. Test search functionality');
            $this->line('3. Verify doctor profiles and images');
            $this->line('4. Update doctor passwords (default: password123)');
            $this->line('5. Configure email notifications');
            $this->newLine();

            $this->info('Login Credentials:');
            $this->line('Admin: admin@hellodoctors.com / admin123');
            $this->line('Doctors: (email from SQL) / password123');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Migration failed!');
            $this->error($e->getMessage());
            $this->newLine();
            $this->warn('Check logs for more details: storage/logs/laravel.log');
            
            return Command::FAILURE;
        }
    }

    /**
     * Show migration statistics
     */
    private function showStatistics(): void
    {
        $this->info('Statistics:');
        
        try {
            $cities = \App\Models\City::count();
            $specialties = \App\Models\Specialty::count();
            $doctors = \App\Models\DoctorProfile::count();
            $users = \App\Models\User::where('role', 'doctor')->count();
            $workingHours = \App\Models\DoctorWorkingHour::count();
            $searchTags = \App\Models\SearchTag::count();

            $this->table(
                ['Resource', 'Count'],
                [
                    ['Cities', $cities],
                    ['Specialties', $specialties],
                    ['Doctor Profiles', $doctors],
                    ['Doctor Users', $users],
                    ['Working Hours', $workingHours],
                    ['Search Tags', $searchTags],
                ]
            );

        } catch (\Exception $e) {
            $this->warn('Could not fetch statistics: ' . $e->getMessage());
        }
    }
}
