import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useLocation } from '@/Contexts/LocationContext';

export default function Welcome({ auth }) {
    const [searchQuery, setSearchQuery] = useState('');
    const { location, setLocation, isLoadingLocation, detectLocation } = useLocation();

    // Request location permission and get user's location on page load
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;
        
        console.log('Welcome page mounted, current location:', location);
        
        // Only auto-detect if location is not already set
        if (!location) {
            console.log('No location set, triggering auto-detection...');
            detectLocation().catch(err => {
                console.error('Auto-detection failed:', err);
            });
        } else {
            console.log('Location already set:', location);
        }
    }, []);

    const categories = [
        { name: 'Doctors', icon: '👨‍⚕️', color: 'bg-emerald-500', link: '/doctors' },
        { name: 'Hospitals', icon: '🏥', color: 'bg-blue-500', link: '/hospitals' },
        { name: 'Pharmacies', icon: '💊', color: 'bg-purple-500', link: '/pharmacies' },
        { name: 'Diagnostics', icon: '🔬', color: 'bg-pink-500', link: '/diagnostics' },
        { name: 'Ambulance', icon: '🚑', color: 'bg-red-500', link: '/ambulance' },
        { name: 'Blood Banks', icon: '🩸', color: 'bg-rose-500', link: '/blood-banks' },
        { name: 'Dentists', icon: '🦷', color: 'bg-cyan-500', link: '/dentists' },
        { name: 'Eye Care', icon: '👁️', color: 'bg-indigo-500', link: '/eye-care' },
        { name: 'Physiotherapy', icon: '💪', color: 'bg-orange-500', link: '/physiotherapy' },
        { name: 'Home Care', icon: '🏠', color: 'bg-teal-500', link: '/home-care' },
        { name: 'Mental Health', icon: '🧠', color: 'bg-violet-500', link: '/mental-health' },
        { name: 'Alternative Medicine', icon: '🌿', color: 'bg-green-500', link: '/alternative-medicine' },
    ];

    const featuredServices = [
        {
            title: 'Emergency Care',
            description: '24/7 Emergency Medical Services',
            image: '🚨',
            bgColor: 'bg-red-500',
        },
        {
            title: 'Book Appointments',
            description: 'Schedule with Top Doctors',
            image: '📅',
            bgColor: 'bg-blue-500',
        },
        {
            title: 'Online Consultation',
            description: 'Consult Doctors Remotely',
            image: '💻',
            bgColor: 'bg-purple-500',
        },
        {
            title: 'Health Packages',
            description: 'Comprehensive Health Checkups',
            image: '📋',
            bgColor: 'bg-emerald-500',
        },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery, 'in', location);
    };

    return (
        <>
            <Head title="Find Best Doctors & Healthcare Services" />
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <Link href="/" className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-emerald-600">Hello</span>
                                    <span className="text-2xl font-bold text-blue-600">Doctors</span>
                                </Link>
                            </div>
                            <nav className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section with Search */}
                <section className="relative bg-gradient-to-r from-emerald-600 to-blue-600 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                                Find the Best Healthcare
                            </h1>
                            <p className="mb-8 text-xl text-white/90">
                                Search across <span className="font-bold">10,000+ Doctors</span> & Healthcare Services
                            </p>
                            
                            {/* Search Box */}
                            <form onSubmit={handleSearch} className="mx-auto max-w-4xl">
                                <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row">
                                    <div className="flex flex-1 items-center rounded-lg border border-gray-200 px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search for doctors, hospitals, services..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="ml-3 w-full border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                    <div className="flex items-center rounded-lg border border-gray-200 px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 sm:w-64">
                                        {isLoadingLocation ? (
                                            <svg className="h-5 w-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                        <input
                                            type="text"
                                            placeholder={isLoadingLocation ? "Detecting location..." : "Location"}
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            disabled={isLoadingLocation}
                                            className="ml-3 w-full border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Featured Services */}
                <section className="py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {featuredServices.map((service, index) => (
                                <div
                                    key={index}
                                    className={`group cursor-pointer overflow-hidden rounded-2xl ${service.bgColor} p-6 text-white shadow-lg transition hover:scale-105`}
                                >
                                    <div className="mb-4 text-5xl">{service.image}</div>
                                    <h3 className="mb-2 text-xl font-bold">{service.title}</h3>
                                    <p className="text-white/90">{service.description}</p>
                                    <div className="mt-4 flex items-center text-sm font-semibold">
                                        Explore
                                        <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900">Browse by Category</h2>
                            <p className="text-lg text-gray-600">Find the healthcare service you need</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {categories.map((category, index) => (
                                <Link
                                    key={index}
                                    href={category.link}
                                    className="group flex flex-col items-center rounded-2xl border-2 border-gray-100 bg-white p-6 transition hover:border-emerald-500 hover:shadow-lg"
                                >
                                    <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${category.color} text-3xl transition group-hover:scale-110`}>
                                        {category.icon}
                                    </div>
                                    <span className="text-center text-sm font-semibold text-gray-700 group-hover:text-emerald-600">
                                        {category.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="bg-gray-50 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Choose Hello Doctors?</h2>
                            <p className="text-lg text-gray-600">Your trusted healthcare companion</p>
                        </div>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-8 text-center shadow-md">
                                <div className="mb-4 text-5xl">🔍</div>
                                <h3 className="mb-3 text-xl font-bold text-gray-900">Easy Search</h3>
                                <p className="text-gray-600">
                                    Find the best doctors and healthcare services near you with our powerful search engine
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-8 text-center shadow-md">
                                <div className="mb-4 text-5xl">⭐</div>
                                <h3 className="mb-3 text-xl font-bold text-gray-900">Verified Reviews</h3>
                                <p className="text-gray-600">
                                    Read authentic reviews from real patients to make informed healthcare decisions
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-8 text-center shadow-md">
                                <div className="mb-4 text-5xl">📱</div>
                                <h3 className="mb-3 text-xl font-bold text-gray-900">Book Instantly</h3>
                                <p className="text-gray-600">
                                    Schedule appointments online and get instant confirmation from healthcare providers
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 py-12 text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                            <div className="col-span-1 md:col-span-2">
                                <div className="mb-4 flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-emerald-400">Hello</span>
                                    <span className="text-2xl font-bold text-blue-400">Doctors</span>
                                </div>
                                <p className="text-gray-400">
                                    Your trusted platform for finding the best healthcare services and medical professionals.
                                </p>
                            </div>
                            <div>
                                <h4 className="mb-4 font-bold">Quick Links</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-emerald-400">About Us</a></li>
                                    <li><a href="#" className="hover:text-emerald-400">Contact</a></li>
                                    <li><a href="#" className="hover:text-emerald-400">Careers</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-4 font-bold">Legal</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-emerald-400">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-emerald-400">Terms of Service</a></li>
                                    <li><a href="#" className="hover:text-emerald-400">Cookie Policy</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
                            <p>&copy; {new Date().getFullYear()} Hello Doctors. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
