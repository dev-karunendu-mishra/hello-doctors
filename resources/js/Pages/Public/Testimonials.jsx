import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

const featuredTestimonials = [
    {
        quote: 'Hello Doctors made it much easier for my family to compare specialists and choose the right care path without feeling overwhelmed.',
        name: 'Marcus Chen',
        handle: '@marcuschen',
        image: '/clinic-assets/person/person-m-9.webp',
    },
    {
        quote: 'The platform felt clean, reliable, and simple to use. I could quickly understand specialties and find the support we needed.',
        name: 'Sarah Mitchell',
        handle: '@sarahmitch',
        image: '/clinic-assets/person/person-f-5.webp',
    },
    {
        quote: 'I appreciated how easy it was to browse doctors, review service areas, and contact the team for extra guidance during the process.',
        name: 'James Wilson',
        handle: '@jwilson',
        image: '/clinic-assets/person/person-f-12.webp',
    },
    {
        quote: 'From discovery to follow-up, the experience felt much more organized than searching randomly across multiple websites and directories.',
        name: 'Emma Rodriguez',
        handle: '@emmarod',
        image: '/clinic-assets/person/person-m-12.webp',
    },
    {
        quote: 'It helped me connect with the right healthcare information faster and gave me more confidence when shortlisting options for my parents.',
        name: 'David Kumar',
        handle: '@davidkumar',
        image: '/clinic-assets/person/person-m-13.webp',
    },
    {
        quote: 'The interface is intuitive and the care categories are easy to understand, which made the whole search process smoother for us.',
        name: 'Sophia Lee',
        handle: '@sophialee',
        image: '/clinic-assets/person/person-f-13.webp',
    },
];

const testimonials = [
    {
        quote: 'The specialist discovery process was incredibly straightforward, and the team support made everything feel more patient-friendly.',
        name: 'Michael Anderson',
        role: 'Patient Family Member',
        image: '/clinic-assets/person/person-m-3.webp',
    },
    {
        quote: 'I found the department and doctor information very helpful while narrowing down options for a consultation in a new city.',
        name: 'Sophia Martinez',
        role: 'Working Professional',
        image: '/clinic-assets/person/person-f-5.webp',
    },
    {
        quote: 'Hello Doctors gave us a clear view of services and specialties, which made comparing providers much easier than before.',
        name: 'David Wilson',
        role: 'Caregiver',
        image: '/clinic-assets/person/person-m-7.webp',
    },
    {
        quote: 'The public pages are easy to navigate and the information feels structured in a way that is genuinely useful for real patient decisions.',
        name: 'Emily Johnson',
        role: 'Healthcare Researcher',
        image: '/clinic-assets/person/person-f-9.webp',
    },
    {
        quote: 'I liked how quickly I could move from learning about a department to exploring doctors and contacting the platform for help.',
        name: 'Olivia Thompson',
        role: 'Patient Advocate',
        image: '/clinic-assets/person/person-f-11.webp',
    },
    {
        quote: 'The platform experience feels modern and trustworthy, especially for families trying to organize treatment choices efficiently.',
        name: 'James Taylor',
        role: 'Community Member',
        image: '/clinic-assets/person/person-m-12.webp',
    },
];

const starIcons = Array.from({ length: 5 }, (_, index) => index);

export default function Testimonials({ auth }) {
    return (
        <>
            <Head title="Testimonials - Hello Doctors">
                <meta
                    name="description"
                    content="Read testimonials and patient stories about using Hello Doctors to discover trusted doctors, departments, and healthcare support."
                />
                <meta
                    name="keywords"
                    content="hello doctors testimonials, patient stories, healthcare reviews, doctor discovery feedback"
                />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/testimonials` : '/testimonials'} />
            </Head>

            <PublicLayout auth={auth} title="Testimonials - Hello Doctors" pageClassName="testimonials-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Testimonials</h1>
                                    <p className="mb-0">
                                        See how patients, families, and healthcare seekers describe their experience discovering doctors and services through Hello Doctors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Testimonials</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="featured-testimonials" className="featured-testimonials section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="testimonials-14 swiper init-swiper">
                            <script type="application/json" className="swiper-config">
                                {JSON.stringify({
                                    loop: true,
                                    speed: 600,
                                    autoplay: { delay: 5000 },
                                    slidesPerView: 3,
                                    spaceBetween: 24,
                                    pagination: {
                                        el: '.swiper-pagination',
                                        type: 'bullets',
                                        clickable: true,
                                    },
                                    breakpoints: {
                                        320: { slidesPerView: 1, spaceBetween: 16 },
                                        768: { slidesPerView: 2, spaceBetween: 24 },
                                        1200: { slidesPerView: 3, spaceBetween: 24 },
                                    },
                                })}
                            </script>

                            <div className="swiper-wrapper">
                                {featuredTestimonials.map((item) => (
                                    <div key={item.name} className="swiper-slide">
                                        <div className="testimonial-item">
                                            <div className="stars">
                                                {starIcons.map((star) => <i key={star} className="bi bi-star-fill" />)}
                                            </div>
                                            <p>{item.quote}</p>
                                            <div className="profile">
                                                <img src={item.image} className="testimonial-img" alt={item.name} loading="lazy" />
                                                <div className="info">
                                                    <h4>{item.name} <i className="bi bi-patch-check-fill" /></h4>
                                                    <span>{item.handle}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="swiper-pagination" />
                        </div>
                    </div>
                </section>

                <section id="testimonials" className="testimonials section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row g-4">
                            {testimonials.map((item, index) => (
                                <div key={item.name} className="col-lg-6" data-aos="fade-up" data-aos-delay={100 + index * 100}>
                                    <div className="testimonial-item">
                                        <div className="stars">
                                            {starIcons.map((star) => <i key={star} className="bi bi-star-fill" />)}
                                        </div>
                                        <p>{item.quote}</p>
                                        <div className="testimonial-footer">
                                            <div className="testimonial-author">
                                                <img src={item.image} alt={item.name} className="img-fluid rounded-circle" loading="lazy" />
                                                <div>
                                                    <h5>{item.name}</h5>
                                                    <span>{item.role}</span>
                                                </div>
                                            </div>
                                            <div className="quote-icon">
                                                <i className="bi bi-quote" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
