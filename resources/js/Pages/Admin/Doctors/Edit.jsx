import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, Form, Input, Button, Select, Upload, Row, Col, Checkbox, Typography, Alert } from 'antd';
import { UploadOutlined, UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;

export default function DoctorEdit({ doctor, cities, specialties, flash }) {
    const { data, setData, post, processing, errors } = useForm({
        name: doctor.name || '',
        email: doctor.user?.email || '',
        phone: doctor.phone || '',
        specialization_id: doctor.specialization_id || null,
        qualification: doctor.qualification || '',
        experience_years: doctor.experience_years || '',
        bio: doctor.bio || '',
        consultation_fee: doctor.consultation_fee || '',
        website: doctor.website || '',
        is_available_online: doctor.is_available_online || false,
        is_verified: doctor.is_verified || false,
        is_active: doctor.is_active || false,
        cities: doctor.cities?.map(c => c.id) || [],
        profile_image: null,
        password: '',
        password_confirmation: '',
        _method: 'PUT',
    });

    const [fileList, setFileList] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/doctors/${doctor.id}`);
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
        <AdminLayout>
            <Head title={`Edit ${doctor.name}`} />

            <div className="mb-4">
                <Link href="/admin/doctors">
                    <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                </Link>
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

                    {errors && Object.keys(errors).length > 0 && (
                        <Alert 
                            message="Please fix the errors below" 
                            type="error" 
                            showIcon 
                            className="mb-6"
                        />
                    )}

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <Title level={4}>Account Information</Title>
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
                                        label="New Password (leave blank to keep current)" 
                                        validateStatus={errors.password ? 'error' : ''}
                                        help={errors.password}
                                    >
                                        <Input.Password
                                            size="large"
                                            placeholder="New password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item 
                                        label="Confirm New Password" 
                                        validateStatus={errors.password_confirmation ? 'error' : ''}
                                        help={errors.password_confirmation}
                                    >
                                        <Input.Password
                                            size="large"
                                            placeholder="Confirm new password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Title level={4} className="mt-6">Contact Information</Title>
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
                                        validateStatus={errors.specialization_id ? 'error' : ''}
                                        help={errors.specialization_id}
                                        required
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Select specialty"
                                            value={data.specialization_id}
                                            onChange={(value) => setData('specialization_id', value)}
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
                                    placeholder="Brief description about practice and expertise..."
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
                                            placeholder="Select cities"
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
                                {doctor.profile_image_url && (
                                    <div className="mb-2">
                                        <img src={doctor.profile_image_url} alt="Current" className="w-32 h-32 object-cover rounded" />
                                    </div>
                                )}
                                <Upload {...uploadProps}>
                                    <Button icon={<UploadOutlined />}>
                                        {doctor.profile_image_url ? 'Change Image' : 'Select Image'}
                                    </Button>
                                </Upload>
                            </Form.Item>

                            <Title level={4} className="mt-6">Status Settings</Title>
                            <Form.Item>
                                <Checkbox
                                    checked={data.is_available_online}
                                    onChange={(e) => setData('is_available_online', e.target.checked)}
                                >
                                    Available for online consultations
                                </Checkbox>
                            </Form.Item>

                            <Form.Item>
                                <Checkbox
                                    checked={data.is_verified}
                                    onChange={(e) => setData('is_verified', e.target.checked)}
                                >
                                    Verified (Admin approval)
                                </Checkbox>
                            </Form.Item>

                            <Form.Item>
                                <Checkbox
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                >
                                    Active
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
                                    Update Doctor
                                </Button>
                            </Form.Item>
                        </form>
                    </Card>
        </AdminLayout>
    );
}
