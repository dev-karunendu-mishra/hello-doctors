import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const privacySections = [
    {
        title: '1. Introduction',
        paragraphs: [
            'When you use Hello Doctors, you trust us with personal information related to doctor discovery, communication, and healthcare support. We take that responsibility seriously and aim to protect your information at every stage.',
            'This Privacy Policy explains what information we collect, why we collect it, how we use it, and the choices you have regarding your personal data while using our platform and related services.',
        ],
    },
    {
        title: '2. Information We Collect',
        paragraphs: [
            'We collect information needed to deliver a secure, reliable, and personalized healthcare discovery experience.',
        ],
        subsections: [
            {
                title: '2.1 Information You Provide',
                paragraph: 'When you register, contact us, or interact with Hello Doctors, you may provide:',
                list: [
                    'Your name, email address, phone number, and account details',
                    'Profile or professional information submitted during doctor or provider onboarding',
                    'Messages, support requests, or other communication preferences',
                    'Appointment-related or service inquiry details when applicable',
                ],
            },
            {
                title: '2.2 Automatic Information',
                paragraph: 'When you browse the platform, certain information may be collected automatically, such as:',
                list: [
                    'Device, browser, and operating system details',
                    'Usage data, pages visited, and session activity',
                    'Log information and technical diagnostics',
                    'Approximate location or network information where enabled or required',
                ],
            },
        ],
    },
    {
        title: '3. How We Use Your Information',
        paragraphs: [
            'We use the information we collect to operate, improve, and protect Hello Doctors for patients, doctors, and providers.',
        ],
        list: [
            'Provide access to doctor listings, specialties, and healthcare discovery tools',
            'Respond to support requests, onboarding queries, and contact submissions',
            'Maintain platform security, verify identities, and prevent misuse',
            'Improve usability, performance, and service quality over time',
            'Send important updates related to platform operations or support activity',
        ],
    },
    {
        title: '4. Information Sharing and Disclosure',
        paragraphs: [
            'We do not sell your personal data. We only share information when it is necessary to deliver services, comply with law, or protect users and the platform.',
        ],
        subsections: [
            {
                title: '4.1 With Your Consent',
                paragraph: 'We may share information when you request a service, submit details for onboarding, or otherwise authorize us to do so.',
            },
            {
                title: '4.2 For Legal and Safety Reasons',
                paragraph: 'We may disclose information when reasonably necessary to comply with legal obligations, enforce our terms, investigate fraud, or protect users, providers, and the public.',
                list: [
                    'To meet applicable legal, regulatory, or governmental requirements',
                    'To enforce our platform rules and service terms',
                    'To detect, prevent, or address fraud, abuse, or technical issues',
                    'To protect the rights, property, and safety of users and the Hello Doctors platform',
                ],
            },
        ],
    },
    {
        title: '5. Data Security',
        paragraphs: [
            'We use appropriate administrative and technical safeguards to help protect personal data from unauthorized access, misuse, alteration, or disclosure.',
        ],
        list: [
            'Secure transport and protected access controls',
            'Internal review of storage and processing practices',
            'Restricted access for authorized personnel only',
        ],
    },
    {
        title: '6. Your Rights and Choices',
        paragraphs: [
            'Depending on applicable law, you may have rights related to your personal information and how it is used.',
        ],
        list: [
            'Request access to the personal information we hold about you',
            'Ask for corrections to inaccurate or outdated details',
            'Request deletion of data where appropriate',
            'Object to or restrict certain processing activities',
        ],
    },
    {
        title: '7. Changes to This Policy',
        paragraphs: [
            'We may update this Privacy Policy from time to time to reflect service improvements, legal requirements, or operational changes. When updates are made, the revised effective date will be shown on this page.',
            'Your continued use of Hello Doctors after policy updates means you accept the revised policy terms.',
        ],
    },
];

export default function Privacy({ auth }) {
    return (
        <>
            <Head title="Privacy - Hello Doctors">
                <meta
                    name="description"
                    content="Read the Hello Doctors privacy policy to understand how personal information is collected, used, protected, and managed across the platform."
                />
                <meta
                    name="keywords"
                    content="hello doctors privacy policy, healthcare privacy, patient data, doctor platform privacy"
                />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/privacy` : '/privacy'} />
            </Head>

            <PublicLayout auth={auth} title="Privacy - Hello Doctors" pageClassName="privacy-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Privacy</h1>
                                    <p className="mb-0">
                                        Learn how Hello Doctors collects, uses, protects, and manages your information while helping patients and providers connect through our healthcare platform.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Privacy</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="privacy" className="privacy section">
                    <div className="container" data-aos="fade-up">
                        <div className="privacy-header" data-aos="fade-up">
                            <div className="header-content">
                                <div className="last-updated">Effective Date: April 4, 2026</div>
                                <h1>Privacy Policy</h1>
                                <p className="intro-text">
                                    This Privacy Policy describes how Hello Doctors collects, uses, processes, and discloses information in connection with your access to and use of our services.
                                </p>
                            </div>
                        </div>

                        <div className="privacy-content" data-aos="fade-up">
                            {privacySections.map((section) => (
                                <div key={section.title} className="content-section">
                                    <h2>{section.title}</h2>

                                    {section.paragraphs?.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}

                                    {section.list && (
                                        <ul>
                                            {section.list.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    )}

                                    {section.subsections?.map((subsection) => (
                                        <div key={subsection.title}>
                                            <h3>{subsection.title}</h3>
                                            {subsection.paragraph && <p>{subsection.paragraph}</p>}
                                            {subsection.list && (
                                                <ul>
                                                    {subsection.list.map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="privacy-contact" data-aos="fade-up">
                            <h2>Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy or how your information is handled, please reach out through our support team.
                            </p>
                            <div className="contact-details">
                                <p><strong>Email:</strong> privacy@hellodoctors.in</p>
                                <p><strong>Address:</strong> Healthcare Network, Uttar Pradesh, India</p>
                            </div>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
