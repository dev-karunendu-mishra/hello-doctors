import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const coreValues = [
    {
        icon: 'bi-heart-pulse',
        title: 'Compassion',
        description: 'Providing care with empathy, clarity, and support for every patient and family using the Hello Doctors platform.',
    },
    {
        icon: 'bi-shield-check',
        title: 'Excellence',
        description: 'Maintaining high standards in healthcare discovery, verified information, and patient-first digital experience.',
    },
    {
        icon: 'bi-people',
        title: 'Integrity',
        description: 'Building trust through transparent communication, responsible listing practices, and dependable support.',
    },
    {
        icon: 'bi-lightbulb',
        title: 'Innovation',
        description: 'Using modern tools and thoughtful design to simplify how people discover doctors and medical services.',
    },
];

const certificationImages = [
    { src: '/clinic-assets/cardiology-1.webp', alt: 'Healthcare quality recognition' },
    { src: '/clinic-assets/consultation-4.webp', alt: 'Medical excellence recognition' },
    { src: '/clinic-assets/neurology-4.webp', alt: 'Trusted care network recognition' },
    { src: '/clinic-assets/orthopedics-4.webp', alt: 'Healthcare standards recognition' },
    { src: '/clinic-assets/vaccination-3.webp', alt: 'Patient care recognition' },
];

export default function About({ auth, stats }) {
    return (
        <>
            <Head title="About - Hello Doctors">
                <meta
                    name="description"
                    content="Learn about Hello Doctors, our patient-first mission, platform values, and how we help people discover trusted healthcare professionals."
                />
                <meta
                    name="keywords"
                    content="about hello doctors, healthcare platform, patient care, verified doctors, medical discovery"
                />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/about` : '/about'} />
            </Head>

            <PublicLayout auth={auth} title="About - Hello Doctors" pageClassName="about-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">About</h1>
                                    <p className="mb-0">
                                        Discover how Hello Doctors helps patients and families find trusted doctors, explore specialties, and navigate care with more confidence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">About</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="about" className="about section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row align-items-center">
                            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
                                <div className="about-content">
                                    <h2>Compassionate Care Discovery for Every Family</h2>
                                    <p className="lead">
                                        For over {stats?.years ?? 10} years, Hello Doctors has focused on making healthcare discovery clearer, faster, and more trustworthy for patients, providers, and families.
                                    </p>

                                    <p>
                                        We go beyond simple directory listings by helping users explore verified doctor profiles, specialties, and city-based care options in a format designed for real healthcare decisions.
                                    </p>

                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-number" data-purecounter-start="0" data-purecounter-end={stats?.doctors ?? 0} data-purecounter-duration="2">
                                                {stats?.doctors ?? 0}
                                            </span>
                                            <span className="stat-label">Verified Doctors</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-number" data-purecounter-start="0" data-purecounter-end={stats?.cities ?? 0} data-purecounter-duration="2">
                                                {stats?.cities ?? 0}
                                            </span>
                                            <span className="stat-label">Cities Covered</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-number" data-purecounter-start="0" data-purecounter-end={stats?.specialties ?? 0} data-purecounter-duration="2">
                                                {stats?.specialties ?? 0}
                                            </span>
                                            <span className="stat-label">Specialties Available</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="200">
                                <div className="image-wrapper">
                                    <img src="/clinic-assets/facilities-6.webp" className="img-fluid main-image" alt="Healthcare facility" />
                                    <div className="floating-image" data-aos="zoom-in" data-aos-delay="400">
                                        <img src="/clinic-assets/staff-8.webp" className="img-fluid" alt="Medical team" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="values-section" data-aos="fade-up" data-aos-delay="300">
                            <div className="row">
                                <div className="col-lg-12 text-center">
                                    <h3>Our Core Values</h3>
                                    <p className="section-description">
                                        These principles guide how Hello Doctors supports patients, doctors, and healthcare discovery across the platform.
                                    </p>
                                </div>
                            </div>

                            <div className="row">
                                {coreValues.map((value, index) => (
                                    <div key={value.title} className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay={100 + index * 100}>
                                        <div className="value-item">
                                            <div className="value-icon">
                                                <i className={`bi ${value.icon}`} />
                                            </div>
                                            <h4>{value.title}</h4>
                                            <p>{value.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="certifications-section" data-aos="fade-up" data-aos-delay="400">
                            <div className="row">
                                <div className="col-lg-12 text-center">
                                    <h3>Accreditations &amp; Certifications</h3>
                                    <p className="section-description">
                                        Our approach is inspired by recognized standards of quality, trust, and patient-focused healthcare support.
                                    </p>
                                </div>
                            </div>

                            <div className="row justify-content-center">
                                {certificationImages.map((image, index) => (
                                    <div key={image.src} className="col-lg-2 col-md-3 col-sm-4 col-6" data-aos="zoom-in" data-aos-delay={100 + index * 100}>
                                        <div className="certification-item">
                                            <img src={image.src} className="img-fluid" alt={image.alt} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
