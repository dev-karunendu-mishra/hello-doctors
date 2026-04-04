import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Search({ auth, doctors, specialties, filters }) {
    const [searchForm, setSearchForm] = useState({
        search: filters.search || '',
        specialty: filters.specialty || '',
        city_name: filters.city_name || '',
    });

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

    const changePage = (page) => {
        router.get('/doctors', {
            search: filters.search || undefined,
            specialty: filters.specialty || undefined,
            city_name: filters.city_name || undefined,
            page,
        });
    };

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

                        <div className="row gy-4">
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
                                doctors.data.map((doctor, index) => (
                                    <div className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay={100 + ((index % 5) * 100)} key={doctor.id}>
                                        <div className="doctor-card">
                                            <div className="doctor-image">
                                                <img src={doctor.image || `/clinic-assets/health/staff-${(index % 4) + 1}.webp`} alt={doctor.name} className="img-fluid" />
                                                <div className="doctor-overlay">
                                                    <div className="social-links">
                                                        <Link href={`/doctors/${doctor.slug || doctor.id}`}><i className="bi bi-linkedin" /></Link>
                                                        {doctor.email ? (
                                                            <a href={`mailto:${doctor.email}`}><i className="bi bi-envelope" /></a>
                                                        ) : (
                                                            <Link href={`/doctors/${doctor.slug || doctor.id}`}><i className="bi bi-envelope" /></Link>
                                                        )}
                                                        {doctor.phone ? (
                                                            <a href={`tel:${doctor.phone}`}><i className="bi bi-phone" /></a>
                                                        ) : (
                                                            <Link href={`/doctors/${doctor.slug || doctor.id}`}><i className="bi bi-phone" /></Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="doctor-content">
                                                <h4>{doctor.name}</h4>
                                                <span className="specialty">{doctor.specialty || 'General Specialist'}</span>
                                                <p>{doctor.bio || 'Experienced healthcare professional offering compassionate and evidence-based care.'}</p>
                                                <div className="doctor-meta">
                                                    <div className="experience">
                                                        <i className="bi bi-award" />
                                                        <span>{doctor.experience_years ? `${doctor.experience_years}+ Years Experience` : 'Experienced Specialist'}</span>
                                                    </div>
                                                    <div className="department">
                                                        <i className="bi bi-building" />
                                                        <span>{doctor.specialty ? `${doctor.specialty} Dept.` : (doctor.cities?.[0]?.name || 'Healthcare Network')}</span>
                                                    </div>
                                                </div>
                                                <Link href={`/doctors/${doctor.slug || doctor.id}`} className="btn-appointment">Book Appointment</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {doctors.last_page > 1 && (
                            <nav className="mt-5" aria-label="Doctors pagination">
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${doctors.current_page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" type="button" onClick={() => changePage(doctors.current_page - 1)} disabled={doctors.current_page === 1}>
                                            Previous
                                        </button>
                                    </li>
                                    {Array.from({ length: doctors.last_page }, (_, index) => index + 1).map((page) => (
                                        <li key={page} className={`page-item ${page === doctors.current_page ? 'active' : ''}`}>
                                            <button className="page-link" type="button" onClick={() => changePage(page)}>{page}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${doctors.current_page === doctors.last_page ? 'disabled' : ''}`}>
                                        <button className="page-link" type="button" onClick={() => changePage(doctors.current_page + 1)} disabled={doctors.current_page === doctors.last_page}>
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
