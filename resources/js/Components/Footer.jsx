import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer id="footer" className="footer-16 footer position-relative">
            <div className="container">
                <div className="footer-main" data-aos="fade-up" data-aos-delay="100">
                    <div className="row align-items-start">
                        <div className="col-lg-5">
                            <div className="brand-section">
                                <Link href="/" className="logo d-flex align-items-center mb-4">
                                    <span className="sitename">Hello Doctors</span>
                                </Link>
                                <p className="brand-description">
                                    Compassionate healthcare discovery for patients, providers, and families—designed to make finding the right care feel faster and more trustworthy.
                                </p>

                                <div className="contact-info mt-5">
                                    <div className="contact-item">
                                        <i className="bi bi-geo-alt" />
                                        <span>Healthcare Network, Uttar Pradesh, India</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="bi bi-telephone" />
                                        <span>+91 (555) 123-4567</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="bi bi-envelope" />
                                        <span>support@hellodoctors.in</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-7">
                            <div className="footer-nav-wrapper">
                                <div className="row">
                                    <div className="col-6 col-lg-3">
                                        <div className="nav-column">
                                            <h6>Company</h6>
                                            <nav className="footer-nav">
                                                <Link href="/about">Our Story</Link>
                                                <Link href="/about">Care Process</Link>
                                                <Link href="/doctors">Doctors</Link>
                                                <Link href="/contact">Case Support</Link>
                                                <Link href="/contact">Contact</Link>
                                            </nav>
                                        </div>
                                    </div>

                                    <div className="col-6 col-lg-3">
                                        <div className="nav-column">
                                            <h6>Services</h6>
                                            <nav className="footer-nav">
                                                <Link href="/departments">Departments</Link>
                                                <Link href="/services">Home Services</Link>
                                                <Link href="/doctors">Doctor Search</Link>
                                                <Link href="/contact">Consultation</Link>
                                                <Link href="/contact">Support</Link>
                                            </nav>
                                        </div>
                                    </div>

                                    <div className="col-6 col-lg-3">
                                        <div className="nav-column">
                                            <h6>Resources</h6>
                                            <nav className="footer-nav">
                                                <Link href="/about">About Platform</Link>
                                                <Link href="/faq">FAQ</Link>
                                                <Link href="/testimonials">Testimonials</Link>
                                                <Link href="/doctors">Browse Cities</Link>
                                                <Link href="/contact">Patient Support</Link>
                                            </nav>
                                        </div>
                                    </div>

                                    <div className="col-6 col-lg-3">
                                        <div className="nav-column">
                                            <h6>Connect</h6>
                                            <nav className="footer-nav">
                                                <Link href="/register-doctor">Start Profile</Link>
                                                <Link href="/register-provider">Become Partner</Link>
                                                <Link href="/login">Login</Link>
                                                <Link href="/contact">Join Updates</Link>
                                                <Link href="/contact">Partnership</Link>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <div className="bottom-content" data-aos="fade-up" data-aos-delay="300">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="copyright">
                                    <p>© <span className="sitename">Hello Doctors</span>. All rights reserved.</p>
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="legal-links">
                                    <Link href="/privacy">Privacy Policy</Link>
                                    <Link href="/terms">Terms of Service</Link>
                                    <a href="#!">Cookie Policy</a>
                                    <div className="credits">
                                        Designed for modern healthcare discovery.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
