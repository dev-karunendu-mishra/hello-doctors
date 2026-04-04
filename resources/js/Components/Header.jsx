import { Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Header({ auth }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [morePagesOpen, setMorePagesOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    const isActive = (href) => {
        if (href === '/') {
            return currentPath === '/';
        }

        return currentPath.startsWith(href);
    };

    const isMorePagesActive = morePagesOpen || ['/faq', '/testimonials', '/terms', '/privacy', '/register-doctor', '/register-provider', '/dashboard', '/login']
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
                            <a href="mailto:support@hellodoctors.in">support@hellodoctors.in</a>
                        </i>
                        <i className="bi bi-phone d-flex align-items-center ms-4">
                            <span>+91 55512 34567</span>
                        </i>
                    </div>

                    <div className="social-links d-none d-md-flex align-items-center">
                        <a href="#!" className="twitter" aria-label="Twitter"><i className="bi bi-twitter-x" /></a>
                        <a href="#!" className="facebook" aria-label="Facebook"><i className="bi bi-facebook" /></a>
                        <a href="#!" className="instagram" aria-label="Instagram"><i className="bi bi-instagram" /></a>
                        <a href="#!" className="linkedin" aria-label="LinkedIn"><i className="bi bi-linkedin" /></a>
                    </div>
                </div>
            </div>

            <div className="branding d-flex align-items-center">
                <div className="container position-relative d-flex align-items-center justify-content-between">
                    <Link href="/" className="logo d-flex align-items-center" onClick={closeMenus}>
                        <h1 className="sitename">Hello Doctors</h1>
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
                                    {auth?.user ? (
                                        <>
                                            <li><Link href="/dashboard" onClick={closeMenus}>Dashboard</Link></li>
                                            <li><Link href="/logout" method="post" as="button" onClick={closeMenus}>Logout</Link></li>
                                        </>
                                    ) : (
                                        <li><Link href="/login" onClick={closeMenus}>Login</Link></li>
                                    )}
                                </ul>
                            </li>
                            <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={closeMenus}>Contact</Link></li>
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
