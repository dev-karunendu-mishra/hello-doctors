import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Empty, Form, Input, Modal, Radio, Select, Space, message } from 'antd';
import PublicLayout from '@/Layouts/PublicLayout';

const fallbackServiceDetails = [
    {
        key: 'cardiology',
        category: 'Advanced Cardiology',
        title: 'Comprehensive Cardiac Care Services',
        lead: 'Preventive diagnosis and treatment support for cardiovascular concerns using trusted care pathways and specialist review.',
        image: '/clinic-assets/cardiology-1.webp',
        details: [
            { icon: 'bi bi-heart-pulse', title: 'Cardiac Assessment', description: 'Detailed evaluation for heart-health concerns, early diagnosis, and care planning.' },
            { icon: 'bi bi-activity', title: 'Heart Monitoring', description: 'Monitoring support for rhythm changes, symptoms, and follow-up assessment.' },
            { icon: 'bi bi-prescription2', title: 'Treatment Planning', description: 'Guided care planning tailored to cardiovascular needs and recovery goals.' },
        ],
        stats: [
            { number: '95%', label: 'Care Confidence' },
            { number: '24/7', label: 'Emergency Support' },
        ],
        overviewTitle: 'Why Choose Our Cardiology Service',
        overviewText: 'Patients benefit from preventive screening, specialist-led consultation, and structured follow-up support for better heart-health decisions.',
        features: ['Experienced cardiac specialists', 'Fast consultation scheduling', 'Preventive support options', 'Patient-centered treatment'],
        conditions: ['High Blood Pressure', 'Heart Rhythm Issues', 'Chest Pain Review', 'Preventive Cardiology', 'Recovery Support', 'Lifestyle Risk Review'],
        actions: {
            primaryText: 'Book Now',
            primaryAvailability: 'Next available: Tomorrow',
            secondaryText: 'Call Now',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Review',
            tertiaryAvailability: 'Response within 48h',
        },
    },
    {
        key: 'neurology',
        category: 'Advanced Neurology',
        title: 'Comprehensive Neurological Care Services',
        lead: 'Expert diagnosis and treatment for complex neurological conditions using modern assessment workflows and specialist guidance.',
        image: '/clinic-assets/neurology-4.webp',
        details: [
            { icon: 'bi bi-activity', title: 'Neurological Assessment', description: 'Assessment for nerve, brain, and movement-related symptoms with structured review.' },
            { icon: 'bi bi-diagram-2', title: 'Brain Imaging & Diagnosis', description: 'Diagnostic support to identify neurological conditions and guide next steps.' },
            { icon: 'bi bi-prescription2', title: 'Treatment Planning', description: 'Practical care planning tailored to symptoms, recovery, and patient goals.' },
        ],
        stats: [
            { number: '95%', label: 'Success Rate' },
            { number: '24/7', label: 'Emergency Care' },
        ],
        overviewTitle: 'Why Choose Our Neurology Service',
        overviewText: 'The neurology team combines diagnosis, treatment guidance, and ongoing monitoring to support better patient outcomes in complex conditions.',
        features: ['Board Certified Specialists', 'Same Day Appointments', 'Advanced Treatment Options', 'Patient-Centered Care'],
        conditions: ['Stroke Recovery', 'Epilepsy Management', 'Memory Disorders', 'Headache Disorders', 'Movement Disorders', 'Peripheral Neuropathy', 'Multiple Sclerosis', "Parkinson's Disease"],
        actions: {
            primaryText: 'Book Now',
            primaryAvailability: 'Next available: Tomorrow',
            secondaryText: 'Call Now',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Review',
            tertiaryAvailability: 'Response within 48h',
        },
    },
    {
        key: 'laboratory',
        category: 'Advanced Diagnostics',
        title: 'Comprehensive Laboratory Testing Services',
        lead: 'Reliable diagnostic testing support with faster coordination, clearer reporting, and access to follow-up care planning.',
        image: '/clinic-assets/facilities-6.webp',
        details: [
            { icon: 'bi bi-eyedropper', title: 'Sample Collection', description: 'Safe and organized specimen collection for common diagnostic tests and screening panels.' },
            { icon: 'bi bi-search', title: 'Diagnostic Review', description: 'Structured testing workflows designed to support accurate and timely clinical decisions.' },
            { icon: 'bi bi-file-earmark-medical', title: 'Report Guidance', description: 'Simple report coordination and patient-facing support for next-step care.' },
        ],
        stats: [
            { number: '98%', label: 'Report Accuracy' },
            { number: 'Same Day', label: 'Fast Processing' },
        ],
        overviewTitle: 'Why Choose Our Laboratory Services',
        overviewText: 'Diagnostic services are designed for convenience, dependable reporting, and easier coordination with doctors and care teams.',
        features: ['Fast result coordination', 'Comprehensive test options', 'Trusted reporting support', 'Patient-friendly process'],
        conditions: ['Routine Screening', 'Blood Tests', 'Pathology Review', 'Diagnostic Panels', 'Follow-up Testing', 'Preventive Screening'],
        actions: {
            primaryText: 'Book Test',
            primaryAvailability: 'Next slot: Today',
            secondaryText: 'Call Lab',
            secondaryAvailability: 'Available for urgent support',
            tertiaryText: 'Request Info',
            tertiaryAvailability: 'Reply within 24h',
        },
    },
];

const resolveServiceDetailBlueprint = (service = {}) => {
    const normalized = `${service?.name || ''} ${service?.category_name || ''}`.toLowerCase();

    return fallbackServiceDetails.find((item) => normalized.includes(item.key)
        || (item.key === 'cardiology' && normalized.includes('heart'))
        || (item.key === 'neurology' && normalized.includes('neuro'))
        || (item.key === 'laboratory' && (normalized.includes('lab') || normalized.includes('test')))) || fallbackServiceDetails[1];
};

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

export default function ServiceDetails({ auth, service }) {
    const { site = {} } = usePage().props;
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [cities, setCities] = useState([]);
    const [slotData, setSlotData] = useState([]);
    const [bookingForm] = Form.useForm();

    const detail = resolveServiceDetailBlueprint(service);
    const pageTitle = `${service?.name || 'Service'} Details - Hello Doctors`;
    const canonicalPath = `/services/${service?.code || service?.id || 'service'}`;
    const isPatient = auth?.user?.role === 'patient';
    const isLoggedIn = Boolean(auth?.user);
    const displayCategory = service?.category_name || detail.category;
    const displayTitle = service?.name ? `${service.name} Service Details` : detail.title;
    const statOne = service?.providers_count ? `${service.providers_count}+` : detail.stats[0].number;
    const statTwo = service?.duration_minutes ? `${service.duration_minutes} Min` : detail.stats[1].number;
    const contactPhone = site?.contact?.phone || '+91 (555) 123-4567';
    const contactPhoneHref = `tel:${String(contactPhone).replace(/[^+\d]/g, '')}`;
    const selectedCityId = Form.useWatch('city_id', bookingForm);
    const selectedDate = Form.useWatch('service_date', bookingForm);
    const selectedPaymentMethod = Form.useWatch('payment_method', bookingForm) || 'online';
    const canDirectBook = Boolean(service?.id) && Number(service?.providers_count || 0) > 0;
    const bookingNote = !canDirectBook
        ? 'This home service is currently unavailable because no verified provider schedules are active yet.'
        : isPatient
            ? 'You can book this home service directly from this page.'
            : !isLoggedIn
                ? 'Login as a patient to book this home service directly.'
                : 'The usual patient dashboard booking flow is still available.';

    const slotOptions = useMemo(() => {
        const options = [];

        slotData.forEach((providerItem) => {
            (providerItem.slots || []).forEach((slot) => {
                options.push({
                    value: `${providerItem.provider.id}|${slot.time}`,
                    label: `${slot.label || slot.time} - ${providerItem.provider.name} (${providerItem.provider.provider_type})`,
                });
            });
        });

        return options;
    }, [slotData]);

    const pricing = getPricingSummary(service?.base_price, selectedPaymentMethod);

    const loadBookingData = async () => {
        if (!isPatient) {
            return;
        }

        setBookingLoading(true);

        try {
            const [addressRes, citiesRes] = await Promise.all([
                window.axios.get('/patient/data/addresses'),
                window.axios.get('/patient/data/meta/cities'),
            ]);

            const addressList = addressRes.data?.data || [];
            const cityList = citiesRes.data?.data || citiesRes.data || [];
            const defaultAddress = addressList.find((item) => item.is_default) || addressList[0] || null;
            const defaultDate = new Date().toISOString().slice(0, 10);

            setAddresses(addressList);
            setCities(cityList);
            bookingForm.setFieldsValue({
                address_id: defaultAddress?.id || null,
                city_id: defaultAddress?.city_id || null,
                service_date: bookingForm.getFieldValue('service_date') || defaultDate,
                provider_slot: null,
                preferred_time: null,
                payment_method: 'online',
                special_instructions: '',
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load booking details.');
        } finally {
            setBookingLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        if (!isPatient || !service?.id || !selectedCityId || !selectedDate) {
            setSlotData([]);
            bookingForm.setFieldValue('provider_slot', null);
            return;
        }

        setBookingLoading(true);

        try {
            const response = await window.axios.get(`/patient/data/home-services/${service.id}/available-slots`, {
                params: {
                    city_id: selectedCityId,
                    date: selectedDate,
                },
            });

            setSlotData(response.data?.data || []);
            bookingForm.setFieldValue('provider_slot', null);
        } catch (error) {
            setSlotData([]);
            message.error(error?.response?.data?.message || 'Failed to load available slots.');
        } finally {
            setBookingLoading(false);
        }
    };

    useEffect(() => {
        if (bookingOpen && isPatient && selectedCityId && selectedDate) {
            loadAvailableSlots();
        }
    }, [bookingOpen, isPatient, selectedCityId, selectedDate]);

    const openBookingModal = async () => {
        if (!canDirectBook) {
            message.info('This service is not available for booking right now.');
            return;
        }

        setBookingOpen(true);
        await loadBookingData();
    };

    const onAddressChange = (addressId) => {
        const address = addresses.find((item) => item.id === addressId);
        if (address) {
            bookingForm.setFieldValue('city_id', address.city_id);
        }
    };

    const confirmBooking = async () => {
        try {
            const values = await bookingForm.validateFields();
            setBookingSubmitting(true);

            let providerId = null;
            let serviceTime = values.preferred_time || null;

            if (values.provider_slot) {
                const [provider, time] = String(values.provider_slot).split('|');
                providerId = Number(provider);
                serviceTime = time;
            }

            if (!serviceTime) {
                message.error('Please choose an available slot or preferred time.');
                setBookingSubmitting(false);
                return;
            }

            const bookingParams = {
                type: 'home_service',
                payment_method: values.payment_method,
                home_service_id: service.id,
                address_id: values.address_id,
                provider_id: providerId,
                service_date: values.service_date,
                service_time: serviceTime,
                special_instructions: values.special_instructions || null,
            };

            const orderRes = await window.axios.post('/patient/data/payment/create-order', bookingParams);
            const orderData = orderRes.data;

            if (orderData.skip_payment) {
                await window.axios.post('/patient/data/home-service-bookings', {
                    home_service_id: service.id,
                    address_id: values.address_id,
                    provider_id: providerId,
                    service_date: values.service_date,
                    service_time: serviceTime,
                    special_instructions: values.special_instructions || null,
                    payment_method: values.payment_method === 'online' ? undefined : 'cod',
                });

                message.success(values.payment_method === 'online'
                    ? 'Home service booked successfully.'
                    : 'Home service booked successfully. Please pay on visit.');
                window.location.href = '/patient/home-services/bookings';
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
                    description: service?.name ? `Home Service: ${service.name}` : 'Home Service Booking',
                    handler: async (response) => {
                        try {
                            await window.axios.post('/patient/data/payment/verify', {
                                ...bookingParams,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            message.success('Home service booked and payment successful!');
                            window.location.href = '/patient/home-services/bookings';
                            resolve();
                        } catch (error) {
                            message.error(error?.response?.data?.message || 'Payment verified but booking failed. Please contact support.');
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            message.warning('Payment was not completed. Your booking has not been placed.');
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

            message.error(error?.response?.data?.message || 'Failed to create home service booking.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    return (
        <>
            <Head title={pageTitle}>
                <meta
                    name="description"
                    content={service?.description || `${service?.name || 'Service'} details, features, and consultation support at Hello Doctors.`}
                />
                <meta name="keywords" content={`${service?.name || 'service'}, service details, healthcare support, hello doctors`} />
                <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : canonicalPath} />
            </Head>

            <PublicLayout auth={auth} title={pageTitle} pageClassName="service-details-page">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Service Details</h1>
                                    <p className="mb-0">
                                        Explore complete information about {service?.name || 'this service'}, including features, care pathways, and booking options.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li><Link href="/services">Services</Link></li>
                                <li className="current">Service Details</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section id="service-details-2" className="service-details-2 section">
                    <div className="container" data-aos="fade-up" data-aos-delay="100">
                        <div className="row">
                            <div className="col-lg-8 mx-auto text-center mb-5" data-aos="fade-up" data-aos-delay="150">
                                <div className="service-header">
                                    <div className="service-category">
                                        <span>{displayCategory}</span>
                                    </div>
                                    <h2>{displayTitle}</h2>
                                    <p className="lead">{service?.description || detail.lead}</p>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 align-items-center">
                            <div className="col-lg-5" data-aos="fade-right" data-aos-delay="200">
                                <div className="service-details">
                                    {detail.details.map((item) => (
                                        <div className="detail-item" key={item.title}>
                                            <div className="icon-wrapper">
                                                <i className={item.icon} />
                                            </div>
                                            <div className="content">
                                                <h4>{item.title}</h4>
                                                <p>{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-lg-7" data-aos="fade-left" data-aos-delay="300">
                                <div className="service-visual">
                                    <img src={detail.image} alt={`${service?.name || 'Service'} Visual`} className="img-fluid" />
                                    <div className="visual-overlay">
                                        <div className="stats-card">
                                            <div className="stat">
                                                <span className="number">{statOne}</span>
                                                <span className="label">Providers</span>
                                            </div>
                                            <div className="stat">
                                                <span className="number">{statTwo}</span>
                                                <span className="label">Visit Duration</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 mt-5">
                            <div className="col-12" data-aos="fade-up" data-aos-delay="100">
                                <div className="service-overview">
                                    <div className="row align-items-center">
                                        <div className="col-lg-6">
                                            <h3>{detail.overviewTitle}</h3>
                                            <p>{detail.overviewText}</p>

                                            <div className="features-grid">
                                                {detail.features.map((feature) => (
                                                    <div className="feature" key={feature}>
                                                        <i className="bi bi-check2-circle" />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="treatment-areas">
                                                <h4>What This Service Supports</h4>
                                                <div className="condition-tags">
                                                    {detail.conditions.map((condition) => (
                                                        <span className="tag" key={condition}>{condition}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row gy-4 mt-5">
                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="100">
                                <div className="action-card primary">
                                    <div className="card-header">
                                        <i className="bi bi-calendar-check" />
                                        <h4>Schedule Consultation</h4>
                                    </div>
                                    <p>{bookingNote}</p>
                                    <div className="card-footer">
                                        {canDirectBook ? (
                                            isPatient ? (
                                                <button type="button" className="btn-action" onClick={openBookingModal}>
                                                    {detail.actions.primaryText}
                                                </button>
                                            ) : !isLoggedIn ? (
                                                <Link href="/login" className="btn-action">Login to Book</Link>
                                            ) : (
                                                <Link href={`/patient/home-services/book?service_id=${service?.id || ''}`} className="btn-action">Book from Dashboard</Link>
                                            )
                                        ) : (
                                            <button type="button" className="btn-action" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                                                Booking Unavailable
                                            </button>
                                        )}
                                        <span className="availability">
                                            {canDirectBook
                                                ? (isPatient ? 'Direct booking available' : !isLoggedIn ? 'Patient login required' : 'Dashboard booking available')
                                                : 'No active provider slots'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="200">
                                <div className="action-card secondary">
                                    <div className="card-header">
                                        <i className="bi bi-telephone" />
                                        <h4>Emergency Consultation</h4>
                                    </div>
                                    <p>Connect quickly for urgent support or immediate service coordination.</p>
                                    <div className="card-footer">
                                        <a href={contactPhoneHref} className="btn-action">{detail.actions.secondaryText}</a>
                                        <span className="availability">{contactPhone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4" data-aos="zoom-in" data-aos-delay="300">
                                <div className="action-card tertiary">
                                    <div className="card-header">
                                        <i className="bi bi-file-text" />
                                        <h4>Get More Details</h4>
                                    </div>
                                    <p>Request additional information about this service and next-step guidance.</p>
                                    <div className="card-footer">
                                        <Link href="/contact" className="btn-action">{detail.actions.tertiaryText}</Link>
                                        <span className="availability">{detail.actions.tertiaryAvailability}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Modal
                        title={`Book ${service?.name || 'Home Service'}`}
                        open={bookingOpen}
                        onCancel={() => setBookingOpen(false)}
                        onOk={confirmBooking}
                        okText="Confirm Booking"
                        confirmLoading={bookingSubmitting}
                        okButtonProps={{ disabled: bookingLoading || addresses.length === 0 }}
                        width={720}
                        destroyOnClose
                    >
                        <Form form={bookingForm} layout="vertical" initialValues={{ payment_method: 'online' }}>
                            {addresses.length === 0 && !bookingLoading ? (
                                <Empty
                                    description="Please add a service address before booking this home service."
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Link href="/patient/home-services/addresses">
                                        <Button type="primary">Manage Addresses</Button>
                                    </Link>
                                </Empty>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 16, color: '#595959' }}>
                                        Complete your booking details below. You can still use the patient dashboard flow anytime.
                                    </div>

                                    <Form.Item
                                        label="Service"
                                        name="service_name"
                                        initialValue={service?.name || 'Selected Home Service'}
                                    >
                                        <Input disabled />
                                    </Form.Item>

                                    <Form.Item
                                        label="Address"
                                        name="address_id"
                                        rules={[{ required: true, message: 'Please select address.' }]}
                                    >
                                        <Select
                                            placeholder="Select address"
                                            options={addresses.map((address) => ({
                                                value: address.id,
                                                label: `${address.label}: ${address.line1}, ${address.city?.name || ''}`,
                                            }))}
                                            onChange={onAddressChange}
                                        />
                                    </Form.Item>

                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                        <Form.Item
                                            label="City"
                                            name="city_id"
                                            rules={[{ required: true, message: 'Please select city.' }]}
                                        >
                                            <Select
                                                placeholder="Service city"
                                                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Service Date"
                                            name="service_date"
                                            rules={[{ required: true, message: 'Please select a date.' }]}
                                        >
                                            <Input type="date" min={new Date().toISOString().slice(0, 10)} />
                                        </Form.Item>

                                        <Form.Item label="Available Provider Slot" name="provider_slot">
                                            <Select
                                                allowClear
                                                placeholder={bookingLoading ? 'Loading slots...' : 'Choose a provider slot'}
                                                options={slotOptions}
                                                notFoundContent={bookingLoading ? 'Loading slots...' : 'No slots found for the selected date'}
                                            />
                                        </Form.Item>

                                        <Form.Item label="Preferred Time (optional)" name="preferred_time">
                                            <Input type="time" />
                                        </Form.Item>
                                    </Space>

                                    <Form.Item label="Payment Method" name="payment_method">
                                        <Radio.Group>
                                            <Space direction="vertical">
                                                <Radio value="online">Pay Online ({ONLINE_DISCOUNT_PERCENT}% off)</Radio>
                                                <Radio value="cod">Pay on Visit</Radio>
                                            </Space>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Alert
                                        type={selectedPaymentMethod === 'online' ? 'success' : 'warning'}
                                        showIcon
                                        style={{ marginBottom: 12 }}
                                        message={selectedPaymentMethod === 'online'
                                            ? `Online payment saves ₹${pricing.discountAmount.toFixed(2)} on this booking.`
                                            : 'No discount is applied for C.O.D. / pay-on-visit bookings.'}
                                    />

                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 12 }}
                                        message="Refund Policy"
                                        description="For online payments only: cancel more than 1 hour before the booked time to get a 90% refund; within 1 hour, you get an 80% refund. No refund applies for C.O.D. / pay-on-visit bookings or after the service time."
                                    />

                                    <Form.Item label="Special Instructions" name="special_instructions">
                                        <Input.TextArea rows={3} placeholder="Add any special instructions for the provider" />
                                    </Form.Item>

                                    <div style={{ background: '#fafafa', borderRadius: 8, padding: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span>Service Fee</span>
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
                                </>
                            )}
                        </Form>
                    </Modal>
                </section>
            </PublicLayout>
        </>
    );
}
