import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackSpecialties = [
    { id: 'cardiology', name: 'Cardiovascular Medicine', image_url: '/clinic-assets/cardiology-1.webp', doctors_count: 24 },
    { id: 'neurology', name: 'Neurological Sciences', image_url: '/clinic-assets/neurology-4.webp', doctors_count: 18 },
    { id: 'orthopedics', name: 'Orthopedic Surgery', doctors_count: 16 },
    { id: 'pediatrics', name: 'Pediatric Care', doctors_count: 14 },
    { id: 'oncology', name: 'Cancer Treatment', doctors_count: 11 },
    { id: 'dermatology', name: 'Dermatology Care', doctors_count: 9 },
];

const fallbackServices = [
    {
        id: 'dermatology',
        name: 'Dermatology Clinic',
        category_name: 'Skin & Wellness',
        description: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
        icon: 'bi-capsule',
        link: '/doctors',
    },
    {
        id: 'surgery',
        name: 'Surgery Center',
        category_name: 'Advanced Procedures',
        description: 'Donec rutrum congue leo eget malesuada curabitur arcu erat accumsan id imperdiet et porttitor at sem.',
        icon: 'bi-bandaid',
        link: '/doctors',
    },
    {
        id: 'diagnostics',
        name: 'Diagnostics Lab',
        category_name: 'Testing & Reports',
        description: 'Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui cras ultricies ligula sed magna.',
        icon: 'bi-activity',
        link: '/contact',
    },
];

const fallbackDoctors = [
    { name: 'Dr. Amanda Foster', specialty: 'Cardiology Specialist', image: '/clinic-assets/staff-2.webp', status: 'available', rating: '4.9', reviews: 127, experience: '14 years experience' },
    { name: 'Dr. Marcus Johnson', specialty: 'Neurology Expert', image: '/clinic-assets/staff-6.webp', status: 'busy', rating: '4.8', reviews: 89, experience: '16 years experience' },
    { name: 'Dr. Rachel Williams', specialty: 'Pediatrics Care', image: '/clinic-assets/staff-4.webp', status: 'available', rating: '5.0', reviews: 203, experience: '11 years experience' },
    { name: 'Dr. David Chen', specialty: 'Orthopedic Surgery', image: '/clinic-assets/staff-8.webp', status: 'offline', rating: '4.7', reviews: 156, experience: '22 years experience' },
    { name: 'Dr. Victoria Torres', specialty: 'Dermatology Care', image: '/clinic-assets/staff-11.webp', status: 'available', rating: '4.5', reviews: 74, experience: '9 years experience' },
    { name: 'Dr. Benjamin Lee', specialty: 'Oncology Treatment', image: '/clinic-assets/staff-14.webp', status: 'available', rating: '4.9', reviews: 194, experience: '19 years experience' },
];

const specialtyShowcase = [
    { title: 'Maternal Care', image: '/clinic-assets/maternal-2.webp', text: 'Expert pregnancy & delivery support' },
    { title: 'Vaccination', image: '/clinic-assets/vaccination-3.webp', text: 'Complete immunization programs' },
    { title: 'Emergency Care', image: '/clinic-assets/emergency-1.webp', text: '24/7 critical care services' },
    { title: 'Advanced Technology', image: '/clinic-assets/facilities-6.webp', text: 'State-of-the-art medical equipment' },
];

export default function Home({ auth, site, seo, specialties = [], featuredDoctors = [], stats = {}, homeServices = [], homeServicesStats = {} }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');

    const pageTitle = seo?.meta_title || (site?.name && site?.tagline ? `${site.name} - ${site.tagline}` : 'Hello Doctors - Find Best Doctors');
    const pageDescription = seo?.meta_description || 'Find and connect with verified healthcare professionals across Uttar Pradesh. Search by specialty, city, or doctor name.';
    const pageKeywords = seo?.meta_keywords || 'doctors, healthcare, medical professionals, find doctors, appointments, Uttar Pradesh';
    const ogTitle = seo?.og_title || pageTitle;
    const ogDescription = seo?.og_description || pageDescription;
    const canonicalUrl = typeof window !== 'undefined' ? window.location.origin : seo?.app_url || '';

    const displayedSpecialties = (specialties.length ? specialties : fallbackSpecialties).slice(0, 6);
    const displayedDoctors = fallbackDoctors.map((fallbackDoctor, index) => {
        const doctor = featuredDoctors[index];

        return {
            id: doctor?.id || fallbackDoctor.name,
            slug: doctor?.slug || '',
            name: doctor?.name || fallbackDoctor.name,
            specialty: doctor?.specialty || fallbackDoctor.specialty,
            image: doctor?.image || fallbackDoctor.image,
            bio: doctor?.bio || 'Experienced, compassionate, and dedicated to personalized patient care.',
            status: fallbackDoctor.status,
            rating: fallbackDoctor.rating,
            reviews: fallbackDoctor.reviews,
            experience: fallbackDoctor.experience,
        };
    });

    const departmentCards = [
        {
            title: displayedSpecialties[0]?.name || 'Cardiovascular Medicine',
            label: 'Specialized Care',
            description: 'Advanced diagnostic imaging and interventional procedures for comprehensive heart health management with personalized treatment protocols.',
            features: ['24/7 Emergency Cardiac Care', 'Minimally Invasive Procedures'],
            image: displayedSpecialties[0]?.image_url || '/clinic-assets/cardiology-1.webp',
            icon: 'bi-heart-pulse',
            link: displayedSpecialties[0]?.id ? `/doctors?specialty=${displayedSpecialties[0].id}` : '/doctors',
        },
        {
            title: displayedSpecialties[1]?.name || 'Neurological Sciences',
            label: 'Expert Care',
            description: 'Cutting-edge neuroimaging and neurosurgical expertise for complex brain and spinal cord conditions with innovative treatment approaches.',
            features: ['Advanced Brain Imaging', 'Robotic Surgery'],
            image: displayedSpecialties[1]?.image_url || '/clinic-assets/neurology-4.webp',
            icon: 'bi-cpu',
            link: displayedSpecialties[1]?.id ? `/doctors?specialty=${displayedSpecialties[1].id}` : '/doctors',
        },
    ];

    const departmentHighlights = [
        {
            title: displayedSpecialties[2]?.name || 'Orthopedic Surgery',
            description: 'Comprehensive musculoskeletal care utilizing advanced arthroscopic techniques and joint replacement procedures.',
            list: ['Sports Medicine', 'Joint Replacement', 'Spine Surgery'],
            icon: 'bi-shield-plus',
            link: displayedSpecialties[2]?.id ? `/doctors?specialty=${displayedSpecialties[2].id}` : '/doctors',
        },
        {
            title: displayedSpecialties[3]?.name || 'Pediatric Care',
            description: 'Child-centered healthcare services from newborn to adolescence with family-focused treatment approaches.',
            list: ['Neonatal Intensive Care', 'Developmental Pediatrics', 'Pediatric Surgery'],
            icon: 'bi-people',
            link: displayedSpecialties[3]?.id ? `/doctors?specialty=${displayedSpecialties[3].id}` : '/doctors',
        },
        {
            title: displayedSpecialties[4]?.name || 'Cancer Treatment',
            description: 'Multidisciplinary oncology program offering personalized cancer care with latest therapeutic innovations.',
            list: ['Precision Medicine', 'Immunotherapy', 'Radiation Oncology'],
            icon: 'bi-activity',
            link: displayedSpecialties[4]?.id ? `/doctors?specialty=${displayedSpecialties[4].id}` : '/doctors',
        },
    ];

    const serviceItems = (homeServices.length ? homeServices : fallbackServices).slice(0, 3).map((service, index) => ({
        id: service.id,
        name: service.name,
        description: service.description || `${service.category_name || 'Healthcare'} services delivered with verified support and reliable scheduling.`,
        icon: fallbackServices[index]?.icon || 'bi-heart-pulse',
        link: '/doctors',
    }));

    const homePrimaryHref = auth?.user?.role === 'patient' ? '/patient/home-services/book' : '/doctors';
    const homeSecondaryHref = auth?.user?.role === 'patient' ? '/patient/home-services' : '/contact';
    const heroPatientsCount = Math.max((stats.total_doctors || 50) * 100, 5000);
    const aboutPatientsCount = Math.max((stats.total_doctors || 50) * 300, 15000);

    const handleDoctorSearch = (event) => {
        event.preventDefault();

        const params = new URLSearchParams();

        if (searchQuery) {
            params.append('search', searchQuery);
        }

        if (selectedSpecialty) {
            params.append('specialty', selectedSpecialty);
        }

        window.location.href = `/doctors?${params.toString()}`;
    };

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
                <section id="hero" className="hero section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="hero-content">
                                    <div className="trust-badges mb-4" data-aos="fade-right" data-aos-delay="200">
                                        <div className="badge-item">
                                            <i className="bi bi-shield-check" />
                                            <span>Accredited</span>
                                        </div>
                                        <div className="badge-item">
                                            <i className="bi bi-clock" />
                                            <span>24/7 Emergency</span>
                                        </div>
                                        <div className="badge-item">
                                            <i className="bi bi-star-fill" />
                                            <span>4.9/5 Rating</span>
                                        </div>
                                    </div>

                                    <h1 data-aos="fade-right" data-aos-delay="300">
                                        Excellence in <span className="highlight">Healthcare</span> With Compassionate Care
                                    </h1>

                                    <p className="hero-description" data-aos="fade-right" data-aos-delay="400">
                                        Discover verified doctors, trusted specialties, and modern healthcare support designed to help patients move from search to care with confidence.
                                    </p>

                                    <div className="hero-stats mb-4" data-aos="fade-right" data-aos-delay="500">
                                        <div className="stat-item">
                                            <h3><span>{15}</span>+</h3>
                                            <p>Years Experience</p>
                                        </div>
                                        <div className="stat-item">
                                            <h3><span>{heroPatientsCount}</span>+</h3>
                                            <p>Patients Treated</p>
                                        </div>
                                        <div className="stat-item">
                                            <h3><span>{stats.total_doctors || 50}</span>+</h3>
                                            <p>Medical Experts</p>
                                        </div>
                                    </div>

                                    <div className="hero-actions" data-aos="fade-right" data-aos-delay="600">
                                        <Link href={homePrimaryHref} className="btn btn-primary">Book Appointment</Link>
                                        <a href="https://www.youtube.com/watch?v=Y7f98aduVJ8" className="btn btn-outline glightbox">
                                            <i className="bi bi-play-circle me-2" />
                                            Watch Our Story
                                        </a>
                                    </div>

                                    <div className="emergency-contact" data-aos="fade-right" data-aos-delay="700">
                                        <div className="emergency-icon">
                                            <i className="bi bi-telephone-fill" />
                                        </div>
                                        <div className="emergency-info">
                                            <small>Emergency Hotline</small>
                                            <strong>+91 (555) 911-2468</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="hero-visual" data-aos="fade-left" data-aos-delay="400">
                                    <div className="main-image">
                                        <img src="/clinic-assets/staff-10.webp" alt="Modern Healthcare Facility" className="img-fluid" />
                                        <div className="floating-card appointment-card">
                                            <div className="card-icon">
                                                <i className="bi bi-calendar-check" />
                                            </div>
                                            <div className="card-content">
                                                <h6>Next Available</h6>
                                                <p>Today 2:30 PM</p>
                                                <small>{displayedDoctors[0]?.name || 'Dr. Sarah Johnson'}</small>
                                            </div>
                                        </div>
                                        <div className="floating-card rating-card">
                                            <div className="card-content">
                                                <div className="rating-stars">
                                                    <i className="bi bi-star-fill" />
                                                    <i className="bi bi-star-fill" />
                                                    <i className="bi bi-star-fill" />
                                                    <i className="bi bi-star-fill" />
                                                    <i className="bi bi-star-fill" />
                                                </div>
                                                <h6>4.9/5</h6>
                                                <small>1,234 Reviews</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="background-elements">
                                        <div className="element element-1" />
                                        <div className="element element-2" />
                                        <div className="element element-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="home-about" className="home-about section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row align-items-center">
                            <div className="col-lg-6 mb-5 mb-lg-0" data-aos="fade-right" data-aos-delay="200">
                                <div className="about-content">
                                    <h2 className="section-heading">Compassionate Care, Advanced Medicine</h2>
                                    <p className="lead-text">
                                        For over two decades, we&apos;ve been dedicated to providing exceptional healthcare that combines cutting-edge medical technology with the personal touch our patients deserve.
                                    </p>

                                    <p>
                                        Our multidisciplinary team of specialists works collaboratively to ensure every patient receives comprehensive care tailored to their unique needs. From preventive services to complex procedures, we maintain the highest standards of medical excellence while fostering an environment of trust and healing.
                                    </p>

                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <div className="stat-number">{aboutPatientsCount}</div>
                                            <div className="stat-label">Patients Served</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">25</div>
                                            <div className="stat-label">Years of Excellence</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">{stats.total_specialties || 50}</div>
                                            <div className="stat-label">Medical Specialists</div>
                                        </div>
                                    </div>

                                    <div className="cta-section">
                                        <Link href="/about" className="btn-primary">Learn More About Us</Link>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="300">
                                <div className="about-visual">
                                    <div className="main-image">
                                        <img src="/clinic-assets/facilities-9.webp" alt="Modern medical facility" className="img-fluid" />
                                    </div>
                                    <div className="floating-card">
                                        <div className="card-content">
                                            <div className="icon">
                                                <i className="bi bi-heart-pulse" />
                                            </div>
                                            <div className="card-text">
                                                <h4>24/7 Emergency Care</h4>
                                                <p>Always here when you need us most</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="experience-badge">
                                        <div className="badge-content">
                                            <span className="years">25+</span>
                                            <span className="text">Years of Trusted Care</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="featured-departments" className="featured-departments section">
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Featured Departments</h2>
                        <p>Explore our most sought-after specialties and discover expert-led care paths tailored to patient needs.</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-5">
                            {departmentCards.map((department, index) => (
                                <div className="col-lg-6" data-aos="zoom-in" data-aos-delay={100 + (index * 100)} key={department.title}>
                                    <div className="specialty-card">
                                        <div className="specialty-content">
                                            <div className="specialty-meta">
                                                <span className="specialty-label">{department.label}</span>
                                            </div>
                                            <h3>{department.title}</h3>
                                            <p>{department.description}</p>
                                            <div className="specialty-features">
                                                {department.features.map((feature) => (
                                                    <span key={feature}><i className="bi bi-check-circle-fill" />{feature}</span>
                                                ))}
                                            </div>
                                            <Link href={department.link} className="specialty-link">
                                                Explore {department.title.split(' ')[0]} <i className="bi bi-arrow-right" />
                                            </Link>
                                        </div>
                                        <div className="specialty-visual">
                                            <img src={department.image} alt={department.title} className="img-fluid" />
                                            <div className="visual-overlay">
                                                <i className={`bi ${department.icon}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {departmentHighlights.map((department, index) => (
                                <div className="col-lg-4" data-aos="fade-up" data-aos-delay={100 + (index * 100)} key={department.title}>
                                    <div className="department-highlight">
                                        <div className="highlight-icon">
                                            <i className={`bi ${department.icon}`} />
                                        </div>
                                        <h4>{department.title}</h4>
                                        <p>{department.description}</p>
                                        <ul className="highlight-list">
                                            {department.list.map((item) => <li key={item}>{item}</li>)}
                                        </ul>
                                        <Link href={department.link} className="highlight-cta">Learn More</Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="emergency-banner" data-aos="fade-up" data-aos-delay="400">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <div className="emergency-content">
                                        <h3>Emergency Services Available 24/7</h3>
                                        <p>Our emergency department is equipped with state-of-the-art technology and staffed by board-certified emergency physicians ready to provide immediate care.</p>
                                    </div>
                                </div>
                                <div className="col-lg-4 text-lg-end">
                                    <a href="tel:+915551234567" className="emergency-btn">
                                        <i className="bi bi-telephone-fill" />
                                        Call Emergency: +91 55512 34567
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="featured-services" className="featured-services section">
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Featured Services</h2>
                        <p>From clinic discovery to home support, Hello Doctors helps patients access care with speed and confidence.</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-0">
                            <div className="col-lg-8" data-aos="fade-right" data-aos-delay="200">
                                <div className="featured-service-main">
                                    <div className="service-image-wrapper">
                                        <img src="/clinic-assets/consultation-4.webp" alt="Premier Healthcare Services" className="img-fluid" loading="lazy" />
                                        <div className="service-overlay">
                                            <div className="service-badge">
                                                <i className="bi bi-heart-pulse" />
                                                <span>Emergency Care</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="service-details">
                                        <h2>Comprehensive Healthcare Excellence</h2>
                                        <p>
                                            Explore trusted doctors, specialist support, and verified home services in one patient-friendly platform built for modern healthcare journeys.
                                        </p>
                                        <Link href={homeSecondaryHref} className="main-cta">Explore Our Services</Link>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4" data-aos="fade-left" data-aos-delay="300">
                                <div className="services-sidebar">
                                    {serviceItems.map((service, index) => (
                                        <div className="service-item" data-aos="fade-up" data-aos-delay={400 + (index * 100)} key={service.id}>
                                            <div className="service-icon-wrapper">
                                                <i className={`bi ${service.icon}`} />
                                            </div>
                                            <div className="service-info">
                                                <h4>{service.name}</h4>
                                                <p>{service.description}</p>
                                                <Link href={service.link} className="service-link">Learn More</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="specialties-grid" data-aos="fade-up" data-aos-delay="300">
                            <div className="row align-items-center">
                                {specialtyShowcase.map((item) => (
                                    <div className="col-lg-3 col-md-6" key={item.title}>
                                        <div className="specialty-card">
                                            <div className="specialty-image">
                                                <img src={item.image} alt={item.title} className="img-fluid" loading="lazy" />
                                            </div>
                                            <div className="specialty-content">
                                                <h5>{item.title}</h5>
                                                <span>{item.text}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="find-a-doctor" className="find-a-doctor section">
                    <div className="container section-title" data-aos="fade-up">
                        <h2>Find A Doctor</h2>
                        <p>Search through our trusted directory of experienced medical professionals across specialties.</p>
                    </div>

                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="200">
                            <div className="col-lg-8 text-center">
                                <div className="search-section">
                                    <h3 className="search-title">Find Your Perfect Healthcare Provider</h3>
                                    <p className="search-subtitle">Search through our comprehensive directory of experienced medical professionals</p>
                                    <form className="search-form" onSubmit={handleDoctorSearch}>
                                        <div className="search-input-group">
                                            <div className="input-wrapper">
                                                <i className="bi bi-person" />
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="doctor_name"
                                                    placeholder="Enter doctor name"
                                                    value={searchQuery}
                                                    onChange={(event) => setSearchQuery(event.target.value)}
                                                />
                                            </div>
                                            <div className="select-wrapper">
                                                <i className="bi bi-heart-pulse" />
                                                <select
                                                    className="form-select"
                                                    name="specialty"
                                                    value={selectedSpecialty}
                                                    onChange={(event) => setSelectedSpecialty(event.target.value)}
                                                >
                                                    <option value="">All Specialties</option>
                                                    {displayedSpecialties.map((specialty) => (
                                                        <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button type="submit" className="search-btn">
                                                <i className="bi bi-search" />
                                                Find Doctors
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="doctors-grid" data-aos="fade-up" data-aos-delay="300">
                            {displayedDoctors.map((doctor, index) => (
                                <div className="doctor-profile" data-aos="zoom-in" data-aos-delay={100 + (index * 100)} key={doctor.id}>
                                    <div className="profile-header">
                                        <div className="doctor-avatar">
                                            <img src={doctor.image} alt={doctor.name} className="img-fluid" />
                                            <div className={`status-indicator ${doctor.status}`} />
                                        </div>
                                        <div className="doctor-details">
                                            <h4>{doctor.name}</h4>
                                            <span className="specialty-tag">{doctor.specialty}</span>
                                            <div className="experience-info">
                                                <i className="bi bi-award" />
                                                <span>{doctor.experience}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rating-section">
                                        <div className="stars">
                                            <i className="bi bi-star-fill" />
                                            <i className="bi bi-star-fill" />
                                            <i className="bi bi-star-fill" />
                                            <i className="bi bi-star-fill" />
                                            <i className={`bi ${doctor.rating === '4.5' || doctor.rating === '4.7' || doctor.rating === '4.8' ? 'bi-star-half' : 'bi-star-fill'}`} />
                                        </div>
                                        <span className="rating-score">{doctor.rating}</span>
                                        <span className="review-count">({doctor.reviews} reviews)</span>
                                    </div>
                                    <div className="action-buttons">
                                        <Link href={doctor.slug ? `/doctors/${doctor.slug}` : '/doctors'} className="btn-secondary">View Details</Link>
                                        <Link href={homePrimaryHref} className="btn-primary">Book Now</Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-5" data-aos="fade-up" data-aos-delay="700">
                            <Link href="/doctors" className="btn-view-all">
                                View All Doctors
                                <i className="bi bi-arrow-right" />
                            </Link>
                        </div>
                    </div>
                </section>

                <section id="call-to-action" className="call-to-action section light-background">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="hero-content">
                            <div className="row align-items-center">
                                <div className="col-lg-6">
                                    <div className="content-wrapper" data-aos="fade-up" data-aos-delay="200">
                                        <h1>Excellence in Medical Care, Every Day</h1>
                                        <p>
                                            Hello Doctors supports every step of the patient journey—from doctor discovery and appointment planning to trusted home-based healthcare services.
                                        </p>

                                        <div className="cta-wrapper">
                                            <Link href={homePrimaryHref} className="primary-cta">
                                                <span>Schedule Consultation</span>
                                                <i className="bi bi-arrow-right" />
                                            </Link>
                                            <Link href={homeSecondaryHref} className="secondary-cta">
                                                <span>Explore Services</span>
                                                <i className="bi bi-arrow-right" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="image-container" data-aos="fade-left" data-aos-delay="300">
                                        <img src="/clinic-assets/facilities-9.webp" alt="Medical Excellence" className="img-fluid" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="features-section">
                            <div className="row g-0">
                                <div className="col-lg-4">
                                    <div className="feature-block" data-aos="fade-up" data-aos-delay="200">
                                        <div className="feature-icon">
                                            <i className="bi bi-shield-check" />
                                        </div>
                                        <h3>Advanced Technology</h3>
                                        <p>Modern discovery tools and verified profiles help patients make informed healthcare decisions faster.</p>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="feature-block" data-aos="fade-up" data-aos-delay="300">
                                        <div className="feature-icon">
                                            <i className="bi bi-clock" />
                                        </div>
                                        <h3>24/7 Availability</h3>
                                        <p>Patients can explore doctors, services, and emergency support options whenever they need care guidance.</p>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="feature-block" data-aos="fade-up" data-aos-delay="400">
                                        <div className="feature-icon">
                                            <i className="bi bi-people" />
                                        </div>
                                        <h3>Expert Team</h3>
                                        <p>Connect with experienced professionals across specialties through one unified and patient-friendly platform.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-block">
                            <div className="row">
                                <div className="col-lg-8">
                                    <div className="contact-content" data-aos="fade-up" data-aos-delay="200">
                                        <h2>Need Immediate Medical Assistance?</h2>
                                        <p>Our emergency response team is available around the clock to provide immediate medical support when you need it most.</p>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="contact-actions" data-aos="fade-up" data-aos-delay="300">
                                        <a href="tel:+915551234567" className="emergency-call">
                                            <i className="bi bi-telephone" />
                                            <span>+91 55512 34567</span>
                                        </a>
                                        <Link href="/contact" className="contact-link">Find Location</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
