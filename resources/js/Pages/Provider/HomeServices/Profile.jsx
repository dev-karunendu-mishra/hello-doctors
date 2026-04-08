import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
    message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const providerTypeOptions = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'attendant', label: 'Attendant' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'field_exec', label: 'Field Executive' },
];

export default function ProviderHomeServiceProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [cities, setCities] = useState([]);
    const [services, setServices] = useState([]);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, citiesRes, servicesRes] = await Promise.all([
                window.axios.get('/provider/data/home-service/profile'),
                window.axios.get('/provider/data/meta/cities'),
                window.axios.get('/provider/data/meta/home-services'),
            ]);

            const provider = profileRes.data?.data || null;
            const linkedServiceIds = (provider?.service_links || []).map((item) => (
                item.home_service_id || item.service?.id
            )).filter(Boolean);

            setProfile(provider);
            setCities(citiesRes.data?.data || []);
            setServices(servicesRes.data?.data || []);

            form.setFieldsValue({
                provider_type: provider?.provider_type || undefined,
                license_number: provider?.license_number || null,
                experience_years: provider?.experience_years ?? 0,
                city_id: provider?.city_id || undefined,
                service_radius_km: provider?.service_radius_km ?? null,
                is_active: provider?.is_active ?? true,
                service_ids: linkedServiceIds,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load provider profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            await window.axios.put('/provider/data/home-service/profile', values);
            message.success('Profile updated successfully.');
            await loadData();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Provider Profile" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>My Service Profile</Title>
                    <Space>
                        <Link href="/provider/home-services/availability">
                            <Button>Weekly Availability</Button>
                        </Link>
                        <Link href="/provider/home-services/bookings">
                            <Button type="primary">Assigned Bookings</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Keep your profile, location, and services updated so admins can assign bookings accurately."
                />

                {loading ? (
                    <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Card>
                                    <Statistic
                                        title="Today Bookings"
                                        value={profile?.analytics?.today_bookings_count || 0}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card>
                                    <Statistic
                                        title="Completed Visits"
                                        value={profile?.analytics?.completed_bookings_count || 0}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card>
                                    <Statistic
                                        title="Upcoming Visits"
                                        value={profile?.analytics?.upcoming_visits_count || 0}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Text strong>Name:</Text> <Text>{profile?.user?.name || '-'}</Text>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Text strong>Email:</Text> <Text>{profile?.user?.email || '-'}</Text>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Text strong>Phone:</Text> <Text>{profile?.user?.phone || '-'}</Text>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Text strong>Verified:</Text>{' '}
                                    <Tag color={profile?.is_verified ? 'green' : 'gold'}>
                                        {profile?.is_verified ? 'Verified' : 'Pending Verification'}
                                    </Tag>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Text strong>Status:</Text>{' '}
                                    <Tag color={profile?.is_active ? 'blue' : 'default'}>
                                        {profile?.is_active ? 'Active' : 'Inactive'}
                                    </Tag>
                                </Col>
                            </Row>
                        </Card>

                        {!profile?.is_verified || !profile?.is_active ? (
                            <Alert
                                type={profile?.is_verified ? 'warning' : 'info'}
                                showIcon
                                message="Your provider account is still under admin control."
                                description="You can complete your profile and availability now, but only verified and active providers receive home-service assignments."
                            />
                        ) : null}

                        <Card title="Profile & Service Mapping">
                            <Form form={form} layout="vertical">
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            name="provider_type"
                                            label="Provider Type"
                                            rules={[{ required: true, message: 'Please select provider type.' }]}
                                        >
                                            <Select options={providerTypeOptions} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="license_number" label="License Number">
                                            <Input maxLength={100} placeholder="Optional" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="experience_years" label="Experience (Years)">
                                            <InputNumber min={0} max={80} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="city_id"
                                            label="Primary City"
                                            rules={[{ required: true, message: 'Please select city.' }]}
                                        >
                                            <Select
                                                showSearch
                                                optionFilterProp="label"
                                                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="service_radius_km" label="Service Radius (KM)">
                                            <InputNumber min={0} max={500} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item name="service_ids" label="Mapped Services">
                                            <Select
                                                mode="multiple"
                                                allowClear
                                                optionFilterProp="label"
                                                placeholder="Select one or more services"
                                                options={services.map((service) => ({ value: service.id, label: service.name }))}
                                            />
                                        </Form.Item>
                                    </Col>

                                </Row>

                                <Button type="primary" loading={saving} onClick={onSave}>
                                    Save Profile
                                </Button>
                            </Form>
                        </Card>
                    </Space>
                )}
            </Space>
        </AdminLayout>
    );
}
