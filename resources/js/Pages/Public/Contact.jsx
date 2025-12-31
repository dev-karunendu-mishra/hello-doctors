import { Head, useForm } from '@inertiajs/react';
import { Card, Form, Input, Button, Typography, Alert } from 'antd';
import { MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function Contact({ flash }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/contact');
    };

    return (
        <>
            <Head title="Contact Us - Hello Doctors" />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Title level={2} className="text-center mb-6">Contact Us</Title>
                    <Paragraph className="text-center text-lg mb-8">
                        Have questions or need assistance? We'd love to hear from you!
                    </Paragraph>

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

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <Form layout="vertical">
                                <Form.Item 
                                    label="Your Name" 
                                    validateStatus={errors.name ? 'error' : ''}
                                    help={errors.name}
                                >
                                    <Input
                                        size="large"
                                        prefix={<UserOutlined />}
                                        placeholder="Enter your name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Email Address" 
                                    validateStatus={errors.email ? 'error' : ''}
                                    help={errors.email}
                                >
                                    <Input
                                        size="large"
                                        type="email"
                                        prefix={<MailOutlined />}
                                        placeholder="Enter your email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Phone Number" 
                                    validateStatus={errors.phone ? 'error' : ''}
                                    help={errors.phone}
                                >
                                    <Input
                                        size="large"
                                        prefix={<PhoneOutlined />}
                                        placeholder="Enter your phone number"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Message" 
                                    validateStatus={errors.message ? 'error' : ''}
                                    help={errors.message}
                                >
                                    <TextArea
                                        rows={6}
                                        placeholder="How can we help you?"
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        htmlType="submit"
                                        loading={processing}
                                        block
                                    >
                                        Send Message
                                    </Button>
                                </Form.Item>
                            </Form>
                        </form>
                    </Card>

                    {/* Contact Information */}
                    <div className="mt-8">
                        <Card title="Other Ways to Reach Us">
                            <Paragraph>
                                <MailOutlined /> Email: support@hellodoctors.org
                            </Paragraph>
                            <Paragraph>
                                <PhoneOutlined /> Phone: +91-XXXXXXXXXX
                            </Paragraph>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
