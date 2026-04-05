import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const helpfulLinks = [
    { href: '/about', icon: 'bi-info-circle', label: 'About Us' },
    { href: '/contact', icon: 'bi-telephone', label: 'Contact' },
    { href: '/services', icon: 'bi-grid-3x3-gap', label: 'Services' },
    { href: '/doctors', icon: 'bi-person-badge', label: 'Doctors' },
    { href: '/faq', icon: 'bi-question-circle', label: 'Support' },
    { href: '/privacy', icon: 'bi-shield-check', label: 'Privacy Policy' },
];

export default function NotFound({ auth }) {
    return (
        <>
            <Head title="404 - Hello Doctors">
                <meta
                    name="description"
                    content="The page you requested could not be found on Hello Doctors. Return to the homepage or explore public healthcare pages."
                />
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <PublicLayout auth={auth} title="404 - Hello Doctors" pageClassName="page-404">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">404</h1>
                                    <p className="mb-0">
                                        The page you requested could not be found. It may have moved, been removed, or the link may be incorrect.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">404</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="error-404" className="error-404 section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row justify-content-center">
                            <div className="col-lg-8 text-center">
                                <div className="error-number" data-aos="zoom-in" data-aos-delay="200">
                                    404
                                </div>

                                <h1 className="error-title" data-aos="fade-up" data-aos-delay="300">
                                    Page Not Found
                                </h1>

                                <p className="error-description" data-aos="fade-up" data-aos-delay="400">
                                    We could not locate the page you were looking for on Hello Doctors. You can return home, browse doctors, or explore other public healthcare pages below.
                                </p>

                                <div className="error-actions" data-aos="fade-up" data-aos-delay="500">
                                    <Link href="/" className="btn-primary">
                                        <i className="bi bi-house" />
                                        Back to Home
                                    </Link>
                                    <Link href="/doctors" className="btn-secondary">
                                        <i className="bi bi-search" />
                                        Browse Doctors
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="row justify-content-center mt-5">
                            <div className="col-lg-10">
                                <div className="helpful-links" data-aos="fade-up" data-aos-delay="600">
                                    <h3>You might be looking for:</h3>
                                    <div className="links-grid">
                                        {helpfulLinks.map((item) => (
                                            <Link key={item.href} href={item.href} className="link-item">
                                                <i className={`bi ${item.icon}`} />
                                                <span>{item.label}</span>
                                            </Link>
                                        ))}
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
