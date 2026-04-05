import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackDepartments = [
    {
        key: 'neurology',
        tabLabel: 'Neurology',
        cardTitle: 'Neurology',
        title: 'Neurological Sciences Department',
        description: 'Advanced treatment for neurological disorders with cutting-edge technology and specialized care teams focused on brain, spine, and nerve health.',
        image: '/clinic-assets/neurology-4.webp',
        cardImage: '/clinic-assets/neurology-4.webp',
        cardIcon: 'fas fa-brain',
        services: [
            { icon: 'fas fa-brain', title: 'Brain Monitoring', description: 'Specialist-led evaluation for complex neurological conditions and ongoing monitoring.' },
            { icon: 'fas fa-wave-square', title: 'EEG Testing', description: 'Modern testing pathways to diagnose seizures, sleep issues, and brain activity concerns.' },
            { icon: 'fas fa-stethoscope', title: 'Neurological Exam', description: 'Comprehensive examinations tailored to symptoms, history, and recovery planning.' },
            { icon: 'fas fa-file-medical', title: 'Treatment Plans', description: 'Evidence-based plans designed around patient needs and long-term outcomes.' },
        ],
        cardDescription: 'Advanced treatment for neurological disorders with specialized doctors and patient-first support.',
    },
    {
        key: 'surgery',
        tabLabel: 'Surgery',
        cardTitle: 'Surgery',
        title: 'Surgical Services Department',
        description: 'Comprehensive surgical support with precision techniques, careful recovery planning, and experienced multidisciplinary teams.',
        image: '/clinic-assets/facilities-6.webp',
        cardImage: '/clinic-assets/facilities-6.webp',
        cardIcon: 'fas fa-cut',
        services: [
            { icon: 'fas fa-cut', title: 'Minimally Invasive', description: 'Procedures designed to reduce recovery time and support better patient comfort.' },
            { icon: 'fas fa-tools', title: 'Advanced Procedures', description: 'Skilled teams using modern equipment for reliable surgical outcomes.' },
            { icon: 'fas fa-shield-alt', title: 'Safe Operations', description: 'Safety-led protocols and monitoring built into every surgical workflow.' },
            { icon: 'fas fa-clock', title: 'Recovery Support', description: 'Structured aftercare and follow-up planning for confident healing.' },
        ],
        cardDescription: 'Expert surgical care offering advanced procedures and recovery-focused treatment.',
    },
    {
        key: 'dental-care',
        tabLabel: 'Dental Care',
        cardTitle: 'Dental Care',
        title: 'Dental Care Department',
        description: 'Complete oral healthcare services covering preventive dentistry, restorative treatment, and smile-focused consultation.',
        image: '/clinic-assets/dermatology-1.webp',
        cardImage: '/clinic-assets/dermatology-1.webp',
        cardIcon: 'fas fa-tooth',
        services: [
            { icon: 'far fa-smile', title: 'Oral Health', description: 'Routine checkups and preventive care for long-term dental wellness.' },
            { icon: 'fas fa-tooth', title: 'Teeth Cleaning', description: 'Professional cleaning services to maintain healthy gums and teeth.' },
            { icon: 'fas fa-star', title: 'Cosmetic Dentistry', description: 'Appearance-focused support for brighter and more confident smiles.' },
            { icon: 'fas fa-cog', title: 'Orthodontics', description: 'Alignment and corrective care with guided treatment recommendations.' },
        ],
        cardDescription: 'Preventive and restorative dental care delivered through modern, patient-friendly support.',
    },
    {
        key: 'ophthalmology',
        tabLabel: 'Ophthalmology',
        cardTitle: 'Ophthalmology',
        title: 'Ophthalmology Department',
        description: 'Specialized eye care for vision screening, retinal imaging, and long-term eye health management across all age groups.',
        image: '/clinic-assets/pediatrics-4.webp',
        cardImage: '/clinic-assets/pediatrics-4.webp',
        cardIcon: 'fas fa-eye',
        services: [
            { icon: 'fas fa-eye', title: 'Vision Testing', description: 'Detailed eye exams for clarity, comfort, and early issue detection.' },
            { icon: 'fas fa-camera', title: 'Retinal Imaging', description: 'Imaging tools to support accurate diagnosis and eye health monitoring.' },
            { icon: 'fas fa-bolt', title: 'Laser Surgery', description: 'Modern treatment options for selected eye conditions and recovery needs.' },
            { icon: 'fas fa-prescription-bottle', title: 'Eye Care Plans', description: 'Personalized treatment and follow-up for ongoing visual health.' },
        ],
        cardDescription: 'Comprehensive eye care and vision services supported by experienced specialists.',
    },
    {
        key: 'cardiology',
        tabLabel: 'Cardiology',
        cardTitle: 'Cardiology',
        title: 'Cardiology Department',
        description: 'Comprehensive heart care with diagnostic precision, preventive guidance, and trusted support from experienced cardiology teams.',
        image: '/clinic-assets/cardiology-1.webp',
        cardImage: '/clinic-assets/cardiology-1.webp',
        cardIcon: 'fas fa-heartbeat',
        services: [
            { icon: 'fas fa-heartbeat', title: 'Heart Monitoring', description: 'Advanced monitoring to support accurate assessment of heart health.' },
            { icon: 'fas fa-chart-line', title: 'ECG Analysis', description: 'Detailed cardiac rhythm evaluation for diagnosis and ongoing care.' },
            { icon: 'fas fa-tint', title: 'Blood Tests', description: 'Diagnostic testing that supports preventive and treatment planning.' },
            { icon: 'fas fa-shield-heart', title: 'Preventive Care', description: 'Risk screening and lifestyle-focused cardiology support for better outcomes.' },
        ],
        cardDescription: 'Advanced heart care with trusted cardiologists dedicated to cardiovascular wellness.',
    },
    {
        key: 'orthopedics',
        tabLabel: 'Orthopedics',
        cardTitle: 'Orthopedics',
        title: 'Orthopedics Department',
        description: 'Bone, joint, and mobility care with structured rehabilitation and support for injury recovery and daily function.',
        image: '/clinic-assets/orthopedics-4.webp',
        cardImage: '/clinic-assets/orthopedics-4.webp',
        cardIcon: 'fas fa-bone',
        services: [
            { icon: 'fas fa-bone', title: 'Joint Care', description: 'Targeted support for pain management, arthritis care, and mobility improvement.' },
            { icon: 'fas fa-person-walking', title: 'Sports Injury', description: 'Recovery pathways for strain, trauma, and performance-related injuries.' },
            { icon: 'fas fa-wheelchair', title: 'Rehab Support', description: 'Rehabilitation-focused planning to help patients return to movement safely.' },
            { icon: 'fas fa-x-ray', title: 'Imaging Review', description: 'Diagnostic evaluation to guide orthopedic care with confidence.' },
        ],
        cardDescription: 'Expert bone and joint care for injuries, mobility concerns, and recovery support.',
    },
];

const resolveDepartmentBlueprint = (name, index) => {
    const normalizedName = (name || '').toLowerCase();

    const matched = fallbackDepartments.find((department) => normalizedName.includes(department.key.replace('-', ' '))
        || normalizedName.includes(department.cardTitle.toLowerCase())
        || (department.key === 'cardiology' && normalizedName.includes('heart'))
        || (department.key === 'orthopedics' && normalizedName.includes('ortho'))
        || (department.key === 'dental-care' && normalizedName.includes('dental'))
        || (department.key === 'ophthalmology' && (normalizedName.includes('ophtha') || normalizedName.includes('eye'))));

    return matched || fallbackDepartments[index % fallbackDepartments.length];
};

export default function Departments({ auth, specialties = [] }) {
    const displayedDepartments = useMemo(() => {
        const items = specialties.length > 0
            ? specialties.slice(0, 6).map((specialty, index) => {
                const blueprint = resolveDepartmentBlueprint(specialty.name, index);

                return {
                    ...blueprint,
                    id: specialty.id ?? blueprint.key,
                    slug: specialty.slug || blueprint.key,
                    tabLabel: specialty.name || blueprint.tabLabel,
                    cardTitle: specialty.name || blueprint.cardTitle,
                    title: specialty.name ? `${specialty.name} Department` : blueprint.title,
                    description: specialty.description || blueprint.description,
                    image: specialty.image_url || blueprint.image,
                    cardImage: specialty.image_url || blueprint.cardImage,
                    doctorsCount: specialty.doctors_count,
                    learnMoreHref: `/departments/${specialty.slug || specialty.id || blueprint.slug || blueprint.key}`,
                };
            })
            : fallbackDepartments.map((department) => ({
                ...department,
                id: department.key,
                slug: department.key,
                doctorsCount: null,
                learnMoreHref: `/departments/${department.key}`,
            }));

        return items;
    }, [specialties]);

    const tabDepartments = displayedDepartments.slice(0, 5);
    const [activeTab, setActiveTab] = useState(tabDepartments[0]?.slug || 'neurology');

    useEffect(() => {
        if (tabDepartments.length > 0 && !tabDepartments.some((department) => department.slug === activeTab)) {
            setActiveTab(tabDepartments[0].slug);
        }
    }, [activeTab, tabDepartments]);

    const pageDescription = displayedDepartments.length > 0
        ? `Explore ${displayedDepartments.length} healthcare departments and browse specialists across Hello Doctors.`
        : 'Explore healthcare departments and browse specialists across Hello Doctors.';

    return (
        <>
            <Head title="Departments - Hello Doctors">
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content="departments, specialties, cardiology, neurology, orthopedics, healthcare" />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/departments` : '/departments'} />
            </Head>

            <PublicLayout auth={auth} title="Departments - Hello Doctors" pageClassName="departments-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Departments</h1>
                                    <p className="mb-0">
                                        Discover trusted specialties, explore dedicated care areas, and connect with experienced doctors for every stage of treatment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Departments</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="departments-tabs" className="departments-tabs section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="medical-specialties">
                            <div className="row">
                                <div className="col-12">
                                    <div className="specialty-navigation">
                                        <div className="nav nav-pills d-flex" id="specialty-tabs" role="tablist" data-aos="fade-up" data-aos-delay="400">
                                            {tabDepartments.map((department, index) => (
                                                <a
                                                    key={department.slug}
                                                    className={`nav-link department-tab ${activeTab === department.slug ? 'active' : ''}`}
                                                    id={`${department.slug}-tab`}
                                                    href={`#departments-tabs-${department.slug}`}
                                                    role="tab"
                                                    aria-controls={`departments-tabs-${department.slug}`}
                                                    aria-selected={activeTab === department.slug}
                                                    data-aos="fade-up"
                                                    data-aos-delay={100 + (index * 50)}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setActiveTab(department.slug);
                                                    }}
                                                >
                                                    {department.tabLabel}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="tab-content department-content" id="specialty-content" data-aos="fade-up" data-aos-delay="500">
                                        {tabDepartments.map((department) => (
                                            <div
                                                key={department.slug}
                                                className={`tab-pane fade ${activeTab === department.slug ? 'show active' : ''}`}
                                                id={`departments-tabs-${department.slug}`}
                                                role="tabpanel"
                                                aria-labelledby={`${department.slug}-tab`}
                                            >
                                                <div className="row department-layout">
                                                    <div className="col-lg-4 order-lg-2">
                                                        <div className="department-image">
                                                            <img src={department.image} alt={department.title} className="img-fluid" />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-8 order-lg-1">
                                                        <div className="department-info">
                                                            <h2 className="department-title">{department.title}</h2>
                                                            <p className="department-description">
                                                                {department.description}
                                                                {department.doctorsCount ? ` Currently featuring ${department.doctorsCount} verified doctors on Hello Doctors.` : ''}
                                                            </p>

                                                            <div className="row mt-4">
                                                                {department.services.map((service) => (
                                                                    <div className="col-md-6" key={`${department.slug}-${service.title}`}>
                                                                        <div className="service-item">
                                                                            <div className="service-icon">
                                                                                <i className={service.icon} />
                                                                            </div>
                                                                            <div className="service-content">
                                                                                <h4>{service.title}</h4>
                                                                                <p>{service.description}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="departments" className="departments section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-5">
                            {displayedDepartments.map((department, index) => (
                                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={100 + ((index % 3) * 100)} key={`card-${department.slug}`}>
                                    <div className="department-card">
                                        <div className="department-icon">
                                            <i className={department.cardIcon} />
                                        </div>
                                        <div className="department-image">
                                            <img src={department.cardImage} alt={`${department.cardTitle} Department`} className="img-fluid" />
                                        </div>
                                        <div className="department-content">
                                            <h3>{department.cardTitle}</h3>
                                            <p>
                                                {department.cardDescription}
                                                {department.doctorsCount ? ` ${department.doctorsCount} doctors currently available.` : ''}
                                            </p>
                                            <Link href={department.learnMoreHref} className="learn-more">
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
