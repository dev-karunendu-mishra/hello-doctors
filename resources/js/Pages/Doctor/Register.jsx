import { Head, useForm } from '@inertiajs/react';
import { Card, Form, Input, Button, Select, Upload, Typography, Alert, Row, Col, Checkbox } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function Register({ auth, cities, specialties, flash, errors: serverErrors }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        specialty_id: null,
        qualification: '',
        experience_years: '',
        bio: '',
        consultation_fee: '',
        website: '',
        is_available_online: false,
        cities: [],
        profile_image: null,
    });

    const [fileList, setFileList] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/register-doctor');
    };

    const handleImageChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            setData('profile_image', newFileList[0].originFileObj);
        } else {
            setData('profile_image', null);
        }
    };

    const uploadProps = {
        beforeUpload: () => false,
        maxCount: 1,
        listType: 'picture',
        fileList,
        onChange: handleImageChange,
    };

    return (
        <>
            <Head title="Doctor Registration - Hello Doctors" />
            
            <Header auth={auth} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Title level={2} className="text-center mb-4">Doctor Registration</Title>
                    <Paragraph className="text-center text-lg mb-8">
                        Join Hello Doctors and connect with patients across multiple cities
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

                    {serverErrors && Object.keys(serverErrors).length > 0 && (
                        <Alert 
                            message="Please fix the errors below" 
                            type="error" 
                            showIcon 
                            className="mb-6"
                        />
                    )}

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <Title level={4}>Personal Information</Title>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Full Name" 
                                        validateStatus={errors.name ? 'error' : ''}
                                        help={errors.name}
                                        required
                                    >
                                        <Input
                                            size="large"
                                            prefix={<UserOutlined />}
                                            placeholder="Dr. John Doe"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Email" 
                                        validateStatus={errors.email ? 'error' : ''}
                                        help={errors.email}
                                        required
                                    >
                                        <Input
                                            size="large"
                                            type="email"
                                            prefix={<MailOutlined />}
                                            placeholder="doctor@example.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Password" 
                                        validateStatus={errors.password ? 'error' : ''}
                                        help={errors.password}
                                        required
                                    >
                                        <Input.Password
                                            size="large"
                                            placeholder="Create a strong password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Confirm Password" 
                                        validateStatus={errors.password_confirmation ? 'error' : ''}
                                        help={errors.password_confirmation}
                                        required
                                    >
                                        <Input.Password
                                            size="large"
                                            placeholder="Confirm your password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Phone" 
                                        validateStatus={errors.phone ? 'error' : ''}
                                        help={errors.phone}
                                        required
                                    >
                                        <Input
                                            size="large"
                                            prefix={<PhoneOutlined />}
                                            placeholder="+91 XXXXXXXXXX"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Website (Optional)" 
                                        validateStatus={errors.website ? 'error' : ''}
                                        help={errors.website}
                                    >
                                        <Input
                                            size="large"
                                            prefix={<GlobalOutlined />}
                                            placeholder="https://yourwebsite.com"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Title level={4} className="mt-6">Professional Information</Title>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Specialty" 
                                        validateStatus={errors.specialty_id ? 'error' : ''}
                                        help={errors.specialty_id}
                                        required
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Select your specialty"
                                            value={data.specialty_id}
                                            onChange={(value) => setData('specialty_id', value)}
                                        >
                                            {specialties.map(spec => (
                                                <Select.Option key={spec.id} value={spec.id}>
                                                    {spec.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Experience (Years)" 
                                        validateStatus={errors.experience_years ? 'error' : ''}
                                        help={errors.experience_years}
                                    >
                                        <Input
                                            size="large"
                                            type="number"
                                            placeholder="10"
                                            value={data.experience_years}
                                            onChange={(e) => setData('experience_years', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item 
                                label="Qualifications" 
                                validateStatus={errors.qualification ? 'error' : ''}
                                help={errors.qualification}
                                required
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="MBBS, MD (Medicine), DM (Cardiology)"
                                    value={data.qualification}
                                    onChange={(e) => setData('qualification', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item 
                                label="Bio / About" 
                                validateStatus={errors.bio ? 'error' : ''}
                                help={errors.bio}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Brief description about your practice and expertise..."
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Consultation Fee (₹)" 
                                        validateStatus={errors.consultation_fee ? 'error' : ''}
                                        help={errors.consultation_fee}
                                    >
                                        <Input
                                            size="large"
                                            type="number"
                                            placeholder="500"
                                            value={data.consultation_fee}
                                            onChange={(e) => setData('consultation_fee', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Practice Cities" 
                                        validateStatus={errors.cities ? 'error' : ''}
                                        help={errors.cities}
                                        required
                                    >
                                        <Select
                                            size="large"
                                            mode="multiple"
                                            placeholder="Select cities where you practice"
                                            value={data.cities}
                                            onChange={(values) => setData('cities', values)}
                                        >
                                            {cities.map(city => (
                                                <Select.Option key={city.id} value={city.id}>
                                                    {city.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item 
                                label="Profile Image" 
                                validateStatus={errors.profile_image ? 'error' : ''}
                                help={errors.profile_image}
                            >
                                <Upload {...uploadProps}>
                                    <Button icon={<UploadOutlined />}>Select Image</Button>
                                </Upload>
                            </Form.Item>

                            <Form.Item>
                                <Checkbox
                                    checked={data.is_available_online}
                                    onChange={(e) => setData('is_available_online', e.target.checked)}
                                >
                                    I offer online consultations
                                </Checkbox>
                            </Form.Item>

                            <Form.Item>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    htmlType="submit"
                                    loading={processing}
                                    block
                                >
                                    Register as Doctor
                                </Button>
                            </Form.Item>
                        </form>
                    </Card>

                    <div className="text-center mt-4">
                        <Paragraph>
                            Already have an account? <a href="/login">Login here</a>
                        </Paragraph>
                    </div>
                </div>
            </div>
            
            <Footer />
        </>
    );
}
