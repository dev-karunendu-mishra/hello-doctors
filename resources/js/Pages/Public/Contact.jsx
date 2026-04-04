import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Contact({ auth, flash }) {
    const { site = {} } = usePage().props;
    const contact = site?.contact || {};
    const primaryEmail = contact?.email || 'support@hellodoctors.in';
    const secondaryEmail = contact?.secondary_email || 'contact@hellodoctors.in';
    const phone = contact?.phone || '+91 (555) 123-4567';
    const address = contact?.address || 'Healthcare Network, Uttar Pradesh, India';
    const weekdayHours = contact?.hours_weekdays || 'Monday-Friday: 9 AM - 6 PM';
    const weekendHours = contact?.hours_weekend || 'Saturday: 9 AM - 4 PM';
    const mapEmbedUrl = contact?.map_embed_url || 'https://www.google.com/maps?q=Prayagraj%2C%20Uttar%20Pradesh&z=10&output=embed';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/contact');
    };

    return (
        <>
            <Head title="Contact - Hello Doctors">
                <meta name="description" content="Contact Hello Doctors for patient support, doctor onboarding, partnerships, and healthcare platform assistance." />
                <meta name="keywords" content="contact hello doctors, healthcare support, patient help, doctor onboarding, contact" />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/contact` : '/contact'} />
            </Head>

            <PublicLayout auth={auth} title="Contact - Hello Doctors" pageClassName="contact-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Contact</h1>
                                    <p className="mb-0">
                                        Reach out for patient support, doctor onboarding help, provider partnerships, or general platform assistance from the Hello Doctors team.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><a href="/">Home</a></li>
                                <li className="current">Contact</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="contact" className="contact section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-5">
                            <div className="col-lg-5">
                                <div className="contact-info-wrapper">
                                    <div className="contact-info-item" data-aos="fade-up" data-aos-delay="100">
                                        <div className="info-icon">
                                            <i className="bi bi-geo-alt" />
                                        </div>
                                        <div className="info-content">
                                            <h3>Our Address</h3>
                                            <p style={{ whiteSpace: 'pre-line' }}>{address}</p>
                                        </div>
                                    </div>

                                    <div className="contact-info-item" data-aos="fade-up" data-aos-delay="200">
                                        <div className="info-icon">
                                            <i className="bi bi-envelope" />
                                        </div>
                                        <div className="info-content">
                                            <h3>Email Address</h3>
                                            <p>{primaryEmail}</p>
                                            <p>{secondaryEmail}</p>
                                        </div>
                                    </div>

                                    <div className="contact-info-item" data-aos="fade-up" data-aos-delay="300">
                                        <div className="info-icon">
                                            <i className="bi bi-headset" />
                                        </div>
                                        <div className="info-content">
                                            <h3>Hours of Operation</h3>
                                            <p>{weekdayHours}</p>
                                            <p>{weekendHours}</p>
                                            <p>Support Helpline: {phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <div className="contact-form-card" data-aos="fade-up" data-aos-delay="200">
                                    <h2>Send us a Message</h2>
                                    <p className="mb-4">Have questions or want to learn more? Reach out to us and our team will get back to you shortly.</p>

                                    <form onSubmit={handleSubmit} className="php-email-form">
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="name"
                                                    placeholder="Your Name"
                                                    value={data.name}
                                                    onChange={(event) => setData('name', event.target.value)}
                                                    required
                                                />
                                                {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                                            </div>

                                            <div className="col-md-6">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    placeholder="Your Email"
                                                    value={data.email}
                                                    onChange={(event) => setData('email', event.target.value)}
                                                    required
                                                />
                                                {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                                            </div>

                                            <div className="col-12">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="phone"
                                                    placeholder="Your Phone Number"
                                                    value={data.phone}
                                                    onChange={(event) => setData('phone', event.target.value)}
                                                    required
                                                />
                                                {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                                            </div>

                                            <div className="col-12">
                                                <textarea
                                                    className="form-control"
                                                    name="message"
                                                    placeholder="Your Message"
                                                    rows="6"
                                                    value={data.message}
                                                    onChange={(event) => setData('message', event.target.value)}
                                                    required
                                                />
                                                {errors.message && <div className="text-danger small mt-1">{errors.message}</div>}
                                            </div>

                                            <div className="col-12">
                                                {processing && <div className="loading" style={{ display: 'block' }}>Loading</div>}
                                                {flash?.error && <div className="error-message" style={{ display: 'block' }}>{flash.error}</div>}
                                                {flash?.success && <div className="sent-message" style={{ display: 'block' }}>{flash.success}</div>}
                                            </div>

                                            <div className="col-12">
                                                <button type="submit" className="btn btn-submit" disabled={processing}>
                                                    {processing ? 'Sending...' : 'Send Message'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid map-container" data-aos="fade-up" data-aos-delay="200">
                        <div className="map-overlay" />
                        <iframe
                            src={mapEmbedUrl}
                            width="100%"
                            height="500"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Hello Doctors location map"
                        />
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
