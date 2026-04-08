import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Row, Col, Typography, Descriptions, Tag, Avatar, Divider, Button, Empty, Form, Input, Modal, Radio, Select, Space, message } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, MedicineBoxOutlined, ClockCircleOutlined } from '@ant-design/icons';
import PublicLayout from '@/Layouts/PublicLayout';

const { Title, Paragraph } = Typography;

const consultationTypes = [
    { value: 'in-person', label: 'In Person' },
    { value: 'online', label: 'Online' },
    { value: 'phone', label: 'Phone' },
];

const ONLINE_DISCOUNT_PERCENT = 10;

const getPricingSummary = (amount, paymentMethod) => {
    const baseAmount = Number(amount || 0);
    const discountAmount = paymentMethod === 'online'
        ? Number(((baseAmount * ONLINE_DISCOUNT_PERCENT) / 100).toFixed(2))
        : 0;

    return {
        baseAmount,
        discountAmount,
        payableAmount: Number(Math.max(baseAmount - discountAmount, 0).toFixed(2)),
    };
};

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const groupSlots = (slots = []) => {
    const groups = {
        Morning: [],
        Afternoon: [],
        Evening: [],
    };

    slots.forEach((slot) => {
        const hour = parseInt(String(slot?.time || '00:00').split(':')[0], 10);

        if (hour < 12) {
            groups.Morning.push(slot);
        } else if (hour < 17) {
            groups.Afternoon.push(slot);
        } else {
            groups.Evening.push(slot);
        }
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
};

export default function DoctorProfile({ auth, doctor }) {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingSaving, setBookingSaving] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [bookingForm] = Form.useForm();

    const clinicSchedules = doctor.clinic_schedules || [];
    const isPatient = auth?.user?.role === 'patient';
    const isLoggedIn = Boolean(auth?.user);
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const bookableClinics = useMemo(
        () => clinicSchedules.filter((clinic) => Array.isArray(clinic.schedules) && clinic.schedules.length > 0),
        [clinicSchedules],
    );
    const selectedPaymentMethod = Form.useWatch('payment_method', bookingForm) || 'online';
    const selectedClinic = bookableClinics.find((clinic) => String(clinic.id) === String(selectedClinicId)) || bookableClinics[0] || null;
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

    const fetchAvailableSlots = async (clinicId, date) => {
        if (!clinicId || !date || !isPatient) {
            return;
        }

        setSlotsLoading(true);

        try {
            const response = await window.axios.get(`/patient/data/clinics/${clinicId}/available-slots`, {
                params: { date },
            });

            const slots = response?.data?.slots || [];
            setAvailableSlots(slots);

            const currentSlot = bookingForm.getFieldValue('appointment_time');
            if (currentSlot && !slots.some((slot) => slot.time === currentSlot)) {
                bookingForm.setFieldValue('appointment_time', null);
            }
        } catch (error) {
            setAvailableSlots([]);
            message.error(error?.response?.data?.message || 'Failed to load available slots.');
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        if (bookingOpen && selectedClinicId && selectedDate && isPatient) {
            fetchAvailableSlots(selectedClinicId, selectedDate);
        }
    }, [bookingOpen, selectedClinicId, selectedDate, isPatient]);

    const openBookingModal = () => {
        if (!bookableClinics.length) {
            message.info('No appointment slots are currently available for this doctor.');
            return;
        }

        const initialClinic = bookableClinics[0];
        const initialDate = new Date().toISOString().slice(0, 10);

        setSelectedClinicId(initialClinic.id);
        setSelectedDate(initialDate);
        setAvailableSlots([]);
        bookingForm.setFieldsValue({
            clinic_id: initialClinic.id,
            appointment_date: initialDate,
            appointment_time: null,
            consultation_type: doctor.is_available_online ? 'online' : 'in-person',
            payment_method: 'online',
            reason_for_visit: '',
        });
        setBookingOpen(true);
    };

    const confirmBooking = async () => {
        try {
            const values = await bookingForm.validateFields();
            setBookingSaving(true);

            const bookingParams = {
                type: 'appointment',
                payment_method: values.payment_method,
                doctor_hospital_clinic_id: values.clinic_id,
                appointment_date: values.appointment_date,
                appointment_time: values.appointment_time,
                consultation_type: values.consultation_type,
                reason_for_visit: values.reason_for_visit,
            };

            const orderRes = await window.axios.post('/patient/data/payment/create-order', bookingParams);
            const orderData = orderRes.data;

            if (orderData.skip_payment) {
                await window.axios.post('/patient/data/appointments', {
                    doctor_hospital_clinic_id: values.clinic_id,
                    appointment_date: values.appointment_date,
                    appointment_time: values.appointment_time,
                    consultation_type: values.consultation_type,
                    reason_for_visit: values.reason_for_visit,
                    payment_method: values.payment_method === 'online' ? undefined : 'cod',
                });

                message.success(values.payment_method === 'online'
                    ? 'Appointment booked successfully.'
                    : 'Appointment booked successfully. Please pay at the clinic during your visit.');
                setBookingOpen(false);
                return;
            }

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                message.error('Could not load payment gateway. Please try again.');
                return;
            }

            await new Promise((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: orderData.key_id,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Hello Doctors',
                    description: `Appointment with ${doctor.name}`,
                    handler: async (response) => {
                        try {
                            await window.axios.post('/patient/data/payment/verify', {
                                ...bookingParams,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            message.success('Appointment booked and payment successful!');
                            setBookingOpen(false);
                            resolve();
                        } catch (error) {
                            message.error(error?.response?.data?.message || 'Payment was captured but booking failed.');
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            message.warning('Payment was not completed. Your slot has not been booked.');
                            resolve();
                        },
                    },
                    theme: { color: '#1677ff' },
                });

                rzp.open();
            });
        } catch (error) {
            if (error?.errorFields) {
                return;
            }

            message.error(error?.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setBookingSaving(false);
        }
    };

    const availabilityLabel = bookingUnavailable ? 'Schedule Updating' : 'Available Today';

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
                <Link href="/login" className="doctor-listing-primary-btn">
                    <span>Login to Book</span>
                    <small>Secure appointment access</small>
                </Link>
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

    const pricing = getPricingSummary(selectedClinic?.consultation_fee || doctor.consultation_fee, selectedPaymentMethod);

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
                                    <span className="doctor-listing-availability">
                                        <i className="bi bi-calendar-check" />
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
                            <span className="doctor-listing-availability">
                                <i className="bi bi-calendar-check" />
                                {availabilityLabel}
                            </span>
                            {renderBookingActionButton()}
                            {renderSecondaryActionButton()}
                        </div>
                    </Card>

                    <Modal
                        title={`Book Appointment with ${doctor.name}`}
                        open={bookingOpen}
                        onCancel={() => setBookingOpen(false)}
                        onOk={confirmBooking}
                        okText="Confirm Booking"
                        confirmLoading={bookingSaving}
                        okButtonProps={{ disabled: slotsLoading || !selectedClinic || availableSlots.length === 0 }}
                        width={720}
                        destroyOnClose
                    >
                        <Form form={bookingForm} layout="vertical">
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Select Clinic"
                                        name="clinic_id"
                                        rules={[{ required: true, message: 'Please select a clinic.' }]}
                                    >
                                        <Select
                                            placeholder="Choose clinic"
                                            options={bookableClinics.map((clinic) => ({
                                                value: clinic.id,
                                                label: `${clinic.hospital_clinic_name}${clinic.city ? ` - ${clinic.city}` : ''}`,
                                            }))}
                                            onChange={(value) => {
                                                setSelectedClinicId(value);
                                                bookingForm.setFieldValue('appointment_time', null);
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Appointment Date"
                                        name="appointment_date"
                                        rules={[{ required: true, message: 'Please select an appointment date.' }]}
                                    >
                                        <Input
                                            type="date"
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setSelectedDate(value);
                                                bookingForm.setFieldValue('appointment_date', value);
                                                bookingForm.setFieldValue('appointment_time', null);
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {selectedClinic && (
                                <Card size="small" style={{ marginBottom: 16, background: '#f8fbff' }}>
                                    <strong>{selectedClinic.hospital_clinic_name}</strong>
                                    <div>{[selectedClinic.city, selectedClinic.address].filter(Boolean).join(' | ')}</div>
                                    <div style={{ marginTop: 4 }}>Consultation Fee: ₹{selectedClinic.consultation_fee || doctor.consultation_fee || 0}</div>
                                </Card>
                            )}

                            <Form.Item name="appointment_time" rules={[{ required: true, message: 'Please select an available slot.' }]} hidden>
                                <Input type="hidden" />
                            </Form.Item>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Available Slots</div>
                                {slotsLoading ? (
                                    <Paragraph type="secondary">Loading available slots...</Paragraph>
                                ) : availableSlots.length > 0 ? (
                                    groupSlots(availableSlots).map(([label, slots]) => (
                                        <div key={label} style={{ marginBottom: 12 }}>
                                            <div style={{ fontWeight: 500, marginBottom: 8 }}>{label}</div>
                                            <Space wrap>
                                                {slots.map((slot) => {
                                                    const slotValue = slot.time;
                                                    const isSelected = bookingForm.getFieldValue('appointment_time') === slotValue;

                                                    return (
                                                        <Button
                                                            key={`${label}-${slotValue}`}
                                                            type={isSelected ? 'primary' : 'default'}
                                                            onClick={() => bookingForm.setFieldValue('appointment_time', slotValue)}
                                                        >
                                                            {slot.label || slot.time}
                                                        </Button>
                                                    );
                                                })}
                                            </Space>
                                        </div>
                                    ))
                                ) : (
                                    <Empty description="No slots available for the selected date." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}

                                {bookingForm.getFieldError('appointment_time').length > 0 && (
                                    <div style={{ color: '#ff4d4f', marginTop: 8 }}>
                                        {bookingForm.getFieldError('appointment_time')[0]}
                                    </div>
                                )}
                            </div>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Consultation Type"
                                        name="consultation_type"
                                        rules={[{ required: true, message: 'Please select consultation type.' }]}
                                    >
                                        <Select
                                            options={consultationTypes.filter((option) => doctor.is_available_online || option.value !== 'online')}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item label="Payment Method" name="payment_method">
                                        <Radio.Group>
                                            <Space direction="vertical">
                                                <Radio value="online">Pay Online ({ONLINE_DISCOUNT_PERCENT}% off)</Radio>
                                                <Radio value="cod">Pay at Clinic</Radio>
                                            </Space>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Alert
                                type={selectedPaymentMethod === 'online' ? 'success' : 'warning'}
                                showIcon
                                style={{ marginBottom: 12 }}
                                message={selectedPaymentMethod === 'online'
                                    ? `You save ₹${pricing.discountAmount.toFixed(2)} with online payment.`
                                    : 'No discount is applied for pay-at-clinic bookings.'}
                            />

                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 12 }}
                                message="Refund Policy"
                                description="For online payments only: cancel more than 1 hour before the appointment to get a 90% refund; within 1 hour, you get an 80% refund. No refund applies for pay-at-clinic bookings or after the visit time."
                            />

                            <Form.Item label="Reason for Visit" name="reason_for_visit">
                                <Input.TextArea rows={3} placeholder="Describe symptoms or consultation reason" />
                            </Form.Item>

                            <div style={{ background: '#fafafa', borderRadius: 8, padding: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Consultation Fee</span>
                                    <strong>₹{pricing.baseAmount.toFixed(2)}</strong>
                                </div>
                                {selectedPaymentMethod === 'online' && pricing.discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#389e0d' }}>
                                        <span>Online Payment Discount</span>
                                        <strong>-₹{pricing.discountAmount.toFixed(2)}</strong>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                    <span>Payable Amount</span>
                                    <span>₹{pricing.payableAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </Form>
                    </Modal>
                </div>
            </div>
            </PublicLayout>
        </>
    );
}
