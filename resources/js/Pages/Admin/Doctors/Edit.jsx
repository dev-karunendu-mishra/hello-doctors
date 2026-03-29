import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, Form, Input, Button, Select, Upload, Row, Col, Checkbox, Typography, Alert, Divider, Space, Tabs } from 'antd';
import { UploadOutlined, UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;

export default function DoctorEdit({ doctor, cities, specialties, flash }) {
    const initialClinics = (doctor.hospital_clinics || []).map((clinic) => ({
        id: clinic.id,
        hospital_clinic_name: clinic.hospital_clinic_name || '',
        address: clinic.address || '',
        latitude: clinic.latitude || '',
        longitude: clinic.longitude || '',
        landmarks: clinic.landmarks || '',
        city_id: clinic.city_id || null,
        phone: clinic.phone || '',
        email: clinic.email || '',
        consultation_fee: clinic.consultation_fee || '',
        is_active: clinic.is_active ?? true,
    }));

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
        clinics: initialClinics,
        profile_image: null,
        password: '',
        password_confirmation: '',
        meta_title: doctor.meta_title || '',
        meta_description: doctor.meta_description || '',
        meta_keywords: doctor.meta_keywords || '',
        _method: 'PUT',
    });

    const [fileList, setFileList] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');

    const addClinic = () => {
        setData('clinics', [
            ...(data.clinics || []),
            {
                id: null,
                hospital_clinic_name: '',
                address: '',
                latitude: '',
                longitude: '',
                landmarks: '',
                city_id: null,
                phone: '',
                email: '',
                consultation_fee: '',
                is_active: true,
            },
        ]);
    };

    const removeClinic = (index) => {
        setData('clinics', (data.clinics || []).filter((_, i) => i !== index));
    };

    const updateClinicField = (index, field, value) => {
        setData('clinics', (data.clinics || []).map((clinic, i) => {
            if (i !== index) return clinic;
            return {
                ...clinic,
                [field]: value,
            };
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/doctors/${doctor.slug || doctor.id}`);
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
                            <Tabs
                                className="mb-6"
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                items={[
                                    { key: 'profile', label: 'Profile' },
                                    { key: 'clinics', label: 'Clinics / Hospitals' },
                                    { key: 'media', label: 'Media' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'seo', label: 'SEO' },
                                ]}
                            />

                            {activeTab === 'profile' && (
                                <>
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
                                </>
                            )}

                            {activeTab === 'clinics' && (
                                <>
                            <Divider />
                            <div className="flex items-center justify-between mb-3">
                                <Title level={4} className="!mb-0">Clinic / Hospital Addresses</Title>
                                <Button type="dashed" icon={<PlusOutlined />} onClick={addClinic}>
                                    Add Clinic
                                </Button>
                            </div>
                            <Alert
                                message="Add all clinic/hospital locations where this doctor is available."
                                type="info"
                                showIcon
                                className="mb-4"
                            />

                            {(data.clinics || []).length === 0 && (
                                <Alert
                                    message="No clinic addresses added yet"
                                    description="Click Add Clinic to create the first clinic/hospital address."
                                    type="warning"
                                    showIcon
                                    className="mb-4"
                                />
                            )}

                            {(data.clinics || []).map((clinic, index) => (
                                <Card
                                    key={clinic.id || `new-${index}`}
                                    size="small"
                                    className="mb-4"
                                    title={`Clinic ${index + 1}`}
                                    extra={
                                        <Button danger icon={<DeleteOutlined />} onClick={() => removeClinic(index)}>
                                            Remove
                                        </Button>
                                    }
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Clinic / Hospital Name"
                                                validateStatus={errors[`clinics.${index}.hospital_clinic_name`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.hospital_clinic_name`]}
                                                required
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="Apollo Clinic"
                                                    value={clinic.hospital_clinic_name}
                                                    onChange={(e) => updateClinicField(index, 'hospital_clinic_name', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="City"
                                                validateStatus={errors[`clinics.${index}.city_id`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.city_id`]}
                                                required
                                            >
                                                <Select
                                                    size="large"
                                                    placeholder="Select city"
                                                    value={clinic.city_id}
                                                    onChange={(value) => updateClinicField(index, 'city_id', value)}
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
                                        label="Address"
                                        validateStatus={errors[`clinics.${index}.address`] ? 'error' : ''}
                                        help={errors[`clinics.${index}.address`]}
                                        required
                                    >
                                        <TextArea
                                            rows={2}
                                            placeholder="Full clinic/hospital address"
                                            value={clinic.address}
                                            onChange={(e) => updateClinicField(index, 'address', e.target.value)}
                                        />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Latitude"
                                                validateStatus={errors[`clinics.${index}.latitude`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.latitude`] || 'Example: 25.435801'}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="25.435801"
                                                    value={clinic.latitude}
                                                    onChange={(e) => updateClinicField(index, 'latitude', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Longitude"
                                                validateStatus={errors[`clinics.${index}.longitude`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.longitude`] || 'Example: 81.846311'}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="81.846311"
                                                    value={clinic.longitude}
                                                    onChange={(e) => updateClinicField(index, 'longitude', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Landmarks"
                                                validateStatus={errors[`clinics.${index}.landmarks`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.landmarks`]}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="Near metro station"
                                                    value={clinic.landmarks}
                                                    onChange={(e) => updateClinicField(index, 'landmarks', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Consultation Fee (Clinic specific)"
                                                validateStatus={errors[`clinics.${index}.consultation_fee`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.consultation_fee`]}
                                            >
                                                <Input
                                                    size="large"
                                                    type="number"
                                                    placeholder="500"
                                                    value={clinic.consultation_fee}
                                                    onChange={(e) => updateClinicField(index, 'consultation_fee', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Clinic Phone"
                                                validateStatus={errors[`clinics.${index}.phone`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.phone`]}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="Clinic contact number"
                                                    value={clinic.phone}
                                                    onChange={(e) => updateClinicField(index, 'phone', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Clinic Email"
                                                validateStatus={errors[`clinics.${index}.email`] ? 'error' : ''}
                                                help={errors[`clinics.${index}.email`]}
                                            >
                                                <Input
                                                    size="large"
                                                    type="email"
                                                    placeholder="clinic@example.com"
                                                    value={clinic.email}
                                                    onChange={(e) => updateClinicField(index, 'email', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Space>
                                        <Checkbox
                                            checked={clinic.is_active}
                                            onChange={(e) => updateClinicField(index, 'is_active', e.target.checked)}
                                        >
                                            Active clinic
                                        </Checkbox>
                                    </Space>
                                </Card>
                            ))}
                                </>
                            )}

                            {activeTab === 'media' && (
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
                            )}

                            {activeTab === 'status' && (
                                <>
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
                                </>
                            )}

                            {activeTab === 'seo' && (
                                <>
                            <Title level={4} className="mt-6">SEO Settings</Title>
                            <Alert 
                                message="These fields help optimize this doctor's profile page for search engines. If left empty, global site SEO settings will be used." 
                                type="info" 
                                showIcon 
                                className="mb-4"
                            />
                            
                            <Form.Item 
                                label="Meta Title (60 characters max)" 
                                validateStatus={errors.meta_title ? 'error' : ''}
                                help={errors.meta_title}
                            >
                                <Input
                                    size="large"
                                    placeholder={`${data.name} - ${specialties.find(s => s.id === data.specialization_id)?.name || 'Specialist'} | Site Name`}
                                    value={data.meta_title}
                                    onChange={(e) => setData('meta_title', e.target.value)}
                                    maxLength={60}
                                    showCount
                                />
                            </Form.Item>

                            <Form.Item 
                                label="Meta Description (160 characters max)" 
                                validateStatus={errors.meta_description ? 'error' : ''}
                                help={errors.meta_description}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Brief SEO-friendly description of the doctor's expertise and services"
                                    value={data.meta_description}
                                    onChange={(e) => setData('meta_description', e.target.value)}
                                    maxLength={160}
                                    showCount
                                />
                            </Form.Item>

                            <Form.Item 
                                label="Meta Keywords (comma-separated)" 
                                validateStatus={errors.meta_keywords ? 'error' : ''}
                                help={errors.meta_keywords}
                            >
                                <Input
                                    size="large"
                                    placeholder="doctor name, specialty, city, expertise"
                                    value={data.meta_keywords}
                                    onChange={(e) => setData('meta_keywords', e.target.value)}
                                />
                            </Form.Item>
                                </>
                            )}

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
