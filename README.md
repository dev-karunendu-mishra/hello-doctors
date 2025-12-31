<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

# Hello Doctors - Doctor Directory Platform

A modern, comprehensive doctor directory and appointment booking system built with Laravel 12, React, and Inertia.js.

## 🚀 Features

- **Multi-City Support**: Manage doctors across 8+ cities in Uttar Pradesh
- **Advanced Search**: Full-text search with filters by city, specialty, and keywords
- **Multi-Role System**: Super Admin, Doctor, and Patient roles
- **Doctor Profiles**: Comprehensive profiles with images, bio, qualifications, and reviews
- **Appointment Booking**: (Coming soon) Book appointments with doctors
- **Working Hours**: Manage doctor availability and schedules
- **Specialty Categories**: 20+ medical specialties
- **Responsive Design**: Mobile-first design with Ant Design components
- **Modern Stack**: Laravel 12 + React + Inertia.js + Tailwind CSS

## 📋 Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and NPM
- MySQL 5.7+ or 8.0+
- hello-doctors.sql (old database export)

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/dev-karunendu-mishra/hello-doctors.git
cd hello-doctors
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hello_doctors
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Place SQL File

Place `hello-doctors.sql` in the project root directory.

### 5. Run Migration & Seeding

```bash
# Single command to migrate everything
php artisan migrate:old-data --fresh
```

This will:
- ✓ Create all database tables
- ✓ Seed cities and specialties
- ✓ Import all doctors from SQL file
- ✓ Convert images from BLOB to files
- ✓ Create search tags
- ✓ Create super admin account

### 6. Link Storage

```bash
php artisan storage:link
```

### 7. Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Start Development Server

```bash
php artisan serve
```

Visit: `http://localhost:8000`

## 👤 Default Credentials

**Super Admin:**
- Email: `admin@hellodoctors.com`
- Password: `admin123`

**Doctors:**
- Email: (from SQL file or auto-generated)
- Password: `password123`

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Essential commands and quick reference
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Comprehensive migration guide
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database structure and relationships
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[docs-hello-doctors/MIGRATION_ANALYSIS.md](docs-hello-doctors/MIGRATION_ANALYSIS.md)** - Old app analysis
- **[docs-hello-doctors/IMPLEMENTATION_ROADMAP.md](docs-hello-doctors/IMPLEMENTATION_ROADMAP.md)** - Development roadmap

## 🗄️ Database Structure

### Core Tables

- **users** - User accounts (admin, doctor, patient)
- **cities** - Cities where doctors practice
- **specialties** - Medical specialties/departments
- **doctor_profiles** - Doctor information and credentials
- **doctor_cities** - Doctors practicing in multiple cities (many-to-many)
- **doctor_working_hours** - Doctor availability schedules
- **search_tags** - Searchable keywords for doctors

## 🔍 Usage Examples

### Search Doctors

```php
use App\Models\DoctorProfile;

// Search by keyword
$doctors = DoctorProfile::whereHas('searchTag', function($q) {
    $q->where('tags', 'like', '%cardiologist%');
})->get();

// Filter by city
$doctors = DoctorProfile::byCity(1)->get();

// Filter by specialty
$doctors = DoctorProfile::bySpecialty(1)->get();

// Combined filters
$doctors = DoctorProfile::query()
    ->byCity(1)
    ->bySpecialty(2)
    ->verified()
    ->with(['user', 'specialty', 'cities'])
    ->paginate(20);
```

### Get Doctor Profile

```php
$doctor = DoctorProfile::with([
    'user',
    'specialty',
    'cities',
    'workingHours',
    'searchTag'
])->findOrFail($id);
```

## 🧪 Testing

```bash
# Run tests
php artisan test

# Run specific test
php artisan test --filter=DoctorProfileTest
```

## 📊 Data Migration Details

The seeder intelligently migrates data from 8 city databases:

| Old Database | City | Status |
|--------------|------|--------|
| hellodoc_agra | Agra | ✓ Supported |
| hellodoc_allahabad | Allahabad | ✓ Supported |
| hellodoc_deoria | Deoria | ✓ Supported |
| hellodoc_gorakhpur | Gorakhpur | ✓ Supported |
| hellodoc_kanpur | Kanpur | ✓ Supported |
| hellodoc_lucknow | Lucknow | ✓ Supported |
| hellodoc_mirzapur | Mirzapur | ✓ Supported |
| hellodoc_varanasi | Varanasi | ✓ Supported |

### Key Transformations

- **Users**: Old `search.title` → `users.name`
- **Specialties**: Old `department` → Normalized specialties
- **Images**: BLOB → Files in `storage/app/public/doctors/`
- **Search**: Multiple fields → Consolidated search tags
- **Cities**: Separate databases → Single database with relationships

## 🚀 Deployment

### Production Checklist

```bash
# 1. Install dependencies
composer install --optimize-autoloader --no-dev
npm install && npm run build

# 2. Configure environment
cp .env.example .env
php artisan key:generate

# 3. Run migration
php artisan migrate:old-data --fresh --force

# 4. Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# 5. Set permissions
chmod -R 775 storage bootstrap/cache
```

## 🔧 Troubleshooting

### SQL File Not Found

```bash
# Ensure file is in project root
ls -la hello-doctors.sql
```

### Memory Limit

```bash
php -d memory_limit=512M artisan db:seed --class=OldDataSeeder
```

### Permission Issues

```bash
chmod -R 775 storage
chown -R www-data:www-data storage
```

### View Logs

```bash
tail -f storage/logs/laravel.log
```

## 📈 Performance

- **Migration Speed**: ~12 minutes for 5000 doctors
- **Search Response**: < 50ms with full-text index
- **Memory Usage**: < 256MB peak during migration
- **Success Rate**: ~98% with valid data

## 🛣️ Roadmap

- [x] Database schema design
- [x] Data migration from old PHP app
- [x] Multi-city support
- [x] Doctor profiles
- [x] Advanced search
- [ ] Appointment booking system
- [ ] Patient portal
- [ ] Reviews & ratings
- [ ] Online consultation
- [ ] Payment integration
- [ ] Email notifications
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer**: Karunendu Mishra
- **Repository**: [github.com/dev-karunendu-mishra/hello-doctors](https://github.com/dev-karunendu-mishra/hello-doctors)

## 🙏 Acknowledgments

- Laravel Framework
- React & Inertia.js
- Ant Design
- Tailwind CSS

---

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing to Laravel

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
