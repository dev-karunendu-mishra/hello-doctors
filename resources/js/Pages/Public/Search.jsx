import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import DoctorBookingModal from '@/Components/DoctorBookingModal';

export default function Search({ auth, doctors, specialties, filters }) {
    const [searchForm, setSearchForm] = useState({
        search: filters.search || '',
        specialty: filters.specialty || '',
        city_name: filters.city_name || '',
    });
    const [bookingDoctor, setBookingDoctor] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);

    const isPatient = auth?.user?.role === 'patient';
    const isLoggedIn = Boolean(auth?.user);

    const activeFilters = useMemo(() => ([
        searchForm.search ? `Keyword: ${searchForm.search}` : null,
        searchForm.city_name ? `City: ${searchForm.city_name}` : null,
        searchForm.specialty
            ? `Specialty: ${specialties.find((spec) => String(spec.id) === String(searchForm.specialty))?.name || searchForm.specialty}`
            : null,
    ].filter(Boolean)), [searchForm, specialties]);

    const handleSearch = (event) => {
        event.preventDefault();

        router.get('/doctors', {
            search: searchForm.search || undefined,
            specialty: searchForm.specialty || undefined,
            city_name: searchForm.city_name || undefined,
        });
    };

    const handleReset = () => {
        setSearchForm({
            search: '',
            specialty: '',
            city_name: '',
        });
        router.get('/doctors');
    };

    const openBookingModal = (doctor) => {
        setBookingDoctor(doctor);
        setBookingOpen(true);
    };

    const scrollToDoctorResults = () => {
        if (typeof window === 'undefined') {
            return;
        }

        window.requestAnimationFrame(() => {
            const resultsAnchor = document.getElementById('doctor-results-start');

            if (!resultsAnchor) {
                return;
            }

            const topOffset = 110;
            const targetTop = resultsAnchor.getBoundingClientRect().top + window.scrollY - topOffset;

            window.scrollTo({
                top: Math.max(targetTop, 0),
                behavior: 'smooth',
            });
        });
    };

    const changePage = (page) => {
        if (page < 1 || page > doctors.last_page || page === doctors.current_page) {
            return;
        }

        router.get('/doctors', {
            search: filters.search || undefined,
            specialty: filters.specialty || undefined,
            city_name: filters.city_name || undefined,
            page,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => scrollToDoctorResults(),
        });
    };

    const paginationItems = useMemo(() => {
        const currentPage = Number(doctors.current_page || 1);
        const lastPage = Number(doctors.last_page || 1);

        if (lastPage <= 7) {
            return Array.from({ length: lastPage }, (_, index) => index + 1);
        }

        const pages = new Set([1, currentPage, lastPage]);

        if (currentPage <= 3) {
            [2, 3, 4].forEach((page) => {
                if (page < lastPage) {
                    pages.add(page);
                }
            });
        } else if (currentPage >= lastPage - 2) {
            [lastPage - 3, lastPage - 2, lastPage - 1].forEach((page) => {
                if (page > 1) {
                    pages.add(page);
                }
            });
        } else {
            [currentPage - 1, currentPage + 1].forEach((page) => {
                if (page > 1 && page < lastPage) {
                    pages.add(page);
                }
            });
        }

        const sortedPages = [...pages].sort((left, right) => left - right);

        return sortedPages.flatMap((page, index) => {
            if (index === 0) {
                return [page];
            }

            const previousPage = sortedPages[index - 1];

            return page - previousPage > 1 ? [`ellipsis-${previousPage}`, page] : [page];
        });
    }, [doctors.current_page, doctors.last_page]);

    const rangeStart = doctors.total === 0
        ? 0
        : (doctors.from ?? (((doctors.current_page - 1) * doctors.per_page) + 1));
    const rangeEnd = doctors.to ?? Math.min(doctors.total, doctors.current_page * doctors.per_page);

    const titleText = activeFilters.length > 0 ? 'Doctor Search Results' : 'Doctors';
    const subtitleText = activeFilters.length > 0
        ? `Showing ${doctors.total} matched doctors${activeFilters.length ? ` for ${activeFilters.join(' • ')}` : ''}.`
        : 'Browse verified healthcare professionals and connect with experienced specialists across trusted departments.';

    return (
        <>
            <Head title="Doctors - Hello Doctors">
                <meta name="description" content="Browse verified doctors by specialty and city. Discover trusted healthcare professionals across Hello Doctors." />
                <meta name="keywords" content="doctors, cardiologist, neurologist, pediatrician, orthopedics, search doctors" />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}/doctors` : '/doctors'} />
            </Head>

            <PublicLayout auth={auth} title="Doctors - Hello Doctors" pageClassName="doctors-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">{titleText}</h1>
                                    <p className="mb-0">{subtitleText}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Doctors</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="doctors" className="doctors section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="find-a-doctor mb-5">
                            <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="200">
                                <div className="col-lg-8 text-center">
                                    <div className="search-section">
                                        <h3 className="search-title">Find Your Perfect Healthcare Provider</h3>
                                        <p className="search-subtitle">Search through our comprehensive directory of experienced medical professionals</p>
                                        <form className="search-form" onSubmit={handleSearch}>
                                            <div className="search-input-group">
                                                <div className="input-wrapper">
                                                    <i className="bi bi-person" />
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="doctor_name"
                                                        placeholder="Enter doctor name"
                                                        value={searchForm.search}
                                                        onChange={(event) => setSearchForm((current) => ({ ...current, search: event.target.value }))}
                                                    />
                                                </div>
                                                <div className="select-wrapper">
                                                    <i className="bi bi-heart-pulse" />
                                                    <select
                                                        className="form-select"
                                                        name="specialty"
                                                        value={searchForm.specialty}
                                                        onChange={(event) => setSearchForm((current) => ({ ...current, specialty: event.target.value }))}
                                                    >
                                                        <option value="">All Specialties</option>
                                                        {specialties.map((specialty) => (
                                                            <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button type="submit" className="search-btn">
                                                    <i className="bi bi-search" />
                                                    Find Doctors
                                                </button>
                                            </div>
                                        </form>

                                        {activeFilters.length > 0 && (
                                            <div className="mt-3 d-flex flex-wrap justify-content-center gap-2">
                                                {activeFilters.map((filter) => (
                                                    <span key={filter} className="badge rounded-pill text-bg-light border px-3 py-2">{filter}</span>
                                                ))}
                                                <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={handleReset}>
                                                    Reset Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="doctor-results-start" className="doctor-results-anchor doctor-results-list">
                            {doctors.data.length === 0 ? (
                                <div className="col-12" data-aos="fade-up" data-aos-delay="100">
                                    <div className="doctor-card">
                                        <div className="doctor-content">
                                            <h4>No doctors found</h4>
                                            <p>Try adjusting your search criteria to explore more healthcare professionals.</p>
                                            <button type="button" className="btn-appointment" onClick={handleReset}>Reset Search</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                doctors.data.map((doctor, index) => {
                                    const profileHref = `/doctors/${doctor.slug || doctor.id}`;
                                    const primaryCity = doctor.cities?.[0]?.name || doctor.availability_preview?.clinic_city || filters.city_name || 'Lucknow';
                                    const clinicName = doctor.availability_preview?.clinic_name;
                                    const consultationFee = doctor.consultation_fee ? `₹${doctor.consultation_fee}` : 'Fee on request';
                                    const experienceText = doctor.experience_years ? `${doctor.experience_years} years experience overall` : 'Experienced specialist';
                                    const bookingUnavailable = !(doctor.clinic_schedules || []).some(
                                        (clinic) => Array.isArray(clinic.schedules) && clinic.schedules.length > 0,
                                    );

                                    return (
                                        <div className="doctor-listing-entry" key={doctor.id}>
                                            <div className="doctor-listing-card" data-aos="fade-up" data-aos-delay={100 + ((index % 4) * 80)}>
                                                <div className="doctor-listing-main">
                                                    <Link href={profileHref} className="doctor-listing-avatar-wrap">
                                                        <img
                                                            src={doctor.image || `/clinic-assets/health/staff-${(index % 4) + 1}.webp`}
                                                            alt={doctor.name}
                                                            className="doctor-listing-avatar"
                                                        />
                                                    </Link>

                                                    <div className="doctor-listing-body">
                                                        <h3>
                                                            <Link href={profileHref} className="doctor-listing-name-link">
                                                                {doctor.name}
                                                            </Link>
                                                        </h3>
                                                        <p className="doctor-listing-specialty">{doctor.specialty || 'General Specialist'}</p>
                                                        <p className="doctor-listing-experience">{experienceText}</p>
                                                        <p className="doctor-listing-location">
                                                            <strong>{primaryCity}</strong>
                                                            {clinicName ? <><span> • </span><span>{clinicName}</span></> : null}
                                                        </p>
                                                        <p className="doctor-listing-fee">{consultationFee} Consultation fee at clinic</p>

                                                        <div className="doctor-listing-trust">
                                                            <span className="doctor-listing-score">
                                                                <i className="bi bi-hand-thumbs-up-fill" />
                                                                {doctor.experience_years ? `${Math.min(99, 70 + Number(doctor.experience_years))}%` : '90%'}
                                                            </span>
                                                            <span className="doctor-listing-stories">
                                                                {Math.max(4, Math.round((doctor.experience_years || 5) * 1.5))} Patient Stories
                                                            </span>
                                                            <Link href={profileHref} className="doctor-listing-profile-link">
                                                                View Profile
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="doctor-listing-actions">
                                                    <span className={`doctor-listing-availability ${doctor.is_available_today ? '' : 'is-muted'}`}>
                                                        <i className={`bi ${doctor.is_available_today ? 'bi-calendar-check' : 'bi-calendar-x'}`} />
                                                        {doctor.is_available_today ? 'Available Today' : 'Check Schedule'}
                                                    </span>

                                                    {bookingUnavailable ? (
                                                        <button type="button" className="doctor-listing-primary-btn is-disabled" disabled>
                                                            <span>Appointment Unavailable</span>
                                                            <small>Schedule will open soon</small>
                                                        </button>
                                                    ) : isPatient ? (
                                                        <button
                                                            type="button"
                                                            className="doctor-listing-primary-btn"
                                                            onClick={() => openBookingModal(doctor)}
                                                        >
                                                            <span>Book Clinic Visit</span>
                                                            <small>No Booking Fee</small>
                                                        </button>
                                                    ) : !isLoggedIn ? (
                                                        <button
                                                            type="button"
                                                            className="doctor-listing-primary-btn"
                                                            onClick={() => openBookingModal(doctor)}
                                                        >
                                                            <span>Continue as Guest</span>
                                                            <small>No account required</small>
                                                        </button>
                                                    ) : (
                                                        <Link href="/patient/find-doctors" className="doctor-listing-primary-btn">
                                                            <span>Book from Dashboard</span>
                                                            <small>Continue as patient</small>
                                                        </Link>
                                                    )}

                                                    {doctor.phone ? (
                                                        <a href={`tel:${doctor.phone}`} className="doctor-listing-secondary-btn">
                                                            <i className="bi bi-telephone" />
                                                            Contact Clinic
                                                        </a>
                                                    ) : (
                                                        <Link href={profileHref} className="doctor-listing-secondary-btn">
                                                            <i className="bi bi-telephone" />
                                                            Contact Clinic
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {doctors.last_page > 1 && (
                            <div className="doctor-pagination-shell" data-aos="fade-up" data-aos-delay="150">
                                <div className="doctor-pagination-summary">
                                    <span className="doctor-pagination-chip">
                                        Page {doctors.current_page} of {doctors.last_page}
                                    </span>
                                    <p>
                                        Showing <strong>{rangeStart}-{rangeEnd}</strong> of <strong>{doctors.total}</strong> doctors
                                    </p>
                                </div>

                                <nav className="doctor-pagination-nav" aria-label="Doctors pagination">
                                    <button
                                        className="doctor-pagination-arrow"
                                        type="button"
                                        onClick={() => changePage(doctors.current_page - 1)}
                                        disabled={doctors.current_page === 1}
                                    >
                                        <i className="bi bi-chevron-left" />
                                        <span>Previous</span>
                                    </button>

                                    <div className="doctor-pagination-pages">
                                        {paginationItems.map((item) => (
                                            typeof item === 'string' ? (
                                                <span key={item} className="doctor-pagination-ellipsis">…</span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    className={`doctor-pagination-page ${item === doctors.current_page ? 'is-active' : ''}`}
                                                    type="button"
                                                    onClick={() => changePage(item)}
                                                    aria-current={item === doctors.current_page ? 'page' : undefined}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button
                                        className="doctor-pagination-arrow"
                                        type="button"
                                        onClick={() => changePage(doctors.current_page + 1)}
                                        disabled={doctors.current_page === doctors.last_page}
                                    >
                                        <span>Next</span>
                                        <i className="bi bi-chevron-right" />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </section>

                <DoctorBookingModal
                    doctor={bookingDoctor}
                    open={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                />
            </PublicLayout>
        </>
    );
}
