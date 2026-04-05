import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const intellectualPropertyItems = [
    'Platform content, branding, and presentation remain the property of Hello Doctors or its licensors',
    'You may not copy, republish, or modify protected materials without permission',
    'Any trademarks, logos, and platform identifiers must not be misused',
    'Public content is intended for lawful, personal, and informational use unless otherwise allowed',
];

const prohibitedItems = [
    'Systematic scraping or unauthorized extraction of platform data',
    'Posting malicious, misleading, or unlawful content',
    'Attempting to bypass security or gain unauthorized access',
    'Using the platform in a way that disrupts service availability or trust',
];

const disclaimerItems = [
    'The platform will always meet every personal or clinical expectation',
    'Services, listings, or availability will be uninterrupted at all times',
    'Information from third parties will always be complete or error-free',
    'Every technical issue can be corrected immediately without delay',
];

export default function Terms({ auth }) {
    return (
        <>
            <Head title="Terms - Hello Doctors">
                <meta
                    name="description"
                    content="Read the Hello Doctors terms of service covering platform use, account responsibilities, prohibited activity, and important legal conditions."
                />
                <meta
                    name="keywords"
                    content="hello doctors terms, terms of service, platform conditions, healthcare directory terms"
                />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/terms` : '/terms'} />
            </Head>

            <PublicLayout auth={auth} title="Terms - Hello Doctors" pageClassName="terms-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Terms</h1>
                                    <p className="mb-0">
                                        Review the terms that govern use of Hello Doctors, including account responsibilities, acceptable use, and important service conditions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Terms</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="terms-of-service" className="terms-of-service section">
                    <div className="container" data-aos="fade-up">
                        <div className="tos-header text-center" data-aos="fade-up">
                            <span className="last-updated">Last Updated: April 4, 2026</span>
                            <h2>Terms of Service</h2>
                            <p>Please read these terms carefully before using Hello Doctors and related services.</p>
                        </div>

                        <div className="tos-content" data-aos="fade-up" data-aos-delay="200">
                            <div id="agreement" className="content-section">
                                <h3>1. Agreement to Terms</h3>
                                <p>
                                    By accessing or using Hello Doctors, you agree to follow these Terms of Service and all applicable laws. If you do not agree with these terms, you should not use the platform.
                                </p>
                                <div className="info-box">
                                    <i className="bi bi-info-circle" />
                                    <p>These terms apply to patients, doctors, providers, visitors, and other users of the platform.</p>
                                </div>
                            </div>

                            <div id="intellectual-property" className="content-section">
                                <h3>2. Intellectual Property Rights</h3>
                                <p>
                                    The Hello Doctors platform, including its content, branding, features, and overall functionality, is protected by applicable intellectual property laws.
                                </p>
                                <ul className="list-items">
                                    {intellectualPropertyItems.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div id="user-accounts" className="content-section">
                                <h3>3. User Accounts</h3>
                                <p>
                                    When creating an account or submitting professional details, you agree to provide accurate, current, and complete information. Failure to do so may result in restricted access or account removal.
                                </p>
                                <div className="alert-box">
                                    <i className="bi bi-exclamation-triangle" />
                                    <div className="alert-content">
                                        <h5>Important Notice</h5>
                                        <p>You are responsible for keeping your login credentials secure and for activity carried out under your account.</p>
                                    </div>
                                </div>
                            </div>

                            <div id="prohibited" className="content-section">
                                <h3>4. Prohibited Activities</h3>
                                <p>You may not use Hello Doctors for any unlawful, harmful, deceptive, or unauthorized purpose.</p>
                                <div className="prohibited-list">
                                    {prohibitedItems.map((item) => (
                                        <div key={item} className="prohibited-item">
                                            <i className="bi bi-x-circle" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div id="disclaimer" className="content-section">
                                <h3>5. Disclaimers</h3>
                                <p>
                                    Hello Doctors is provided on an "as available" basis. While we aim to improve discovery and access to healthcare information, we do not make unlimited guarantees about uninterrupted availability or third-party accuracy.
                                </p>
                                <div className="disclaimer-box">
                                    <p>We do not guarantee that:</p>
                                    <ul>
                                        {disclaimerItems.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div id="limitation" className="content-section">
                                <h3>6. Limitation of Liability</h3>
                                <p>
                                    To the extent permitted by law, Hello Doctors will not be liable for indirect, incidental, special, or consequential damages arising from platform use, service interruptions, or reliance on third-party content.
                                </p>
                            </div>

                            <div id="indemnification" className="content-section">
                                <h3>7. Indemnification</h3>
                                <p>
                                    You agree to defend, indemnify, and hold harmless Hello Doctors from claims, losses, liabilities, and expenses arising out of misuse of the platform or violation of these terms.
                                </p>
                            </div>

                            <div id="termination" className="content-section">
                                <h3>8. Termination</h3>
                                <p>
                                    We may suspend or terminate access to the platform if these terms are violated, if security concerns arise, or if access must be restricted for operational or legal reasons.
                                </p>
                            </div>

                            <div id="governing-law" className="content-section">
                                <h3>9. Governing Law</h3>
                                <p>
                                    These terms are governed by applicable laws of India, without regard to conflict of law principles, unless a different legal requirement applies.
                                </p>
                            </div>

                            <div id="changes" className="content-section">
                                <h3>10. Changes to Terms</h3>
                                <p>
                                    We may revise these Terms of Service from time to time. Updated terms will be posted on this page with a revised date whenever changes become effective.
                                </p>
                                <div className="notice-box">
                                    <i className="bi bi-bell" />
                                    <p>By continuing to use Hello Doctors after updates are posted, you agree to the revised terms.</p>
                                </div>
                            </div>
                        </div>

                        <div className="tos-contact" data-aos="fade-up" data-aos-delay="300">
                            <div className="contact-box">
                                <div className="contact-icon">
                                    <i className="bi bi-envelope" />
                                </div>
                                <div className="contact-content">
                                    <h4>Questions About Terms?</h4>
                                    <p>If you need clarification about these terms or platform usage conditions, please contact our support team.</p>
                                    <Link href="/contact" className="contact-link">Contact Support</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
