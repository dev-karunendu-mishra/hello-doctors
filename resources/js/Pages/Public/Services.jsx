import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackServices = [
    {
        key: 'cardiology',
        name: 'Cardiology',
        description: 'Comprehensive heart care with advanced diagnostic tools and treatment options for cardiovascular conditions.',
        image: '/clinic-assets/cardiology-1.webp',
        icon: 'fas fa-heartbeat',
        features: ['ECG Testing', 'Heart Surgery'],
    },
    {
        key: 'neurology',
        name: 'Neurology',
        description: 'Expert neurological care for brain and nervous system disorders with state-of-the-art imaging technology.',
        image: '/clinic-assets/neurology-4.webp',
        icon: 'fas fa-brain',
        features: ['MRI Scans', 'Stroke Care'],
    },
    {
        key: 'orthopedics',
        name: 'Orthopedics',
        description: 'Specialized bone and joint treatment including sports medicine and reconstructive support for mobility care.',
        image: '/clinic-assets/orthopedics-4.webp',
        icon: 'fas fa-bone',
        features: ['Joint Support', 'Sports Medicine'],
    },
    {
        key: 'pediatrics',
        name: 'Pediatrics',
        description: 'Dedicated healthcare for children from infancy through adolescence with compassionate, specialized support.',
        image: '/clinic-assets/pediatrics-4.webp',
        icon: 'fas fa-child',
        features: ['Well-Child Visits', 'Immunizations'],
    },
    {
        key: 'emergency',
        name: 'Emergency Care',
        description: 'Responsive urgent care services with timely assessment pathways and dependable critical support coordination.',
        image: '/clinic-assets/emergency-1.webp',
        icon: 'fas fa-ambulance',
        features: ['Rapid Response', 'Critical Care'],
    },
    {
        key: 'laboratory',
        name: 'Laboratory Testing',
        description: 'Diagnostic laboratory services with comprehensive testing panels and fast result coordination for patients.',
        image: '/clinic-assets/facilities-6.webp',
        icon: 'fas fa-microscope',
        features: ['Blood Tests', 'Pathology'],
    },
];

const resolveServiceBlueprint = (service, index) => {
    const normalized = (service?.name || '').toLowerCase();

    const matched = fallbackServices.find((item) => normalized.includes(item.key)
        || normalized.includes(item.name.toLowerCase())
        || (item.key === 'cardiology' && normalized.includes('heart'))
        || (item.key === 'orthopedics' && normalized.includes('ortho'))
        || (item.key === 'laboratory' && (normalized.includes('lab') || normalized.includes('test')))
        || (item.key === 'emergency' && normalized.includes('emergency')));

    return matched || fallbackServices[index % fallbackServices.length];
};

export default function Services({ auth, services = [] }) {
    const learnMoreHref = auth?.user?.role === 'patient' ? '/patient/home-services/book' : '/contact';

    const displayedServices = useMemo(() => {
        if (services.length > 0) {
            return services.slice(0, 6).map((service, index) => {
                const blueprint = resolveServiceBlueprint(service, index);
                const dynamicFeatures = [
                    service.duration_minutes ? `${service.duration_minutes} Min Visit` : blueprint.features[0],
                    service.base_price ? `From ₹${Number(service.base_price).toLocaleString('en-IN')}` : (service.category_name || blueprint.features[1]),
                ];

                return {
                    ...blueprint,
                    id: service.id,
                    code: service.code,
                    name: service.name || blueprint.name,
                    description: service.description || blueprint.description,
                    image: blueprint.image,
                    features: dynamicFeatures,
                    link: `/services/${service.code || service.id}`,
                };
            });
        }

        return fallbackServices.map((service) => ({
            ...service,
            code: service.key,
            link: `/services/${service.key}`,
        }));
    }, [services]);

    return (
        <>
            <Head title="Services - Hello Doctors">
                <meta name="description" content="Explore healthcare and home services available through Hello Doctors, from diagnostics to specialist support." />
                <meta name="keywords" content="services, healthcare services, diagnostics, home care, consultation, hello doctors" />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/services` : '/services'} />
            </Head>

            <PublicLayout auth={auth} title="Services - Hello Doctors" pageClassName="services-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Services</h1>
                                    <p className="mb-0">
                                        Explore trusted medical and home-health support services designed to make care access simpler, faster, and more dependable.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Services</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="services" className="services section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row gy-4">
                            {displayedServices.map((service, index) => (
                                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={200 + (index * 50)} key={service.id || service.key}>
                                    <div className="service-item">
                                        <div className="service-image">
                                            <img src={service.image} alt={`${service.name} Services`} className="img-fluid" />
                                            <div className="service-overlay">
                                                <i className={service.icon} />
                                            </div>
                                        </div>
                                        <div className="service-content">
                                            <h3>{service.name}</h3>
                                            <p>{service.description}</p>
                                            <div className="service-features">
                                                {service.features.map((feature) => (
                                                    <span className="feature-item" key={`${service.name}-${feature}`}>
                                                        <i className="fas fa-check" /> {feature}
                                                    </span>
                                                ))}
                                            </div>
                                            <Link href={service.link} className="service-btn">
                                                <span>Learn More</span>
                                                <i className="fas fa-arrow-right" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
