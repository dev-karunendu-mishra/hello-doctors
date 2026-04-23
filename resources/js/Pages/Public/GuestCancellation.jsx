import { Head, Link, usePage } from '@inertiajs/react';
import { Alert, Button, Card, Form, Input, Radio, Space, Steps, Typography, message } from 'antd';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useGoogleReCAPTCHA } from '@/Hooks/useGoogleReCAPTCHA';

const { Paragraph, Text, Title } = Typography;

export default function GuestCancellation({ auth }) {
    const { recaptcha = {} } = usePage().props;
    const { executeRecaptcha } = useGoogleReCAPTCHA(recaptcha?.site_key || '');
    const [initForm] = Form.useForm();
    const [verifyForm] = Form.useForm();
    const [cancelForm] = Form.useForm();

    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0);
    const [bookingType, setBookingType] = useState('appointment');
    const [bookingNumber, setBookingNumber] = useState('');
    const [cancelToken, setCancelToken] = useState('');
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [completed, setCompleted] = useState(false);

    const submitInit = async () => {
        try {
            const values = await initForm.validateFields();
            setSubmitting(true);

            // Get CAPTCHA token for cancellation init
            let captchaToken = null;
            if (recaptcha?.site_key) {
                captchaToken = await executeRecaptcha('guest_cancellation_init');
                if (!captchaToken) {
                    message.error('CAPTCHA verification failed. Please try again.');
                    return;
                }
            }

            await window.axios.post('/guest/data/cancellations/init', {
                type: values.type,
                booking_number: values.booking_number,
                guest_email: values.guest_email || undefined,
                guest_phone: values.guest_phone || undefined,
                captcha_token: captchaToken,
            });

            setBookingType(values.type);
            setBookingNumber(values.booking_number);
            setStep(1);
            message.success('Verification code sent to your registered guest contact.');
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || 'Failed to start cancellation verification.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitVerify = async () => {
        try {
            const values = await verifyForm.validateFields();
            setSubmitting(true);

            const response = await window.axios.post('/guest/data/cancellations/verify', {
                type: bookingType,
                booking_number: bookingNumber,
                verification_code: values.verification_code,
            });

            setCancelToken(response?.data?.cancel_token || '');
            setTokenExpiry(response?.data?.expires_at || null);
            setStep(2);
            message.success('Verification successful. You can now submit cancellation.');
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || 'Verification failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitCancel = async () => {
        try {
            const values = await cancelForm.validateFields();
            setSubmitting(true);

            const endpoint = bookingType === 'appointment'
                ? '/guest/data/appointments/cancel'
                : '/guest/data/home-service-bookings/cancel';

            const payload = bookingType === 'appointment'
                ? {
                    appointment_number: bookingNumber,
                    cancel_token: cancelToken,
                    reason: values.reason || undefined,
                }
                : {
                    booking_number: bookingNumber,
                    cancel_token: cancelToken,
                    reason: values.reason || undefined,
                };

            const response = await window.axios.post(endpoint, payload);
            message.success(response?.data?.message || 'Booking cancelled successfully.');
            setCompleted(true);
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || 'Cancellation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetFlow = () => {
        initForm.resetFields();
        verifyForm.resetFields();
        cancelForm.resetFields();
        setStep(0);
        setBookingType('appointment');
        setBookingNumber('');
        setCancelToken('');
        setTokenExpiry(null);
        setCompleted(false);
    };

    return (
        <>
            <Head title="Cancel Guest Booking - Hello Doctors" />

            <PublicLayout auth={auth} title="Cancel Guest Booking - Hello Doctors">
                <div className="page-title">
                    <div className="heading">
                        <div className="container">
                            <div className="row d-flex justify-content-center text-center">
                                <div className="col-lg-8">
                                    <h1 className="heading-title">Cancel Guest Booking</h1>
                                    <p className="mb-0">
                                        Verify your booking details, confirm with OTP, and submit cancellation securely.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <nav className="breadcrumbs">
                        <div className="container">
                            <ol>
                                <li><Link href="/">Home</Link></li>
                                <li className="current">Cancel Guest Booking</li>
                            </ol>
                        </div>
                    </nav>
                </div>

                <section className="section">
                    <div className="container" style={{ maxWidth: 880 }}>
                        <Card>
                            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                                <Steps
                                    current={step}
                                    items={[
                                        { title: 'Identify Booking' },
                                        { title: 'Verify Code' },
                                        { title: 'Confirm Cancellation' },
                                    ]}
                                />

                                <Alert
                                    type="info"
                                    showIcon
                                    message="For privacy, verification responses do not reveal whether a booking exists until verification succeeds."
                                />

                                {step === 0 && (
                                    <Form form={initForm} layout="vertical" initialValues={{ type: 'appointment' }}>
                                        <Form.Item label="Booking Type" name="type" rules={[{ required: true }]}>
                                            <Radio.Group>
                                                <Space>
                                                    <Radio value="appointment">Doctor Appointment</Radio>
                                                    <Radio value="home_service">Home Service Booking</Radio>
                                                </Space>
                                            </Radio.Group>
                                        </Form.Item>

                                        <Form.Item
                                            label="Booking Number"
                                            name="booking_number"
                                            rules={[{ required: true, message: 'Please enter booking number.' }]}
                                        >
                                            <Input placeholder="APT-2026-000123 or HSB-2026-000123" />
                                        </Form.Item>

                                        <Form.Item
                                            label="Guest Email"
                                            name="guest_email"
                                            rules={[{ type: 'email', message: 'Enter a valid email.' }]}
                                        >
                                            <Input placeholder="you@example.com" />
                                        </Form.Item>

                                        <Form.Item label="Guest Phone" name="guest_phone">
                                            <Input placeholder="10-digit mobile" />
                                        </Form.Item>

                                        <Paragraph type="secondary" style={{ marginTop: -8 }}>
                                            Provide at least one contact value: email or phone.
                                        </Paragraph>

                                        <Button type="primary" onClick={submitInit} loading={submitting}>
                                            Send Verification Code
                                        </Button>
                                    </Form>
                                )}

                                {step === 1 && (
                                    <Form form={verifyForm} layout="vertical">
                                        <Alert
                                            type="success"
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                            message="Verification code sent"
                                            description={`Type: ${bookingType === 'appointment' ? 'Appointment' : 'Home Service'} | Booking: ${bookingNumber}`}
                                        />

                                        <Form.Item
                                            label="Verification Code"
                                            name="verification_code"
                                            rules={[{ required: true, message: 'Enter 6-digit code.' }]}
                                        >
                                            <Input placeholder="6-digit code" maxLength={6} />
                                        </Form.Item>

                                        <Space>
                                            <Button onClick={() => setStep(0)}>Back</Button>
                                            <Button type="primary" onClick={submitVerify} loading={submitting}>
                                                Verify
                                            </Button>
                                        </Space>
                                    </Form>
                                )}

                                {step === 2 && !completed && (
                                    <Form form={cancelForm} layout="vertical">
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                            message="Verification completed"
                                            description={tokenExpiry ? `Cancel token expires at: ${tokenExpiry}` : 'Cancel token is active for a limited time.'}
                                        />

                                        <Form.Item label="Cancellation Reason (optional)" name="reason">
                                            <Input.TextArea rows={3} placeholder="Share a brief reason" />
                                        </Form.Item>

                                        <Space>
                                            <Button onClick={() => setStep(1)}>Back</Button>
                                            <Button type="primary" danger onClick={submitCancel} loading={submitting}>
                                                Confirm Cancellation
                                            </Button>
                                        </Space>
                                    </Form>
                                )}

                                {completed && (
                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                        <Title level={4} style={{ margin: 0 }}>Booking Cancelled</Title>
                                        <Text type="secondary">
                                            Your guest booking has been cancelled. If your booking was eligible for refund, it has been initiated.
                                        </Text>
                                        <Space>
                                            <Button type="primary" onClick={resetFlow}>Cancel Another Booking</Button>
                                            <Link href="/">
                                                <Button>Back to Home</Button>
                                            </Link>
                                        </Space>
                                    </Space>
                                )}
                            </Space>
                        </Card>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
