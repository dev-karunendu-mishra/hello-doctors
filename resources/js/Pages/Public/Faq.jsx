import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackFaqItems = [
    {
        question: 'How do I find the right doctor on Hello Doctors?',
        answer: 'Use the Doctors page to browse verified profiles by specialty, city, and care need. You can compare experience, services, and profile details before deciding which doctor fits you best.',
    },
    {
        question: 'Can I contact a doctor or request help through the platform?',
        answer: 'Yes. You can explore doctor profiles, use the contact page for support, and reach out for onboarding or consultation assistance from the Hello Doctors team whenever you need guidance.',
    },
    {
        question: 'Are listed doctors and providers verified before appearing publicly?',
        answer: 'Hello Doctors is designed to surface active and verified medical professionals and service providers, helping patients discover trusted care options with greater confidence.',
    },
    {
        question: 'What types of departments and services can I browse here?',
        answer: 'You can explore public departments, home-care related services, and specialist listings across multiple healthcare categories, all presented in a simple patient-friendly format.',
    },
    {
        question: 'How can doctors, clinics, or providers join Hello Doctors?',
        answer: 'Medical professionals and providers can use the registration pages to start onboarding. Once submitted, the team reviews details and helps complete the profile setup process.',
    },
];

export default function Faq({ auth, faqItems = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const items = faqItems.length ? faqItems : fallbackFaqItems;

    const toggleFaq = (index) => {
        setActiveIndex((current) => (current === index ? -1 : index));
    };

    return (
        <>
            <Head title="FAQ - Hello Doctors">
                <meta
                    name="description"
                    content="Find answers to common questions about Hello Doctors, including browsing doctors, services, verification, support, and onboarding."
                />
                <meta
                    name="keywords"
                    content="hello doctors faq, healthcare faq, patient support, doctor listing help, medical platform questions"
                />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/faq` : '/faq'} />
            </Head>

            <PublicLayout auth={auth} title="FAQ - Hello Doctors" pageClassName="faq-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Frequently Asked Questions</h1>
                                    <p className="mb-0">
                                        Get quick answers about discovering doctors, browsing healthcare services, contacting support, and joining the Hello Doctors network.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Faq</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="faq" className="faq section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row justify-content-center">
                            <div className="col-lg-9">
                                <div className="faq-wrapper">
                                    {items.map((item, index) => {
                                        const isActive = activeIndex === index;

                                        return (
                                            <div
                                                key={item.question}
                                                className={`faq-item ${isActive ? 'faq-active' : ''}`}
                                                data-aos="fade-up"
                                                data-aos-delay={150 + index * 50}
                                            >
                                                <div
                                                    className="faq-header"
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => toggleFaq(index)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            toggleFaq(index);
                                                        }
                                                    }}
                                                    aria-expanded={isActive}
                                                >
                                                    <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                                                    <h4>{item.question}</h4>
                                                    <div className="faq-toggle">
                                                        <i className="bi bi-plus" />
                                                        <i className="bi bi-dash" />
                                                    </div>
                                                </div>
                                                <div className="faq-content">
                                                    <div className="content-inner">
                                                        <p>{item.answer}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
