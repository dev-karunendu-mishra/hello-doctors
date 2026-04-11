import { Link, useForm } from '@inertiajs/react';
import { Card, Form, Input, Button, Select, Upload, Typography, Alert, Row, Col, Checkbox, Steps } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined, GlobalOutlined } from '@ant-design/icons';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

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
    const [currentStep, setCurrentStep] = useState(0);
    const [stepError, setStepError] = useState('');

    const stepItems = [
        { title: 'Personal Info' },
        { title: 'Professional Info' },
        { title: 'Review & Submit' },
    ];

    const validateStep = (step) => {
        if (step === 0) {
            if (!String(data.name || '').trim()) return 'Please enter your full name.';
            if (!String(data.email || '').trim()) return 'Please enter your email.';
            if (!String(data.password || '').trim()) return 'Please enter a password.';
            if (!String(data.password_confirmation || '').trim()) return 'Please confirm your password.';
            if (data.password !== data.password_confirmation) return 'Password and confirmation must match.';
            if (!String(data.phone || '').trim()) return 'Please enter your phone number.';
        }

        if (step === 1) {
            if (!data.specialty_id) return 'Please select a specialty.';
            if (!String(data.qualification || '').trim()) return 'Please enter your qualifications.';
            if (!Array.isArray(data.cities) || data.cities.length === 0) return 'Please select at least one practice city.';
        }

        return '';
    };

    const goToNextStep = () => {
        const validationError = validateStep(currentStep);
        if (validationError) {
            setStepError(validationError);
            return;
        }

        setStepError('');
        setCurrentStep((value) => Math.min(value + 1, stepItems.length - 1));
    };

    const goToPreviousStep = () => {
        setStepError('');
        setCurrentStep((value) => Math.max(value - 1, 0));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const personalInfoError = validateStep(0);
        const professionalInfoError = validateStep(1);

        if (personalInfoError || professionalInfoError) {
            setStepError(personalInfoError || professionalInfoError);
            setCurrentStep(personalInfoError ? 0 : 1);
            return;
        }

        setStepError('');
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
        <PublicLayout auth={auth} title="Doctor Registration - Hello Doctors" pageClassName="doctor-register-page">
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
                        <Steps current={currentStep} items={stepItems} className="mb-8" />

                        {stepError && (
                            <Alert
                                message={stepError}
                                type="error"
                                showIcon
                                className="mb-6"
                            />
                        )}

                        <form onSubmit={handleSubmit}>
                            {currentStep === 0 && (
                                <>
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
                                </>
                            )}

                            {currentStep === 1 && (
                                <>
                                    <Title level={4}>Professional Information</Title>
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
                                                    {specialties.map((spec) => (
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
                                                    {cities.map((city) => (
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
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <Title level={4}>Review & Submit</Title>
                                    <Paragraph className="mb-5">
                                        Please confirm your details before submitting your doctor profile.
                                    </Paragraph>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Personal" className="mb-4">
                                                <p><strong>Name:</strong> {data.name || '-'}</p>
                                                <p><strong>Email:</strong> {data.email || '-'}</p>
                                                <p><strong>Phone:</strong> {data.phone || '-'}</p>
                                                <p><strong>Website:</strong> {data.website || '-'}</p>
                                            </Card>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Professional" className="mb-4">
                                                <p>
                                                    <strong>Specialty:</strong>{' '}
                                                    {specialties.find((spec) => spec.id === data.specialty_id)?.name || '-'}
                                                </p>
                                                <p><strong>Experience:</strong> {data.experience_years || '-'} years</p>
                                                <p><strong>Consultation Fee:</strong> {data.consultation_fee ? `Rs. ${data.consultation_fee}` : '-'}</p>
                                                <p><strong>Cities:</strong> {data.cities.length || 0} selected</p>
                                                <p><strong>Online Consultation:</strong> {data.is_available_online ? 'Yes' : 'No'}</p>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Card size="small" title="About" className="mb-2">
                                        <p><strong>Qualification:</strong> {data.qualification || '-'}</p>
                                        <p><strong>Bio:</strong> {data.bio || '-'}</p>
                                    </Card>
                                </>
                            )}

                            <Form.Item className="mb-0 mt-6">
                                <div className="d-flex justify-content-between gap-2 flex-wrap">
                                    <Button
                                        size="large"
                                        onClick={goToPreviousStep}
                                        disabled={currentStep === 0 || processing}
                                    >
                                        Back
                                    </Button>

                                    {currentStep < stepItems.length - 1 ? (
                                        <Button type="primary" size="large" onClick={goToNextStep}>
                                            Next Step
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            size="large"
                                            htmlType="submit"
                                            loading={processing}
                                        >
                                            Register as Doctor
                                        </Button>
                                    )}
                                </div>
                            </Form.Item>
                        </form>
                    </Card>

                    <div className="text-center mt-4">
                        <Paragraph>
                            Already have an account? <Link href="/login">Login here</Link>
                        </Paragraph>
                    </div>
                </div>
            </div>

        </PublicLayout>
    );
}
