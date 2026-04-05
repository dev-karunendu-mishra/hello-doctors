import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackDetailContent = [
    {
        key: 'neurology',
        heroTitle: 'Advanced Neurological Care',
        intro: 'Comprehensive neurological assessment and treatment supported by specialist-led diagnosis, monitoring, and long-term recovery planning.',
        primaryImage: '/clinic-assets/neurology-4.webp',
        secondaryImage: '/clinic-assets/neurology-4.webp',
        floatingIcon: 'bi bi-cpu',
        floatingTitle: 'Brain Health Experts',
        floatingText: 'Specialized neurological assessment and treatment support',
        highlights: [
            { number: '24/7', text: 'Emergency Neurology' },
            { number: '15+', text: 'Specialist Neurologists' },
            { number: '95%', text: 'Patient Satisfaction' },
        ],
        servicesTitle: 'Our Neurological Services',
        servicesIntro: 'Explore dedicated neurology support ranging from diagnosis to rehabilitation and ongoing care management.',
        services: [
            { icon: 'bi bi-lightning-charge', title: 'Epilepsy Treatment', description: 'Targeted neurological care plans tailored to patient history and symptom severity.' },
            { icon: 'bi bi-search', title: 'Diagnostic Imaging', description: 'Advanced imaging and assessment workflows that support accurate treatment decisions.' },
            { icon: 'bi bi-heart-pulse', title: 'Stroke Prevention', description: 'Preventive screening and ongoing monitoring designed to reduce neurological risk.' },
            { icon: 'bi bi-person-gear', title: 'Movement Disorders', description: 'Support for tremors, Parkinsonian symptoms, and motor coordination concerns.' },
            { icon: 'bi bi-moon', title: 'Sleep Disorders', description: 'Specialist guidance for sleep-linked neurological symptoms and recovery plans.' },
            { icon: 'bi bi-shield-check', title: 'Memory Care', description: 'Care pathways for cognitive changes, memory issues, and family-led support.' },
        ],
        expertiseTitle: 'Leading Neurological Expertise',
        expertiseLead: 'Our neurological teams focus on compassionate, evidence-based care backed by modern facilities and multidisciplinary collaboration.',
        expertiseList: [
            'Board-certified neurologists and neurosurgeons',
            'State-of-the-art diagnostic equipment and facilities',
            'Comprehensive care from diagnosis to rehabilitation',
            'Personalized treatment plans for every patient',
        ],
        contactLabel: 'Emergency Neurology',
    },
    {
        key: 'cardiology',
        heroTitle: 'Advanced Cardiac Care',
        intro: 'Heart health support with preventive screening, detailed cardiac assessment, and specialist-led consultation focused on long-term wellness.',
        primaryImage: '/clinic-assets/cardiology-1.webp',
        secondaryImage: '/clinic-assets/cardiology-1.webp',
        floatingIcon: 'bi bi-heart-pulse',
        floatingTitle: 'Heart Care Experts',
        floatingText: 'Preventive and specialist cardiac support for every stage of care',
        highlights: [
            { number: '24/7', text: 'Emergency Cardiology' },
            { number: '12+', text: 'Cardiac Specialists' },
            { number: '97%', text: 'Patient Confidence' },
        ],
        servicesTitle: 'Our Cardiology Services',
        servicesIntro: 'Browse heart-focused care pathways designed for diagnosis, prevention, and ongoing cardiovascular treatment.',
        services: [
            { icon: 'bi bi-heart-pulse', title: 'Heart Monitoring', description: 'Reliable cardiac observation and diagnostics for rhythm and function assessment.' },
            { icon: 'bi bi-activity', title: 'ECG Analysis', description: 'Clinical ECG review for early detection and treatment planning.' },
            { icon: 'bi bi-droplet', title: 'Blood Testing', description: 'Risk-aware diagnostic testing supporting cardiovascular care decisions.' },
            { icon: 'bi bi-shield-heart', title: 'Preventive Care', description: 'Heart health counselling and screening for long-term wellness support.' },
            { icon: 'bi bi-hospital', title: 'Clinical Support', description: 'Specialist-guided hospital and outpatient cardiology consultation.' },
            { icon: 'bi bi-clipboard2-pulse', title: 'Recovery Planning', description: 'Recovery-focused monitoring and follow-up after treatment or intervention.' },
        ],
        expertiseTitle: 'Trusted Cardiology Leadership',
        expertiseLead: 'The department combines preventive care, monitoring, and specialist consultation to help patients manage heart health with confidence.',
        expertiseList: [
            'Experienced cardiologists and diagnostic teams',
            'Preventive screening and cardiac wellness support',
            'Personalized heart-health consultation plans',
            'Follow-up care for recovery and monitoring',
        ],
        contactLabel: 'Emergency Cardiology',
    },
    {
        key: 'orthopedics',
        heroTitle: 'Advanced Orthopedic Care',
        intro: 'Bone, joint, and mobility care designed to restore movement, reduce discomfort, and support safer daily activity with expert guidance.',
        primaryImage: '/clinic-assets/orthopedics-4.webp',
        secondaryImage: '/clinic-assets/orthopedics-4.webp',
        floatingIcon: 'bi bi-universal-access',
        floatingTitle: 'Mobility Care Experts',
        floatingText: 'Structured orthopedic assessment, rehab, and recovery support',
        highlights: [
            { number: '7 Days', text: 'Ortho Consultations' },
            { number: '10+', text: 'Ortho Specialists' },
            { number: '94%', text: 'Recovery Satisfaction' },
        ],
        servicesTitle: 'Our Orthopedic Services',
        servicesIntro: 'From injuries to rehabilitation, the department supports patients across key orthopedic and mobility-related needs.',
        services: [
            { icon: 'bi bi-bandaid', title: 'Joint Pain Care', description: 'Targeted assessment and treatment planning for knee, hip, and shoulder pain.' },
            { icon: 'bi bi-person-walking', title: 'Sports Injury', description: 'Recovery pathways for sprains, trauma, and return-to-activity support.' },
            { icon: 'bi bi-universal-access-circle', title: 'Mobility Rehab', description: 'Rehabilitation and strengthening plans tailored to functional goals.' },
            { icon: 'bi bi-clipboard2-pulse', title: 'Follow-up Care', description: 'Structured check-ins to support healing, movement, and long-term outcomes.' },
            { icon: 'bi bi-building', title: 'Clinical Evaluation', description: 'Specialist consultation and diagnostic review in trusted care settings.' },
            { icon: 'bi bi-shield-check', title: 'Injury Prevention', description: 'Preventive guidance for posture, movement safety, and recurring pain management.' },
        ],
        expertiseTitle: 'Comprehensive Orthopedic Expertise',
        expertiseLead: 'Our orthopedic care blends assessment, rehabilitation, and recovery-led planning to help patients regain confidence in movement.',
        expertiseList: [
            'Experienced orthopedic and rehabilitation teams',
            'Care for injuries, mobility issues, and chronic pain',
            'Structured treatment and rehabilitation planning',
            'Patient-first guidance for safer recovery',
        ],
        contactLabel: 'Orthopedic Support',
    },
];

const resolveDetailBlueprint = (name = '') => {
    const normalizedName = name.toLowerCase();

    return fallbackDetailContent.find((item) => normalizedName.includes(item.key)
        || (item.key === 'cardiology' && normalizedName.includes('heart'))
        || (item.key === 'orthopedics' && normalizedName.includes('ortho'))
        || (item.key === 'neurology' && normalizedName.includes('neuro'))) || fallbackDetailContent[0];
};

export default function DepartmentDetails({ auth, specialty }) {
    const { site = {} } = usePage().props;
    const detail = resolveDetailBlueprint(specialty?.name || '');
    const pageTitle = `${specialty?.name || 'Department'} Details - Hello Doctors`;
    const canonicalPath = `/departments/${specialty?.slug || specialty?.id || 'department'}`;
    const consultationLink = specialty?.id ? `/doctors?specialty=${specialty.id}` : '/doctors';
    const specialistsCount = specialty?.doctors_count ? `${specialty.doctors_count}+` : detail.highlights[1].number;
    const contactPhone = site?.contact?.phone || '+91 (555) 123-4567';

    const highlights = [
        detail.highlights[0],
        { number: specialistsCount, text: `${specialty?.name || 'Department'} Specialists` },
        detail.highlights[2],
    ];

    return (
        <>
            <Head title={pageTitle}>
                <meta
                    name="description"
                    content={specialty?.description || `${specialty?.name || 'Department'} consultation, care pathways, and specialist support at Hello Doctors.`}
                />
                <meta name="keywords" content={`${specialty?.name || 'department'}, department details, specialist care, hello doctors`} />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : canonicalPath} />
            </Head>

            <PublicLayout auth={auth} title={pageTitle} pageClassName="department-details-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Department Details</h1>
                                    <p className="mb-0">
                                        Discover expert-led care, department highlights, and specialist services tailored to {specialty?.name || 'your healthcare needs'}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li><Link href="/departments">Departments</Link></li>
                                <li className="current">Department Details</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="department-details" className="department-details section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row">
                            <div className="col-xl-6 col-lg-7">
                                <div className="department-hero" data-aos="fade-right" data-aos-delay="200">
                                    <div className="badge-wrap">
                                        <span className="specialty-badge">{specialty?.name || 'Department'}</span>
                                    </div>
                                    <h1 className="department-title">{detail.heroTitle}</h1>
                                    <p className="department-intro">
                                        {specialty?.description || detail.intro}
                                    </p>

                                    <div className="key-highlights">
                                        {highlights.map((highlight) => (
                                            <div className="highlight-item" key={`${highlight.number}-${highlight.text}`}>
                                                <span className="highlight-number">{highlight.number}</span>
                                                <span className="highlight-text">{highlight.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="action-group">
                                        <Link href={consultationLink} className="btn-primary">Schedule Consultation</Link>
                                        <Link href="/departments" className="btn-secondary">
                                            <span>View All Departments</span>
                                            <i className="bi bi-arrow-right" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-6 col-lg-5">
                                <div className="department-visual" data-aos="fade-left" data-aos-delay="300">
                                    <div className="image-container">
                                        <img
                                            src={specialty?.image_url || detail.primaryImage}
                                            alt={`${specialty?.name || 'Department'} Department`}
                                            className="img-fluid primary-image"
                                        />
                                        <div className="floating-card" data-aos="zoom-in" data-aos-delay="500">
                                            <div className="card-icon">
                                                <i className={detail.floatingIcon} />
                                            </div>
                                            <div className="card-content">
                                                <h4>{detail.floatingTitle}</h4>
                                                <p>{detail.floatingText}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="services-overview" data-aos="fade-up" data-aos-delay="400">
                            <div className="row justify-content-center">
                                <div className="col-lg-8">
                                    <div className="overview-header">
                                        <h3>{detail.servicesTitle}</h3>
                                        <p>{detail.servicesIntro}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="row gy-4 services-grid">
                                {detail.services.map((service, index) => (
                                    <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={500 + (index * 50)} key={service.title}>
                                        <div className="service-item">
                                            <div className="service-icon">
                                                <i className={service.icon} />
                                            </div>
                                            <h4>{service.title}</h4>
                                            <p>{service.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="expert-care-section" data-aos="fade-up" data-aos-delay="800">
                            <div className="row align-items-center">
                                <div className="col-lg-5" data-aos="fade-right" data-aos-delay="900">
                                    <div className="expert-image">
                                        <img src={specialty?.image_url || detail.secondaryImage} alt={`${specialty?.name || 'Department'} Expert`} className="img-fluid" />
                                    </div>
                                </div>

                                <div className="col-lg-7" data-aos="fade-left" data-aos-delay="900">
                                    <div className="expert-content">
                                        <h3>{detail.expertiseTitle}</h3>
                                        <p className="lead">{detail.expertiseLead}</p>

                                        <div className="expertise-list">
                                            {detail.expertiseList.map((item) => (
                                                <div className="expertise-item" key={item}>
                                                    <i className="bi bi-check2" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="contact-info">
                                            <div className="contact-item">
                                                <i className="bi bi-telephone" />
                                                <div>
                                                    <span className="contact-label">{detail.contactLabel}</span>
                                                    <span className="contact-value">{contactPhone}</span>
                                                </div>
                                            </div>
                                            <div className="contact-item">
                                                <i className="bi bi-calendar-check" />
                                                <div>
                                                    <span className="contact-label">Appointments</span>
                                                    <span className="contact-value">Mon - Sat, 8:00 AM - 6:00 PM</span>
                                                </div>
                                            </div>
                                        </div>
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
