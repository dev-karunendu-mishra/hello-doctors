import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <aside className="auth-brand">
                    <div>
                        <Link href="/" className="auth-logo-wrap" aria-label="Go to homepage">
                            <ApplicationLogo className="h-9 w-9 fill-current text-white" />
                            <div>
                                <div className="auth-logo-title">Hello Doctors</div>
                                <div className="auth-logo-subtitle">Patient Care Network</div>
                            </div>
                        </Link>

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
    );
}
