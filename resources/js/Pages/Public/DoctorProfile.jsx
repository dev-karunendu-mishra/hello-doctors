import { Head, Link } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Col, Descriptions, Divider, Row, Tag, Typography, message } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, GlobalOutlined, MailOutlined, MedicineBoxOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import PublicLayout from '@/Layouts/PublicLayout';

const DoctorBookingModal = lazy(() => import('@/Components/DoctorBookingModal'));

const { Title, Paragraph } = Typography;

export default function DoctorProfile({ auth, doctor }) {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [hasHandledAutoOpen, setHasHandledAutoOpen] = useState(false);

    const clinicSchedules = doctor.clinic_schedules || [];
    const isPatient = auth?.user?.role === 'patient';
    const isLoggedIn = Boolean(auth?.user);
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const bookableClinics = useMemo(
        () => clinicSchedules.filter((clinic) => Array.isArray(clinic.schedules) && clinic.schedules.length > 0),
        [clinicSchedules],
    );
    const bookingUnavailable = bookableClinics.length === 0;
    const bookingAvailabilityNote = bookingUnavailable
        ? 'Appointment booking is currently unavailable because this doctor has no active schedule or bookable slots yet.'
        : 'Select an available clinic and slot to book instantly from this profile page.';

    const hasValidCoordinates = (latitude, longitude) => {
        const lat = Number(latitude);
        const lng = Number(longitude);

        return Number.isFinite(lat)
            && Number.isFinite(lng)
            && lat >= -90
            && lat <= 90
            && lng >= -180
            && lng <= 180;
    };

    const getOsmEmbedUrl = (latitude, longitude) => {
        const lat = Number(latitude);
        const lng = Number(longitude);
        const delta = 0.01;
        const left = (lng - delta).toFixed(6);
        const right = (lng + delta).toFixed(6);
        const top = (lat + delta).toFixed(6);
        const bottom = (lat - delta).toFixed(6);

        return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
    };

    const getGoogleMapsUrl = (latitude, longitude) => {
        const lat = Number(latitude).toFixed(6);
        const lng = Number(longitude).toFixed(6);

        return `https://www.google.com/maps?q=${lat},${lng}`;
    };


    useEffect(() => {
        if (typeof window === 'undefined' || hasHandledAutoOpen) {
            return;
        }

        const shouldAutoOpen = new URLSearchParams(window.location.search).get('book') === '1';

        if (!shouldAutoOpen) {
            setHasHandledAutoOpen(true);
            return;
        }

        setHasHandledAutoOpen(true);

        if (isPatient && !bookingUnavailable) {
            openBookingModal();
        }
    }, [bookingUnavailable, hasHandledAutoOpen, isPatient]);

    const openBookingModal = () => {
        if (bookingUnavailable) {
            message.info('No appointment slots are currently available for this doctor.');
            return;
        }

        setBookingOpen(true);
    };

    const availabilityLabel = bookingUnavailable
        ? 'Schedule Updating'
        : (doctor.is_available_today ? 'Available Today' : 'Check Schedule');
    const availabilityClassName = `doctor-listing-availability ${doctor.is_available_today ? '' : 'is-muted'}`;

    const renderBookingActionButton = () => {
        if (bookingUnavailable) {
            return (
                <button type="button" className="doctor-listing-primary-btn is-disabled" disabled>
                    <span>Appointment Unavailable</span>
                    <small>Schedule will open soon</small>
                </button>
            );
        }

        if (isPatient) {
            return (
                <button type="button" className="doctor-listing-primary-btn" onClick={openBookingModal}>
                    <span>Book Clinic Visit</span>
                    <small>No Booking Fee</small>
                </button>
            );
        }

        if (!isLoggedIn) {
            return (
                <button type="button" className="doctor-listing-primary-btn" onClick={openBookingModal}>
                    <span>Continue as Guest</span>
                    <small>No account required</small>
                </button>
            );
        }

        return (
            <Link href="/patient/find-doctors" className="doctor-listing-primary-btn">
                <span>Book from Dashboard</span>
                <small>Continue as patient</small>
            </Link>
        );
    };

    const renderSecondaryActionButton = () => {
        if (doctor.phone) {
            return (
                <a href={`tel:${doctor.phone}`} className="doctor-listing-secondary-btn">
                    <PhoneOutlined />
                    Contact Clinic
                </a>
            );
        }

        if (doctor.email) {
            return (
                <a href={`mailto:${doctor.email}`} className="doctor-listing-secondary-btn">
                    <MailOutlined />
                    Send Email
                </a>
            );
        }

        return null;
    };

    // Generate Schema.org structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Physician",
        "name": doctor.name,
        "description": doctor.bio || `${doctor.name} - ${doctor.specialty}`,
        "jobTitle": doctor.specialty,
        "image": doctor.image,
        "telephone": doctor.phone,
        "email": doctor.email,
        "url": pageUrl,
        "hasCredential": doctor.qualification,
        "worksFor": {
            "@type": "MedicalOrganization",
            "name": "Hello Doctors"
        }
    };

    if (doctor.cities && doctor.cities.length > 0) {
        structuredData.address = doctor.cities.map((city) => ({
            "@type": "PostalAddress",
            "addressLocality": city.name,
            "addressRegion": "Uttar Pradesh",
            "addressCountry": "IN",
            "streetAddress": city.address || ""
        }));
    }

    if (doctor.consultation_fee) {
        structuredData.priceRange = `₹${doctor.consultation_fee}`;
    }

    const metaTitle = doctor.meta_title || `${doctor.name} - ${doctor.specialty} Doctor Profile`;
    const metaDescription = doctor.meta_description || (
        doctor.bio
            ? `${doctor.bio.substring(0, 155)}...`
            : `${doctor.name} - ${doctor.specialty} with ${doctor.experience_years || 0} years of experience. Find contact details, qualifications, and consultation fees.`
    );
    const metaKeywords = doctor.meta_keywords || `${doctor.name}, ${doctor.specialty}, doctor, healthcare, medical, ${doctor.cities.map((c) => c.name).join(', ')}`;

    return (
        <>
            <Head title={metaTitle}>
                <meta name="description" content={metaDescription} />
                <meta name="keywords" content={metaKeywords} />
                
                {/* Open Graph */}
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="profile" />
                {doctor.image && <meta property="og:image" content={doctor.image} />}
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={metaTitle} />
                <meta name="twitter:description" content={metaDescription} />
                {doctor.image && <meta name="twitter:image" content={doctor.image} />}
                
                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>
            
            <PublicLayout auth={auth} title={metaTitle}>
                <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <Link href="/doctors">
                        <Button className="mb-4">← Back to Doctors</Button>
                    </Link>

                    {/* Profile Header */}
                    <Card className="mb-6">
                        <Row gutter={24}>
                            <Col xs={24} md={6} className="text-center">
                                {doctor.image ? (
                                    <Avatar size={200} src={doctor.image} />
                                ) : (
                                    <Avatar size={200} icon={<UserOutlined />} />
                                )}
                            </Col>
                            <Col xs={24} md={18}>
                                <Title level={2}>{doctor.name}</Title>
                                <div className="mb-4">
                                    <Tag color="blue" icon={<MedicineBoxOutlined />} className="text-lg py-1 px-3">
                                        {doctor.specialty}
                                    </Tag>
                                    {doctor.is_available_online && (
                                        <Tag color="green" className="text-lg py-1 px-3">
                                            Online Consultation Available
                                        </Tag>
                                    )}
                                </div>

                                <Descriptions column={{ xs: 1, sm: 2 }}>
                                    {doctor.phone && (
                                        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                                            <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
                                        </Descriptions.Item>
                                    )}
                                    {doctor.email && (
                                        <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                            <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
                                        </Descriptions.Item>
                                    )}
                                    {doctor.experience_years && (
                                        <Descriptions.Item label="Experience">
                                            {doctor.experience_years} years
                                        </Descriptions.Item>
                                    )}
                                    {doctor.consultation_fee && (
                                        <Descriptions.Item label="Consultation Fee">
                                            ₹{doctor.consultation_fee}
                                        </Descriptions.Item>
                                    )}
                                    {doctor.website && (
                                        <Descriptions.Item label={<><GlobalOutlined /> Website</>}>
                                            <a href={doctor.website} target="_blank" rel="noopener noreferrer">
                                                Visit Website
                                            </a>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>

                                <div className="doctor-detail-action-panel">
                                    <span className={availabilityClassName}>
                                        <i className={`bi ${doctor.is_available_today ? 'bi-calendar-check' : 'bi-calendar-x'}`} />
                                        {availabilityLabel}
                                    </span>
                                    {renderBookingActionButton()}
                                    {renderSecondaryActionButton()}
                                    {isPatient && (
                                        <Link href="/patient/appointments" className="doctor-detail-inline-link">
                                            View My Appointments
                                        </Link>
                                    )}
                                </div>

                                <Paragraph
                                    type="secondary"
                                    style={{ marginTop: 12, marginBottom: 0, color: bookingUnavailable ? '#cf1322' : undefined }}
                                >
                                    {bookingAvailabilityNote}
                                </Paragraph>
                            </Col>
                        </Row>
                    </Card>

                    {/* About */}
                    {doctor.bio && (
                        <Card title="About" className="mb-6">
                            <Paragraph>{doctor.bio}</Paragraph>
                        </Card>
                    )}

                    {/* Qualifications */}
                    {doctor.qualification && (
                        <Card title="Qualifications" className="mb-6">
                            <Paragraph>{doctor.qualification}</Paragraph>
                        </Card>
                    )}

                    {/* Practice Locations */}
                    {doctor.cities.length > 0 && (
                        <Card title={<><EnvironmentOutlined /> Practice Locations</>} className="mb-6">
                            <Row gutter={[16, 16]}>
                                {doctor.cities.map((city, index) => (
                                    <Col xs={24} md={12} key={index}>
                                        <Card size="small" hoverable>
                                            <Title level={5}>{city.name}</Title>
                                            {city.address && (
                                                <Paragraph className="mb-2">{city.address}</Paragraph>
                                            )}
                                            {city.landmarks && (
                                                <Paragraph type="secondary">
                                                    Landmark: {city.landmarks}
                                                </Paragraph>
                                            )}
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}

                    {/* Availability & Schedule */}
                    {(clinicSchedules.length > 0 || doctor.working_hours.length > 0) ? (
                        <Card title={<><ClockCircleOutlined /> Availability & Schedule</>} className="mb-6">
                            {clinicSchedules.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    {clinicSchedules.map((clinic) => (
                                        <Col xs={24} md={12} key={clinic.id}>
                                            <Card size="small" hoverable>
                                                <Title level={5} className="mb-1">{clinic.hospital_clinic_name}</Title>
                                                <Paragraph type="secondary" className="mb-2">
                                                    {[clinic.city, clinic.address].filter(Boolean).join(' | ')}
                                                </Paragraph>
                                                {clinic.consultation_fee && (
                                                    <Tag color="blue" className="mb-2">Fee: ₹{clinic.consultation_fee}</Tag>
                                                )}

                                                {hasValidCoordinates(clinic.latitude, clinic.longitude) && (
                                                    <div className="mb-3">
                                                        <iframe
                                                            title={`map-${clinic.id}`}
                                                            src={getOsmEmbedUrl(clinic.latitude, clinic.longitude)}
                                                            className="w-full h-48 rounded border"
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer-when-downgrade"
                                                        />
                                                        <div className="mt-2">
                                                            <a
                                                                href={getGoogleMapsUrl(clinic.latitude, clinic.longitude)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                Open in Google Maps
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                <Divider className="my-2" />
                                                {clinic.schedules?.length > 0 ? (
                                                    clinic.schedules.map((slot, idx) => (
                                                        <div key={`${clinic.id}-${idx}`} className="mb-2">
                                                            <div className="font-medium">{slot.day_of_week}</div>
                                                            <div>
                                                                {slot.opening_time} - {slot.closing_time}
                                                                {slot.break_start_time && slot.break_end_time && (
                                                                    <span className="text-gray-500"> (Break: {slot.break_start_time} - {slot.break_end_time})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <Paragraph type="secondary" className="mb-0">No active schedule configured</Paragraph>
                                                )}
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {doctor.working_hours.map((wh, index) => (
                                        <Col xs={24} md={12} key={index}>
                                            <Card size="small">
                                                {wh.city && (
                                                    <div className="font-semibold mb-2">{wh.city}</div>
                                                )}
                                                {wh.timing_text ? (
                                                    <div>{wh.timing_text}</div>
                                                ) : (
                                                    wh.day_of_week && (
                                                        <div>
                                                            <span className="capitalize">{wh.day_of_week}</span>: {' '}
                                                            {wh.opening_time} - {wh.closing_time}
                                                        </div>
                                                    )
                                                )}
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Card>
                    ) : (
                        <Card title={<><ClockCircleOutlined /> Availability & Schedule</>} className="mb-6">
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                No active appointment schedule is currently available for this doctor. The booking button will remain disabled until a schedule or slots are added.
                            </Paragraph>
                        </Card>
                    )}

                    {/* Contact CTA */}
                    <Card className="text-center bg-blue-50">
                        <Title level={4}>Need an Appointment?</Title>
                        <Paragraph>
                            {bookingAvailabilityNote}
                        </Paragraph>
                        <div className="doctor-detail-contact-panel">
                            <span className={availabilityClassName}>
                                <i className={`bi ${doctor.is_available_today ? 'bi-calendar-check' : 'bi-calendar-x'}`} />
                                {availabilityLabel}
                            </span>
                            {renderBookingActionButton()}
                            {renderSecondaryActionButton()}
                        </div>
                    </Card>

                    {bookingOpen && (
                        <Suspense fallback={null}>
                            <DoctorBookingModal
                                doctor={doctor}
                                open={bookingOpen}
                                onClose={() => setBookingOpen(false)}
                            />
                        </Suspense>
                    )}
                </div>
            </div>
            </PublicLayout>
        </>
    );
}
