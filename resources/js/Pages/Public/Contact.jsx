import { Head, useForm } from '@inertiajs/react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import PublicLayout from '@/Layouts/PublicLayout';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function Contact({ auth, flash }) {
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
            <Head title="Contact Us - Hello Doctors" />

            <PublicLayout auth={auth} title="Contact Us - Hello Doctors">
                <div className="min-h-screen bg-slate-50 py-10 lg:py-14">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="mb-8 text-center">
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                                Contact Hello Doctors
                            </span>
                            <Title level={2} className="!mt-4 !mb-2">Let’s help you reach the right care team.</Title>
                            <Paragraph className="mx-auto max-w-2xl text-base text-slate-600">
                                Have a question, need platform support, or want to discuss partnership options? We’d love to hear from you.
                            </Paragraph>
                        </div>

                        {flash?.success && (
                            <Alert
                                message="Success"
                                description={flash.success}
                                type="success"
                                showIcon
                                closable
                                className="mb-6"
                            />
                        )}

                        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                            <Card className="rounded-[28px] border-0 bg-gradient-to-br from-sky-950 via-sky-900 to-cyan-800 text-white shadow-xl">
                                <Title level={3} className="!text-white">Reach us directly</Title>
                                <Paragraph className="!text-sky-100">
                                    We’re here to support patients, doctors, and provider partners with onboarding, discovery, and platform queries.
                                </Paragraph>

                                <div className="mt-6 space-y-4 text-sm">
                                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                                        <div className="font-semibold text-cyan-100">Email</div>
                                        <div className="mt-1 inline-flex items-center gap-2"><MailOutlined /> support@hellodoctors.org</div>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                                        <div className="font-semibold text-cyan-100">Phone</div>
                                        <div className="mt-1 inline-flex items-center gap-2"><PhoneOutlined /> +91-XXXXXXXXXX</div>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                                        <div className="font-semibold text-cyan-100">Support hours</div>
                                        <div className="mt-1">Monday to Saturday · 9:00 AM to 7:00 PM</div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="rounded-[28px] shadow-sm">
                                <form onSubmit={handleSubmit}>
                                    <Form layout="vertical">
                                        <Form.Item label="Your Name" validateStatus={errors.name ? 'error' : ''} help={errors.name}>
                                            <Input
                                                size="large"
                                                prefix={<UserOutlined />}
                                                placeholder="Enter your name"
                                                value={data.name}
                                                onChange={(event) => setData('name', event.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item label="Email Address" validateStatus={errors.email ? 'error' : ''} help={errors.email}>
                                            <Input
                                                size="large"
                                                type="email"
                                                prefix={<MailOutlined />}
                                                placeholder="Enter your email"
                                                value={data.email}
                                                onChange={(event) => setData('email', event.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item label="Phone Number" validateStatus={errors.phone ? 'error' : ''} help={errors.phone}>
                                            <Input
                                                size="large"
                                                prefix={<PhoneOutlined />}
                                                placeholder="Enter your phone number"
                                                value={data.phone}
                                                onChange={(event) => setData('phone', event.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item label="Message" validateStatus={errors.message ? 'error' : ''} help={errors.message}>
                                            <TextArea
                                                rows={6}
                                                placeholder="How can we help you?"
                                                value={data.message}
                                                onChange={(event) => setData('message', event.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item className="!mb-0">
                                            <Button type="primary" size="large" htmlType="submit" loading={processing} block>
                                                Send Message
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </form>
                            </Card>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
