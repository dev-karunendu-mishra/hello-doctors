import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Space,
    Spin,
    TimePicker,
    Typography,
    message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;
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

export default function HomeServicesBook() {
    const { payments = {} } = usePage().props;
    const onlinePaymentsEnabled = payments?.online_enabled ?? true;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [services, setServices] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [cities, setCities] = useState([]);
    const [slotData, setSlotData] = useState([]);

    const selectedServiceId = Form.useWatch('home_service_id', form);
    const selectedCityId = Form.useWatch('city_id', form);
    const selectedDate = Form.useWatch('service_date', form);
    const selectedPaymentMethod = Form.useWatch('payment_method', form) || (onlinePaymentsEnabled ? 'online' : 'cod');

    const serviceById = useMemo(() => {
        const map = new Map();
        services.forEach((service) => map.set(service.id, service));
        return map;
    }, [services]);

    const slotOptions = useMemo(() => {
        const options = [];
        slotData.forEach((providerItem) => {
            providerItem.slots.forEach((slot) => {
                options.push({
                    value: `${providerItem.provider.id}|${slot.time}`,
                    label: `${slot.time} - ${providerItem.provider.name} (${providerItem.provider.provider_type})`,
                });
            });
        });
        return options;
    }, [slotData]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [servicesRes, addressRes, citiesRes] = await Promise.all([
                window.axios.get('/patient/data/home-services'),
                window.axios.get('/patient/data/addresses'),
                window.axios.get('/patient/data/meta/cities'),
            ]);

            setServices(servicesRes.data?.data || []);
            setAddresses(addressRes.data?.data || []);
            setCities(citiesRes.data?.data || citiesRes.data || []);

            const url = new URL(window.location.href);
            const serviceId = Number(url.searchParams.get('service_id') || 0);
            if (serviceId) {
                form.setFieldValue('home_service_id', serviceId);
            }

            const defaultAddress = (addressRes.data?.data || []).find((item) => item.is_default);
            if (defaultAddress) {
                form.setFieldValue('address_id', defaultAddress.id);
                form.setFieldValue('city_id', defaultAddress.city_id);
            }
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load booking data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadSlots = async () => {
        const values = form.getFieldsValue();
        if (!values.home_service_id || !values.city_id || !values.service_date) {
            setSlotData([]);
            form.setFieldValue('provider_slot', null);
            return;
        }

        try {
            setLoading(true);
            const response = await window.axios.get(`/patient/data/home-services/${values.home_service_id}/available-slots`, {
                params: {
                    city_id: values.city_id,
                    date: dayjs(values.service_date).format('YYYY-MM-DD'),
                },
            });

            setSlotData(response.data?.data || []);
            form.setFieldValue('provider_slot', null);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load slots.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedServiceId && selectedCityId && selectedDate) {
            loadSlots();
        }
    }, [selectedServiceId, selectedCityId, selectedDate]);

    const onAddressChange = (addressId) => {
        const address = addresses.find((item) => item.id === addressId);
        if (address) {
            form.setFieldValue('city_id', address.city_id);
        }
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            let providerId = null;
            let serviceTime = values.service_time ? dayjs(values.service_time).format('HH:mm') : null;

            if (values.provider_slot) {
                const [provider, time] = String(values.provider_slot).split('|');
                providerId = Number(provider);
                serviceTime = time;
            }

            if (!serviceTime) {
                message.error('Please choose a slot or preferred time.');
                setSubmitting(false);
                return;
            }

            const bookingParams = {
                type: 'home_service',
                payment_method: values.payment_method,
                home_service_id: values.home_service_id,
                address_id: values.address_id,
                provider_id: providerId,
                service_date: dayjs(values.service_date).format('YYYY-MM-DD'),
                service_time: serviceTime,
                special_instructions: values.special_instructions || null,
            };

            // Step 1: Create Razorpay order
            const orderRes = await window.axios.post('/patient/data/payment/create-order', bookingParams);
            const orderData = orderRes.data;

            // Free booking — skip payment, book directly
            if (orderData.skip_payment) {
                await window.axios.post('/patient/data/home-service-bookings', {
                    home_service_id: values.home_service_id,
                    address_id: values.address_id,
                    provider_id: providerId,
                    service_date: dayjs(values.service_date).format('YYYY-MM-DD'),
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

            // Step 2: Load Razorpay script
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                message.error('Could not load payment gateway. Please try again.');
                setSubmitting(false);
                return;
            }

            // Step 3: Open Razorpay checkout
            const selectedService = serviceById.get(values.home_service_id);
            await new Promise((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: orderData.key_id,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Hello Doctors',
                    description: selectedService ? `Home Service: ${selectedService.name}` : 'Home Service Booking',
                    handler: async (response) => {
                        try {
                            // Step 4: Verify payment and create booking
                            await window.axios.post('/patient/data/payment/verify', {
                                ...bookingParams,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            message.success('Home service booked and payment successful!');
                            window.location.href = '/patient/home-services/bookings';
                            resolve();
                        } catch (err) {
                            message.error(err?.response?.data?.message || 'Payment verified but booking failed. Please contact support.');
                            reject(err);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            message.warning('Payment was not completed. Your booking has not been placed.');
                            resolve();
                        },
                    },
                    prefill: {},
                    theme: { color: '#1677ff' },
                });
                rzp.open();
            });
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to create booking.');
        } finally {
            setSubmitting(false);
        }
    };

    const pricing = getPricingSummary(serviceById.get(selectedServiceId)?.base_price, selectedPaymentMethod);

    return (
        <AdminLayout>
            <Head title="Book Home Service" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <Title level={3} style={{ marginBottom: 0 }}>Book Home Service</Title>
                        <Text type="secondary">Choose service, address, date and available slot.</Text>
                    </div>
                    <Space>
                        <Link href="/patient/home-services/addresses">
                            <Button>Manage Addresses</Button>
                        </Link>
                        <Link href="/patient/home-services">
                            <Button>Back to Services</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="If no provider slot is selected, you can still place a booking request with preferred time."
                />

                <Spin spinning={loading}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} xl={16}>
                            <Card>
                                <Form form={form} layout="vertical" initialValues={{ payment_method: onlinePaymentsEnabled ? 'online' : 'cod' }}>
                                    <Row gutter={12}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Service"
                                                name="home_service_id"
                                                rules={[{ required: true, message: 'Please select service.' }]}
                                            >
                                                <Select
                                                    placeholder="Select service"
                                                    options={services.map((service) => ({
                                                        value: service.id,
                                                        label: `${service.name} (INR ${service.base_price})`,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
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
                                        </Col>
                                    </Row>

                                    <Row gutter={12}>
                                        <Col xs={24} md={8}>
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
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Date"
                                                name="service_date"
                                                rules={[{ required: true, message: 'Please select date.' }]}
                                            >
                                                <DatePicker
                                                    style={{ width: '100%' }}
                                                    format="YYYY-MM-DD"
                                                    disabledDate={(current) => current && current.startOf('day').isBefore(dayjs().startOf('day'))}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Preferred Time (optional)" name="service_time">
                                                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={5} />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label="Available Provider Slots" name="provider_slot">
                                        <Select
                                            allowClear
                                            showSearch
                                            placeholder="Choose provider and slot"
                                            options={slotOptions}
                                            notFoundContent={selectedServiceId && selectedCityId && selectedDate ? 'No slots found' : 'Select service, city and date'}
                                        />
                                    </Form.Item>

                                    <Form.Item name="payment_method" label="Payment Option" rules={[{ required: true }]}> 
                                        <Radio.Group optionType="button" buttonStyle="solid">
                                            {onlinePaymentsEnabled && <Radio.Button value="online">Pay Online ({ONLINE_DISCOUNT_PERCENT}% off)</Radio.Button>}
                                            <Radio.Button value="cod">Pay on Visit (C.O.D.)</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>

                                    {!onlinePaymentsEnabled && (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                            message="Online payment is currently disabled. Pay-on-visit is available."
                                        />
                                    )}

                                    <Alert
                                        type={selectedPaymentMethod === 'online' ? 'success' : 'warning'}
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message={selectedPaymentMethod === 'online'
                                            ? `Online payment saves ₹${pricing.discountAmount} on this booking.`
                                            : 'No discount is applied for C.O.D. / pay-on-visit bookings.'}
                                    />

                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message="Refund Policy"
                                        description="For online payments only: cancel more than 1 hour before the booked time to get a 90% refund; within 1 hour, you get an 80% refund. No refund applies for C.O.D. / pay-on-visit bookings or after the service time."
                                    />

                                    <Form.Item label="Special Instructions" name="special_instructions">
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="Mention patient condition, floor, lift availability, anything important for provider."
                                        />
                                    </Form.Item>

                                    <Space>
                                        <Button type="primary" loading={submitting} onClick={onSubmit}>
                                            {selectedPaymentMethod === 'online'
                                                ? `Pay ₹${pricing.payableAmount} & Book`
                                                : 'Book & Pay on Visit'}
                                        </Button>
                                        <Link href="/patient/home-services/bookings">
                                            <Button>View My Bookings</Button>
                                        </Link>
                                    </Space>
                                </Form>
                            </Card>
                        </Col>

                        <Col xs={24} xl={8}>
                            <Card title="Service Summary">
                                {selectedServiceId ? (
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text strong>{serviceById.get(selectedServiceId)?.name}</Text>
                                        <Text>Duration: {serviceById.get(selectedServiceId)?.duration_minutes || '-'} minutes</Text>
                                        <Text>Base Price: INR {serviceById.get(selectedServiceId)?.base_price || '-'}</Text>
                                        <Text>Discount: INR {selectedPaymentMethod === 'online' ? pricing.discountAmount : 0}</Text>
                                        <Text strong>Payable: INR {pricing.payableAmount}</Text>
                                        <Text type="secondary">
                                            {selectedPaymentMethod === 'online'
                                                ? `You save ${ONLINE_DISCOUNT_PERCENT}% with online payment.`
                                                : 'No discount is available for C.O.D. / pay on visit.'}
                                        </Text>
                                    </Space>
                                ) : (
                                    <Empty description="Select a service to view summary" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Spin>
            </Space>
        </AdminLayout>
    );
}
