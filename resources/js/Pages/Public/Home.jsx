import { Head, Link } from '@inertiajs/react';
import {
    AimOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    HeartFilled,
    HomeOutlined,
    MedicineBoxOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    ThunderboltFilled,
    UserOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackServiceCards = [
    {
        id: 'sample-collection',
        name: 'Sample Collection',
        category_name: 'Diagnostics',
        duration_minutes: 30,
        base_price: 499,
        providers_count: 12,
    },
    {
        id: 'nursing-support',
        name: 'Nursing Support',
        category_name: 'Home Care',
        duration_minutes: 60,
        base_price: 899,
        providers_count: 8,
    },
    {
        id: 'elder-care',
        name: 'Elder Care Visit',
        category_name: 'Wellness',
        duration_minutes: 45,
        base_price: 699,
        providers_count: 6,
    },
];

const specialtyFallbackImages = [
    '/clinic-assets/cardiology-1.webp',
    '/clinic-assets/neurology-4.webp',
    '/clinic-assets/pediatrics-4.webp',
    '/clinic-assets/orthopedics-1.webp',
    '/clinic-assets/oncology-2.webp',
    '/clinic-assets/dermatology-4.webp',
];

const doctorRatings = ['4.9', '4.8', '5.0', '4.7', '4.8', '4.9'];

export default function Home({ auth, site, seo, cities, specialties, featuredDoctors, stats, homeServices = [], homeServicesStats = {} }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState(null);
    const [citySearchText, setCitySearchText] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);

    useEffect(() => {
        detectUserLocation();
    }, []);

    const detectUserLocation = async () => {
        setDetectingLocation(true);

        if (!navigator.geolocation) {
            message.info('Geolocation is not supported by your browser');
            setDetectingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    const detectedCity = data.address?.city
                        || data.address?.town
                        || data.address?.village
                        || data.address?.state_district;

                    if (detectedCity) {
                        const matchedCity = cities.find(
                            (city) => city.name.toLowerCase() === detectedCity.toLowerCase()
                        );

                        if (matchedCity) {
                            setSelectedCity(matchedCity.id);
                            setCitySearchText(matchedCity.name);
                            message.success(`Location detected: ${matchedCity.name}`);
                        } else {
                            setSelectedCity(null);
                            setCitySearchText(detectedCity);
                            message.success(`Location detected: ${detectedCity}`);
                        }
                    }
                } catch (error) {
                    console.error('Error getting location name:', error);
                    message.error('Could not detect your city');
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    message.warning('Location access denied. Please select city manually.');
                } else {
                    message.error('Could not detect your location');
                }
                setDetectingLocation(false);
            }
        );
    };

    const handleCityInput = (value) => {
        setCitySearchText(value);

        const matchedCity = cities.find(
            (city) => city.name.toLowerCase() === value.toLowerCase()
        );

        setSelectedCity(matchedCity ? matchedCity.id : null);
    };

    const handleSearch = () => {
        const params = new URLSearchParams();

        if (searchQuery) {
            params.append('search', searchQuery);
        }

        if (selectedCity) {
            const selectedCityObj = cities.find((city) => city.id === selectedCity);
            if (selectedCityObj) {
                params.append('city_name', selectedCityObj.name);
            }
        } else if (citySearchText) {
            params.append('city_name', citySearchText);
        }

        window.location.href = `/search?${params.toString()}`;
    };

    const pageTitle = seo?.meta_title || (site?.name && site?.tagline ? `${site.name} - ${site.tagline}` : 'Hello Doctors - Find Best Doctors');
    const pageDescription = seo?.meta_description || 'Find and connect with verified healthcare professionals across Uttar Pradesh. Search by specialty, city, or doctor name.';
    const pageKeywords = seo?.meta_keywords || 'doctors, healthcare, medical professionals, find doctors, appointments, Uttar Pradesh';
    const ogTitle = seo?.og_title || pageTitle;
    const ogDescription = seo?.og_description || pageDescription;
    const canonicalUrl = typeof window !== 'undefined' ? window.location.origin : seo?.app_url || '';
    const selectedCityName = selectedCity ? cities.find((city) => city.id === selectedCity)?.name || citySearchText : citySearchText;
    const displayedServices = (homeServices?.length ? homeServices : fallbackServiceCards).slice(0, 4);
    const displayedSpecialties = (specialties || []).slice(0, 6);
    const displayedDoctors = (featuredDoctors || []).slice(0, 6);
    const isPatient = auth?.user?.role === 'patient';
    const homePrimaryHref = isPatient ? '/patient/home-services/book' : '/search';
    const homeSecondaryHref = isPatient ? '/patient/home-services' : '/register-provider';

    const formatPrice = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));

    return (
        <>
            <Head title={pageTitle}>
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={pageKeywords} />
                <meta name="author" content={seo?.meta_author || site?.name || 'Hello Doctors'} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={seo?.app_url || canonicalUrl} />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={ogDescription} />
                {seo?.og_image && <meta property="og:image" content={seo.og_image} />}
                <meta name="twitter:card" content={seo?.twitter_card || 'summary_large_image'} />
                <meta name="twitter:title" content={ogTitle} />
                <meta name="twitter:description" content={ogDescription} />
                <link rel="canonical" href={seo?.app_url || canonicalUrl} />
            </Head>

            <PublicLayout auth={auth} title={pageTitle}>
                <div className="bg-slate-50">
                    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-cyan-800 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
                        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
                            <div>
                                <div className="mb-5 flex flex-wrap gap-3 text-sm">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-cyan-100">
                                        <SafetyCertificateOutlined /> Verified doctors
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-cyan-100">
                                        <HeartFilled /> Compassion-first care
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-cyan-100">
                                        <ThunderboltFilled /> Fast discovery
                                    </span>
                                </div>

                                <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                                    Excellence in <span className="text-cyan-300">Healthcare</span> with compassionate care.
                                </h1>

                                <p className="mt-5 max-w-2xl text-base leading-7 text-sky-100 sm:text-lg">
                                    Search trusted specialists, compare services, and discover quality medical support across your city—from clinic visits to in-home care.
                                </p>

                                <div className="mt-8 rounded-[28px] bg-white p-4 text-slate-900 shadow-2xl shadow-sky-950/20">
                                    <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
                                        <label className="rounded-2xl border border-slate-200 px-4 py-3">
                                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor or specialty</span>
                                            <div className="flex items-center gap-2">
                                                <SearchOutlined className="text-sky-600" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(event) => setSearchQuery(event.target.value)}
                                                    onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                                                    placeholder="Cardiologist, pediatrics, skin care..."
                                                    className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                                />
                                            </div>
                                        </label>

                                        <label className="rounded-2xl border border-slate-200 px-4 py-3">
                                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
                                            <div className="flex items-center gap-2">
                                                <EnvironmentOutlined className="text-cyan-600" />
                                                <input
                                                    list="clinic-city-list"
                                                    value={selectedCityName || ''}
                                                    onChange={(event) => handleCityInput(event.target.value)}
                                                    placeholder={detectingLocation ? 'Detecting your city...' : 'Enter or select a city'}
                                                    className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                                />
                                            </div>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={handleSearch}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-100 transition hover:from-sky-700 hover:to-cyan-600"
                                        >
                                            <SearchOutlined />
                                            Search
                                        </button>
                                    </div>

                                    <datalist id="clinic-city-list">
                                        {cities.map((city) => (
                                            <option key={city.id} value={city.name} />
                                        ))}
                                    </datalist>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                        <span>Search by doctor name, specialty, or city.</span>
                                        <button
                                            type="button"
                                            onClick={detectUserLocation}
                                            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900"
                                        >
                                            <AimOutlined spin={detectingLocation} />
                                            {detectingLocation ? 'Detecting location...' : 'Use my current location'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                        <div className="text-3xl font-bold">{stats.total_doctors || 0}+</div>
                                        <div className="text-sm text-cyan-100">Verified doctors</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                        <div className="text-3xl font-bold">{stats.total_cities || 0}+</div>
                                        <div className="text-sm text-cyan-100">Cities covered</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                        <div className="text-3xl font-bold">{stats.total_specialties || 0}+</div>
                                        <div className="text-sm text-cyan-100">Care specialties</div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="overflow-hidden rounded-[32px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
                                    <img
                                        src="/clinic-assets/staff-10.webp"
                                        alt="Modern healthcare facility"
                                        className="h-[480px] w-full rounded-[24px] object-cover"
                                    />
                                </div>

                                <div className="absolute -left-2 top-8 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-xl sm:-left-10">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appointment Desk</div>
                                    <div className="mt-1 text-lg font-bold">Open today · 9 AM - 8 PM</div>
                                </div>

                                <div className="absolute -bottom-3 right-0 rounded-2xl bg-slate-950/90 px-4 py-3 text-white shadow-xl sm:-right-6">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Emergency help</div>
                                    <a href="tel:+915551234567" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <PhoneOutlined /> +91 55512 34567
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="home-about" className="py-16 lg:py-20">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                            <div className="relative">
                                <img
                                    src="/clinic-assets/facilities-9.webp"
                                    alt="Modern medical facility"
                                    className="h-full min-h-[360px] w-full rounded-[30px] object-cover shadow-xl"
                                />
                                <div className="absolute bottom-6 left-6 rounded-2xl bg-white px-4 py-3 shadow-lg">
                                    <div className="text-sm font-semibold text-sky-700">20+ years of care excellence</div>
                                    <div className="text-xs text-slate-500">Trusted by patients and providers</div>
                                </div>
                            </div>

                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                                    <HeartFilled /> Compassionate Care, Advanced Medicine
                                </span>
                                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                    A modern care experience built around patient trust.
                                </h2>
                                <p className="mt-4 text-base leading-7 text-slate-600">
                                    We bring together doctors, clinics, and home-care professionals on one platform so patients can discover the right care faster—without the usual friction.
                                </p>
                                <p className="mt-3 text-base leading-7 text-slate-600">
                                    From specialist discovery to reliable home services, Hello Doctors combines verified data, local reach, and friendly design for a stronger healthcare journey.
                                </p>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="text-2xl font-bold text-sky-700">{stats.total_doctors || 0}+</div>
                                        <div className="text-sm text-slate-500">Active doctors</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="text-2xl font-bold text-sky-700">{stats.total_cities || 0}+</div>
                                        <div className="text-sm text-slate-500">Reachable cities</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="text-2xl font-bold text-sky-700">{homeServicesStats?.services_count || 0}+</div>
                                        <div className="text-sm text-slate-500">Home services</div>
                                    </div>
                                </div>

                                <div className="mt-7">
                                    <Link href="/about" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                                        Learn more about us
                                        <ArrowRightOutlined />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="featured-departments" className="bg-white py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">Featured Departments</span>
                                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Explore care across top specialties.</h2>
                                <p className="mt-3 text-slate-600">
                                    Browse high-demand medical departments and connect with verified doctors in your city.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {displayedSpecialties.map((specialty, index) => (
                                    <article key={specialty.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                                        <img
                                            src={specialty.image_url || specialtyFallbackImages[index % specialtyFallbackImages.length]}
                                            alt={specialty.name}
                                            className="h-52 w-full object-cover"
                                        />
                                        <div className="p-5">
                                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                                                <MedicineBoxOutlined />
                                                {specialty.doctors_count || 0} doctors available
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">{specialty.name}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                Verified consultations, local availability, and easier discovery for {specialty.name.toLowerCase()} care.
                                            </p>
                                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                                <li className="flex items-center gap-2"><CheckCircleOutlined className="text-cyan-600" /> Specialist consultations</li>
                                                <li className="flex items-center gap-2"><CheckCircleOutlined className="text-cyan-600" /> Verified profiles</li>
                                                <li className="flex items-center gap-2"><CheckCircleOutlined className="text-cyan-600" /> Easy city-based search</li>
                                            </ul>
                                            <Link href={`/search?specialty=${specialty.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900">
                                                Explore doctors <ArrowRightOutlined />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="featured-services" className="py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                                <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-700 text-white shadow-2xl">
                                    <img
                                        src="/clinic-assets/consultation-4.webp"
                                        alt="Healthcare consultation"
                                        className="h-72 w-full object-cover opacity-80"
                                    />
                                    <div className="p-6 sm:p-8">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                                            <HomeOutlined /> Featured Services
                                        </span>
                                        <h2 className="mt-4 text-3xl font-black tracking-tight">Comprehensive healthcare support, online and at home.</h2>
                                        <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-100 sm:text-base">
                                            From doctor discovery to diagnostics and on-demand support, the platform helps patients take the next step with confidence.
                                        </p>
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <Link href={homePrimaryHref} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50">
                                                Book a service
                                            </Link>
                                            <Link href="/search" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white">
                                                Explore doctors
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {displayedServices.map((service) => (
                                        <div key={service.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                                                        {service.category_name || 'Healthcare service'}
                                                    </div>
                                                    <h3 className="mt-2 text-lg font-bold text-slate-900">{service.name}</h3>
                                                </div>
                                                <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                                    ₹{formatPrice(service.base_price)}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                                                    <ClockCircleOutlined /> {service.duration_minutes || 0} min
                                                </span>
                                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                                                    <UserOutlined /> {service.providers_count || 0} providers
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-900">
                                        <div className="font-semibold">Need support beyond clinic hours?</div>
                                        <p className="mt-2 leading-6 text-cyan-800">
                                            Use Hello Doctors to discover home visits, nursing support, and follow-up care with verified providers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="find-a-doctor" className="bg-slate-950 py-16 text-white lg:py-20">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-200">Find A Doctor</span>
                                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Meet experienced professionals across specialties.</h2>
                                <p className="mt-3 text-slate-300">
                                    Browse featured doctors and jump straight to their profile details.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {displayedDoctors.map((doctor, index) => (
                                    <article key={doctor.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-white/10">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={doctor.image || `/clinic-assets/staff-${(index % 6) + 1}.webp`}
                                                alt={doctor.name}
                                                className="h-20 w-20 rounded-2xl object-cover"
                                            />
                                            <div>
                                                <h3 className="text-lg font-bold">{doctor.name}</h3>
                                                <p className="text-sm text-cyan-200">{doctor.specialty}</p>
                                                <p className="mt-1 text-xs text-slate-300">{doctor.cities}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-sm">
                                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-300">Available</span>
                                            <span className="font-semibold text-amber-300">★ {doctorRatings[index % doctorRatings.length]}</span>
                                        </div>

                                        <p className="mt-4 text-sm leading-6 text-slate-300">{doctor.bio}</p>

                                        <div className="mt-5 flex gap-3">
                                            <Link href={`/doctors/${doctor.slug}`} className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-50">
                                                View details
                                            </Link>
                                            <Link href="/contact" className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300">
                                                Contact
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-8 text-center">
                                <Link href="/search" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-cyan-600">
                                    View all doctors
                                    <ArrowRightOutlined />
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section id="call-to-action" className="py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="grid gap-8 overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1fr_0.9fr] lg:items-center">
                                <div className="p-6 sm:p-8 lg:p-10">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                                        <PhoneOutlined /> Need immediate medical assistance?
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                        Care discovery for patients, and growth opportunities for doctors.
                                    </h2>
                                    <p className="mt-4 text-base leading-7 text-slate-600">
                                        Whether you need a consultation or want to join the platform as a provider, Hello Doctors helps you move forward with clarity and confidence.
                                    </p>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <div className="text-xl font-bold text-sky-700">24/7</div>
                                            <div className="text-sm text-slate-500">Support ready</div>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <div className="text-xl font-bold text-sky-700">{homeServicesStats?.providers_count || 0}+</div>
                                            <div className="text-sm text-slate-500">Verified providers</div>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <div className="text-xl font-bold text-sky-700">{stats.total_specialties || 0}+</div>
                                            <div className="text-sm text-slate-500">Medical fields</div>
                                        </div>
                                    </div>

                                    <div className="mt-7 flex flex-wrap gap-3">
                                        <Link href="/search" className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-cyan-600">
                                            Find a doctor
                                        </Link>
                                        <Link href="/register-doctor" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                                            Join as doctor
                                        </Link>
                                    </div>
                                </div>

                                <div className="h-full">
                                    <img
                                        src="/clinic-assets/facilities-6.webp"
                                        alt="Medical excellence"
                                        className="h-full min-h-[320px] w-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </PublicLayout>
        </>
    );
}
