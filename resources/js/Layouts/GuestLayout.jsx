import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { site } = usePage().props;
    const siteName = site?.name || 'Hello Doctors';
    const siteTagline = site?.tagline || 'Patient Care Network';
    const siteLogo = site?.logo || null;
    const siteFavicon = site?.favicon || null;

    return (
        <>
            <Head>
                {siteFavicon && <link rel="icon" href={siteFavicon} head-key="site-favicon" />}
                {siteFavicon && <link rel="shortcut icon" href={siteFavicon} head-key="site-shortcut-favicon" />}
                {siteFavicon && <link rel="apple-touch-icon" href={siteFavicon} head-key="site-apple-touch-icon" />}
                <link rel="preload" href="/clinic-theme/vendor/bootstrap/css/bootstrap.min.css" as="style" />
                <link rel="preload" href="/clinic-theme/vendor/bootstrap-icons/bootstrap-icons.css" as="style" />
                <link rel="preload" href="/clinic-theme/main.css" as="style" />
            </Head>

            <div className="auth-shell">
                <div className="auth-card">
                    <aside className="auth-brand">
                        <div>
                            <a href="/" className="auth-logo-wrap" aria-label="Go to homepage">
                            {siteLogo ? (
                                <img
                                    src={siteLogo}
                                    alt={siteName}
                                    className="h-9"
                                    style={{ objectFit: 'contain', width: 'auto' }}
                                />
                            ) : (
                                <ApplicationLogo className="h-9 w-9 fill-current text-white" />
                            )}
                                <div>
                                    <div className="auth-logo-title">{siteName}</div>
                                    <div className="auth-logo-subtitle">{siteTagline}</div>
                                </div>
                            </a>

                        <h1 className="auth-brand-title">The future of healthcare booking starts here.</h1>
                        <p className="auth-brand-copy">
                            Manage appointments, home services, and your medical journey through one trusted platform.
                        </p>

                        <div className="auth-disclosure">
                            <h3>E-Sign Notice and Consent</h3>
                            <p>
                                Before proceeding, please confirm that you have read and accepted our electronic consent terms.
                            </p>
                            <a href="#" onClick={(e) => e.preventDefault()}>Read E-Sign Disclosure</a>
                        </div>
                    </div>

                    <div className="auth-brand-glow" aria-hidden="true" />
                </aside>

                <main className="auth-panel">
                    <div className="auth-content">{children}</div>
                </main>
            </div>
        </div>
        </>
    );
}
