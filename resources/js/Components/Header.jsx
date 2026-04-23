import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Header({ auth }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [morePagesOpen, setMorePagesOpen] = useState(false);
    const [logoLoadFailed, setLogoLoadFailed] = useState(false);
    const { site = {} } = usePage().props;
    const contact = site?.contact || {};
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const siteName = site?.name || 'Hello Doctors';
    const siteLogo = site?.logo || null;
    const normalizedSiteLogo = siteLogo
        ? (siteLogo.startsWith('http://') || siteLogo.startsWith('https://') || siteLogo.startsWith('/'))
            ? siteLogo
            : `/${siteLogo}`
        : null;
    const primaryEmail = contact?.email || 'support@hellodoctors.in';
    const primaryPhone = contact?.phone || '+91 (555) 123-4567';
    const dashboardHref = auth?.user
        ? auth.user.role === 'super_admin'
            ? '/admin/dashboard'
            : auth.user.role === 'doctor'
                ? '/doctor/dashboard'
                : auth.user.role === 'patient'
                    ? '/patient/dashboard'
                    : '/dashboard'
        : '/dashboard';

    const isActive = (href) => {
        if (href === '/') {
            return currentPath === '/';
        }

        return currentPath.startsWith(href);
    };

    const isMorePagesActive = morePagesOpen || ['/faq', '/testimonials', '/terms', '/privacy', '/register-doctor', '/register-provider', '/guest/cancel', '/dashboard', '/login']
        .some((path) => currentPath.startsWith(path));

    const closeMenus = () => {
        setMobileMenuOpen(false);
        setMorePagesOpen(false);
    };

    return (
        <header id="header" className={`header fixed-top ${mobileMenuOpen ? 'mobile-nav-active' : ''}`}>
            <div className="topbar d-flex align-items-center dark-background">
                <div className="container d-flex justify-content-center justify-content-md-between">
                    <div className="contact-info d-flex align-items-center">
                        <i className="bi bi-envelope d-flex align-items-center">
                            <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a>
                        </i>
                        <i className="bi bi-phone d-flex align-items-center ms-4">
                            <span>{primaryPhone}</span>
                        </i>
                    </div>

                    <div className="social-links d-none d-md-flex align-items-center">
                        <a href={contact?.twitter_url || '#!'} className="twitter" aria-label="Twitter" target='_blank'><i className="bi bi-twitter-x" /></a>
                        <a href={contact?.facebook_url || '#!'} className="facebook" aria-label="Facebook" target='_blank'><i className="bi bi-facebook" /></a>
                        <a href={contact?.instagram_url || '#!'} className="instagram" aria-label="Instagram" target='_blank'><i className="bi bi-instagram" /></a>
                        <a href={contact?.linkedin_url || '#!'} className="linkedin" aria-label="LinkedIn" target='_blank'><i className="bi bi-linkedin" /></a>
                    </div>
                </div>
            </div>

            <div className="branding d-flex align-items-center">
                <div className="container position-relative d-flex align-items-center justify-content-between">
                    <Link href="/" className="logo d-flex align-items-center" onClick={closeMenus}>
                        {normalizedSiteLogo && !logoLoadFailed && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 52,
                                    minHeight: 52,
                                    padding: '6px 10px',
                                    marginRight: 10,
                                    borderRadius: 14,
                                    background: '#ffffff',
                                    boxShadow: '0 10px 24px rgba(17, 24, 39, 0.12)',
                                    border: '1px solid rgba(15, 23, 42, 0.08)',
                                }}
                            >
                                <img
                                    src={normalizedSiteLogo}
                                    alt={siteName}
                                    onError={() => setLogoLoadFailed(true)}
                                    style={{
                                        maxHeight: 40,
                                        maxWidth: 160,
                                        width: 'auto',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            </span>
                        )}

                        <h1 className="sitename">{siteName}</h1>
                    </Link>

                    <nav id="navmenu" className="navmenu">
                        <ul>
                            <li><Link href="/" className={isActive('/') ? 'active' : ''} onClick={closeMenus}>Home</Link></li>
                            <li><Link href="/about" className={isActive('/about') ? 'active' : ''} onClick={closeMenus}>About</Link></li>
                            <li><Link href="/departments" className={isActive('/departments') ? 'active' : ''} onClick={closeMenus}>Departments</Link></li>
                            <li><Link href="/services" className={isActive('/services') ? 'active' : ''} onClick={closeMenus}>Services</Link></li>
                            <li><Link href="/doctors" className={isActive('/doctors') ? 'active' : ''} onClick={closeMenus}>Doctors</Link></li>
                            <li className="dropdown">
                                <a
                                    href="#!"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setMorePagesOpen((value) => !value);
                                    }}
                                    className={isMorePagesActive ? 'active' : ''}
                                >
                                    <span>More Pages</span>
                                    <i className="bi bi-chevron-down toggle-dropdown" />
                                </a>
                                <ul className={morePagesOpen ? 'dropdown-active' : ''}>
                                    <li><Link href="/testimonials" className={isActive('/testimonials') ? 'active' : ''} onClick={closeMenus}>Testimonials</Link></li>
                                    <li><Link href="/faq" className={isActive('/faq') ? 'active' : ''} onClick={closeMenus}>Frequently Asked Questions</Link></li>
                                    <li><Link href="/terms" className={isActive('/terms') ? 'active' : ''} onClick={closeMenus}>Terms of Service</Link></li>
                                    <li><Link href="/privacy" className={isActive('/privacy') ? 'active' : ''} onClick={closeMenus}>Privacy Policy</Link></li>
                                    <li><Link href="/register-doctor" onClick={closeMenus}>Doctor Registration</Link></li>
                                    <li><Link href="/register-provider" onClick={closeMenus}>Provider Registration</Link></li>
                                    <li><Link href="/guest/cancel" className={isActive('/guest/cancel') ? 'active' : ''} onClick={closeMenus}>Cancel Guest Booking</Link></li>
                                </ul>
                            </li>
                            <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={closeMenus}>Contact</Link></li>

                            {auth?.user ? (
                                <>
                                    <li className="nav-auth-item">
                                        <Link
                                            href={dashboardHref}
                                            className={`nav-auth-link nav-auth-link-secondary ${currentPath.startsWith(dashboardHref) ? 'active' : ''}`}
                                            onClick={closeMenus}
                                        >
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li className="nav-auth-item">
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="nav-auth-link nav-auth-link-primary"
                                            onClick={closeMenus}
                                        >
                                            Logout
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-auth-item">
                                        <Link
                                            href="/login"
                                            className={`nav-auth-link nav-auth-link-secondary ${isActive('/login') ? 'active' : ''}`}
                                            onClick={closeMenus}
                                        >
                                            Login
                                        </Link>
                                    </li>
                                    <li className="nav-auth-item">
                                        <Link
                                            href="/register"
                                            className={`nav-auth-link nav-auth-link-primary ${isActive('/register') ? 'active' : ''}`}
                                            onClick={closeMenus}
                                        >
                                            Register
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>

                        <i
                            className={`mobile-nav-toggle d-xl-none bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`}
                            onClick={() => setMobileMenuOpen((value) => !value)}
                        />
                    </nav>
                </div>
            </div>
        </header>
    );
}
