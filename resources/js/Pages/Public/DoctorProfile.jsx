import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Descriptions, Tag, Avatar, Divider, Button } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, MedicineBoxOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;

export default function DoctorProfile({ auth, doctor }) {
    const clinicSchedules = doctor.clinic_schedules || [];
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
        "url": window.location.href,
        "hasCredential": doctor.qualification,
        "worksFor": {
            "@type": "MedicalOrganization",
            "name": "Hello Doctors"
        }
    };

    // Add address if available
    if (doctor.cities && doctor.cities.length > 0) {
        structuredData.address = doctor.cities.map(city => ({
            "@type": "PostalAddress",
            "addressLocality": city.name,
            "addressRegion": "Uttar Pradesh",
            "addressCountry": "IN",
            "streetAddress": city.address || ""
        }));
    }

    // Add price range if available
    if (doctor.consultation_fee) {
        structuredData.priceRange = `₹${doctor.consultation_fee}`;
    }

    // Use entity-specific SEO if available, otherwise generate dynamically
    const metaTitle = doctor.meta_title || `${doctor.name} - ${doctor.specialty} Doctor Profile`;
    const metaDescription = doctor.meta_description || (
        doctor.bio 
            ? `${doctor.bio.substring(0, 155)}...` 
            : `${doctor.name} - ${doctor.specialty} with ${doctor.experience_years || 0} years of experience. Find contact details, qualifications, and consultation fees.`
    );
    const metaKeywords = doctor.meta_keywords || `${doctor.name}, ${doctor.specialty}, doctor, healthcare, medical, ${doctor.cities.map(c => c.name).join(', ')}`;

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
            
            <Header auth={auth} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <Link href="/search">
                        <Button className="mb-4">← Back to Search</Button>
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
                    {(clinicSchedules.length > 0 || doctor.working_hours.length > 0) && (
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
                    )}

                    {/* Contact CTA */}
                    <Card className="text-center bg-blue-50">
                        <Title level={4}>Need an Appointment?</Title>
                        <Paragraph>
                            Contact {doctor.name} for consultation
                        </Paragraph>
                        <div className="flex gap-4 justify-center">
                            {doctor.phone && (
                                <Button type="primary" size="large" icon={<PhoneOutlined />} href={`tel:${doctor.phone}`}>
                                    Call Now
                                </Button>
                            )}
                            {doctor.email && (
                                <Button size="large" icon={<MailOutlined />} href={`mailto:${doctor.email}`}>
                                    Send Email
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            
            <Footer />
        </>
    );
}
