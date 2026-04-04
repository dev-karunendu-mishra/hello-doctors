import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackServiceDetails = [
    {
        key: 'cardiology',
        category: 'Advanced Cardiology',
        title: 'Comprehensive Cardiac Care Services',
        lead: 'Preventive diagnosis and treatment support for cardiovascular concerns using trusted care pathways and specialist review.',
        image: '/clinic-assets/cardiology-1.webp',
        details: [
            { icon: 'bi bi-heart-pulse', title: 'Cardiac Assessment', description: 'Detailed evaluation for heart-health concerns, early diagnosis, and care planning.' },
            { icon: 'bi bi-activity', title: 'Heart Monitoring', description: 'Monitoring support for rhythm changes, symptoms, and follow-up assessment.' },
            { icon: 'bi bi-prescription2', title: 'Treatment Planning', description: 'Guided care planning tailored to cardiovascular needs and recovery goals.' },
        ],
        stats: [
            { number: '95%', label: 'Care Confidence' },
            { number: '24/7', label: 'Emergency Support' },
        ],
        overviewTitle: 'Why Choose Our Cardiology Service',
        overviewText: 'Patients benefit from preventive screening, specialist-led consultation, and structured follow-up support for better heart-health decisions.',
        features: ['Experienced cardiac specialists', 'Fast consultation scheduling', 'Preventive support options', 'Patient-centered treatment'],
        conditions: ['High Blood Pressure', 'Heart Rhythm Issues', 'Chest Pain Review', 'Preventive Cardiology', 'Recovery Support', 'Lifestyle Risk Review'],
        actions: {
            primaryText: 'Book Now',
            primaryAvailability: 'Next available: Tomorrow',
            secondaryText: 'Call Now',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Review',
            tertiaryAvailability: 'Response within 48h',
        },
    },
    {
        key: 'neurology',
        category: 'Advanced Neurology',
        title: 'Comprehensive Neurological Care Services',
        lead: 'Expert diagnosis and treatment for complex neurological conditions using modern assessment workflows and specialist guidance.',
        image: '/clinic-assets/neurology-4.webp',
        details: [
            { icon: 'bi bi-activity', title: 'Neurological Assessment', description: 'Assessment for nerve, brain, and movement-related symptoms with structured review.' },
            { icon: 'bi bi-diagram-2', title: 'Brain Imaging & Diagnosis', description: 'Diagnostic support to identify neurological conditions and guide next steps.' },
            { icon: 'bi bi-prescription2', title: 'Treatment Planning', description: 'Practical care planning tailored to symptoms, recovery, and patient goals.' },
        ],
        stats: [
            { number: '95%', label: 'Success Rate' },
            { number: '24/7', label: 'Emergency Care' },
        ],
        overviewTitle: 'Why Choose Our Neurology Service',
        overviewText: 'The neurology team combines diagnosis, treatment guidance, and ongoing monitoring to support better patient outcomes in complex conditions.',
        features: ['Board Certified Specialists', 'Same Day Appointments', 'Advanced Treatment Options', 'Patient-Centered Care'],
        conditions: ['Stroke Recovery', 'Epilepsy Management', 'Memory Disorders', 'Headache Disorders', 'Movement Disorders', 'Peripheral Neuropathy', 'Multiple Sclerosis', "Parkinson's Disease"],
        actions: {
            primaryText: 'Book Now',
            primaryAvailability: 'Next available: Tomorrow',
            secondaryText: 'Call Now',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Review',
            tertiaryAvailability: 'Response within 48h',
        },
    },
    {
        key: 'laboratory',
        category: 'Advanced Diagnostics',
        title: 'Comprehensive Laboratory Testing Services',
        lead: 'Reliable diagnostic testing support with faster coordination, clearer reporting, and access to follow-up care planning.',
        image: '/clinic-assets/facilities-6.webp',
        details: [
            { icon: 'bi bi-eyedropper', title: 'Sample Collection', description: 'Safe and organized specimen collection for common diagnostic tests and screening panels.' },
            { icon: 'bi bi-search', title: 'Diagnostic Review', description: 'Structured testing workflows designed to support accurate and timely clinical decisions.' },
            { icon: 'bi bi-file-earmark-medical', title: 'Report Guidance', description: 'Simple report coordination and patient-facing support for next-step care.' },
        ],
        stats: [
            { number: '98%', label: 'Report Accuracy' },
            { number: 'Same Day', label: 'Fast Processing' },
        ],
        overviewTitle: 'Why Choose Our Laboratory Services',
        overviewText: 'Diagnostic services are designed for convenience, dependable reporting, and easier coordination with doctors and care teams.',
        features: ['Fast result coordination', 'Comprehensive test options', 'Trusted reporting support', 'Patient-friendly process'],
        conditions: ['Routine Screening', 'Blood Tests', 'Pathology Review', 'Diagnostic Panels', 'Follow-up Testing', 'Preventive Screening'],
        actions: {
            primaryText: 'Book Test',
            primaryAvailability: 'Next slot: Today',
            secondaryText: 'Call Lab',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Info',
            tertiaryAvailability: 'Reply within 24h',
        },
    },
];

const resolveServiceDetailBlueprint = (service = {}) => {
    const normalized = `${service?.name || ''} ${service?.category_name || ''}`.toLowerCase();

    return fallbackServiceDetails.find((item) => normalized.includes(item.key)
        || (item.key === 'cardiology' && normalized.includes('heart'))
        || (item.key === 'neurology' && normalized.includes('neuro'))
        || (item.key === 'laboratory' && (normalized.includes('lab') || normalized.includes('test')))) || fallbackServiceDetails[1];
};

export default function ServiceDetails({ auth, service }) {
    const { site = {} } = usePage().props;
    const detail = resolveServiceDetailBlueprint(service);
    const pageTitle = `${service?.name || 'Service'} Details - Hello Doctors`;
    const canonicalPath = `/services/${service?.code || service?.id || 'service'}`;
    const bookHref = auth?.user?.role === 'patient' ? '/patient/home-services/book' : '/contact';
    const displayCategory = service?.category_name || detail.category;
    const displayTitle = service?.name ? `${service.name} Service Details` : detail.title;
    const statOne = service?.providers_count ? `${service.providers_count}+` : detail.stats[0].number;
    const statTwo = service?.duration_minutes ? `${service.duration_minutes} Min` : detail.stats[1].number;
    const contactPhone = site?.contact?.phone || '+91 (555) 123-4567';
    const contactPhoneHref = `tel:${String(contactPhone).replace(/[^+\d]/g, '')}`;

    return (
        <>
            <Head title={pageTitle}>
                <meta
                    name="description"
                    content={service?.description || `${service?.name || 'Service'} details, features, and consultation support at Hello Doctors.`}
                />
                <meta name="keywords" content={`${service?.name || 'service'}, service details, healthcare support, hello doctors`} />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : canonicalPath} />
            </Head>

            <PublicLayout auth={auth} title={pageTitle} pageClassName="service-details-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Service Details</h1>
                                    <p className="mb-0">
                                        Explore complete information about {service?.name || 'this service'}, including features, care pathways, and booking options.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li><Link href="/services">Services</Link></li>
                                <li className="current">Service Details</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="service-details-2" className="service-details-2 section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row">
                            <div className="col-lg-8 mx-auto text-center mb-5" data-aos="fade-up" data-aos-delay="150">
                                <div className="service-header">
                                    <div className="service-category">
                                        <span>{displayCategory}</span>
                                    </div>
                                    <h2>{displayTitle}</h2>
                                    <p className="lead">{service?.description || detail.lead}</p>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 align-items-center">
                            <div className="col-lg-5" data-aos="fade-right" data-aos-delay="200">
                                <div className="service-details">
                                    {detail.details.map((item) => (
                                        <div className="detail-item" key={item.title}>
                                            <div className="icon-wrapper">
                                                <i className={item.icon} />
                                            </div>
                                            <div className="content">
                                                <h4>{item.title}</h4>
                                                <p>{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-lg-7" data-aos="fade-left" data-aos-delay="300">
                                <div className="service-visual">
                                    <img src={detail.image} alt={`${service?.name || 'Service'} Visual`} className="img-fluid" />
                                    <div className="visual-overlay">
                                        <div className="stats-card">
                                            <div className="stat">
                                                <span className="number">{statOne}</span>
                                                <span className="label">Providers</span>
                                            </div>
                                            <div className="stat">
                                                <span className="number">{statTwo}</span>
                                                <span className="label">Visit Duration</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 mt-5">
                            <div className="col-12" data-aos="fade-up" data-aos-delay="100">
                                <div className="service-overview">
                                    <div className="row align-items-center">
                                        <div className="col-lg-6">
                                            <h3>{detail.overviewTitle}</h3>
                                            <p>{detail.overviewText}</p>

                                            <div className="features-grid">
                                                {detail.features.map((feature) => (
                                                    <div className="feature" key={feature}>
                                                        <i className="bi bi-check2-circle" />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="treatment-areas">
                                                <h4>What This Service Supports</h4>
                                                <div className="condition-tags">
                                                    {detail.conditions.map((condition) => (
                                                        <span className="tag" key={condition}>{condition}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 mt-5">
                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="100">
                                <div className="action-card primary">
                                    <div className="card-header">
                                        <i className="bi bi-calendar-check" />
                                        <h4>Schedule Consultation</h4>
                                    </div>
                                    <p>Book this service with a verified provider through Hello Doctors.</p>
                                    <div className="card-footer">
                                        <Link href={bookHref} className="btn-action">{detail.actions.primaryText}</Link>
                                        <span className="availability">{detail.actions.primaryAvailability}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="200">
                                <div className="action-card secondary">
                                    <div className="card-header">
                                        <i className="bi bi-telephone" />
                                        <h4>Emergency Consultation</h4>
                                    </div>
                                    <p>Connect quickly for urgent support or immediate service coordination.</p>
                                    <div className="card-footer">
                                        <a href={contactPhoneHref} className="btn-action">{detail.actions.secondaryText}</a>
                                        <span className="availability">{contactPhone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="300">
                                <div className="action-card tertiary">
                                    <div className="card-header">
                                        <i className="bi bi-file-text" />
                                        <h4>Get More Details</h4>
                                    </div>
                                    <p>Request additional information about this service and next-step guidance.</p>
                                    <div className="card-footer">
                                        <Link href="/contact" className="btn-action">{detail.actions.tertiaryText}</Link>
                                        <span className="availability">{detail.actions.tertiaryAvailability}</span>
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
