import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title } = Typography;

const PROVIDER_TYPES = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'attendant', label: 'Attendant' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'field_exec', label: 'Field Executive' },
];

export default function HomeServiceProvidersAdmin() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [providers, setProviders] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [cityId, setCityId] = useState(null);
    const [verified, setVerified] = useState(null);
    const [cities, setCities] = useState([]);
    const [allServices, setAllServices] = useState([]);

    const [addModal, setAddModal] = useState(false);
    const [addSaving, setAddSaving] = useState(false);
    const [addForm] = Form.useForm();

    const loadCities = async () => {
        try {
            const response = await window.axios.get('/admin/meta/cities');
            setCities(response.data?.data || response.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load cities.');
        }
    };

    const loadServices = async () => {
        try {
            const response = await window.axios.get('/admin/home-services/services');
            const data = response.data?.data;
            setAllServices(data?.data || data || []);
        } catch {
            // non-critical
        }
    };

    const loadProviders = async (page = 1, filters = {}) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/admin/home-services/providers-data', {
                params: { page, ...filters },
            });
            const paginated = response.data?.data || {};
            setProviders(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load providers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCities();
        loadServices();
        loadProviders();
    }, []);

    const applyFilters = async (nextCity = cityId, nextVerified = verified) => {
        const params = {};
        if (nextCity) params.city_id = nextCity;
        if (nextVerified !== null && nextVerified !== undefined) params.verified = nextVerified;
        await loadProviders(1, params);
    };

    const updateVerification = async (record, nextVerified) => {
        try {
            setUpdating(true);
            await window.axios.put(`/admin/home-services/providers-data/${record.id}/verify`, {
                is_verified: nextVerified,
                is_active: record.is_active,
            });
            message.success('Provider verification updated.');
            await applyFilters();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to update verification.');
        } finally {
            setUpdating(false);
        }
    };

    const updateActive = async (record, nextActive) => {
        try {
            setUpdating(true);
            await window.axios.put(`/admin/home-services/providers-data/${record.id}/verify`, {
                is_verified: record.is_verified,
                is_active: nextActive,
            });
            message.success('Provider active status updated.');
            await applyFilters();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to update active status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddProvider = async () => {
        try {
            const values = await addForm.validateFields();
            setAddSaving(true);
            await window.axios.post('/admin/home-services/providers-data', values);
            message.success('Provider created successfully.');
            setAddModal(false);
            addForm.resetFields();
            await loadProviders();
        } catch (error) {
            if (error?.response?.data?.errors) {
                const fields = Object.entries(error.response.data.errors).map(([name, errors]) => ({ name, errors }));
                addForm.setFields(fields);
            } else if (error?.response?.data?.message) {
                message.error(error.response.data.message);
            }
        } finally {
            setAddSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Home Service Providers" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Home Service Providers</Title>
                    <Space>
                        <Link href="/admin/home-services">
                            <Button>Service Master</Button>
                        </Link>
                        <Link href="/admin/home-services/bookings">
                            <Button>Bookings</Button>
                        </Link>
                        <Button type="primary" onClick={() => setAddModal(true)}>
                            + Add Provider
                        </Button>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Approve providers and control active/inactive operational access."
                />

                <Card>
                    <Space wrap style={{ marginBottom: 16 }}>
                        <Select
                            allowClear
                            style={{ width: 220 }}
                            placeholder="Filter by city"
                            value={cityId}
                            options={cities.map((city) => ({ value: city.id, label: city.name }))}
                            onChange={async (value) => {
                                setCityId(value || null);
                                await applyFilters(value || null, verified);
                            }}
                        />
                        <Select
                            allowClear
                            style={{ width: 220 }}
                            placeholder="Filter by verification"
                            value={verified}
                            options={[
                                { value: true, label: 'Verified' },
                                { value: false, label: 'Unverified' },
                            ]}
                            onChange={async (value) => {
                                setVerified(value ?? null);
                                await applyFilters(cityId, value ?? null);
                            }}
                        />
                        <Button
                            onClick={async () => {
                                setCityId(null);
                                setVerified(null);
                                await loadProviders();
                            }}
                        >
                            Reset
                        </Button>
                    </Space>

                    <Table
                        rowKey="id"
                        loading={loading || updating}
                        dataSource={providers}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            onChange: (page) => loadProviders(page, {
                                ...(cityId ? { city_id: cityId } : {}),
                                ...(verified !== null && verified !== undefined ? { verified } : {}),
                            }),
                            showSizeChanger: false,
                        }}
                        columns={[
                            {
                                title: 'Provider',
                                key: 'provider',
                                render: (_, record) => (
                                    <Space direction="vertical" size={0}>
                                        <span>{record.user?.name || '-'}</span>
                                        <span style={{ color: '#888' }}>{record.user?.phone || '-'}</span>
                                    </Space>
                                ),
                            },
                            {
                                title: 'Type',
                                dataIndex: 'provider_type',
                                key: 'provider_type',
                            },
                            {
                                title: 'City',
                                key: 'city',
                                render: (_, record) => record.city?.name || '-',
                            },
                            {
                                title: 'Experience',
                                key: 'experience_years',
                                render: (_, record) => `${record.experience_years || 0} years`,
                            },
                            {
                                title: 'Services',
                                key: 'services',
                                render: (_, record) => (
                                    <Space wrap>
                                        {(record.service_links || []).map((item) => (
                                            <Tag key={item.id}>{item.service?.name || 'Service'}</Tag>
                                        ))}
                                    </Space>
                                ),
                            },
                            {
                                title: 'Verified',
                                key: 'is_verified',
                                render: (_, record) => (
                                    <Switch
                                        checked={!!record.is_verified}
                                        checkedChildren="Yes"
                                        unCheckedChildren="No"
                                        onChange={(checked) => updateVerification(record, checked)}
                                    />
                                ),
                            },
                            {
                                title: 'Active',
                                key: 'is_active',
                                render: (_, record) => (
                                    <Switch
                                        checked={!!record.is_active}
                                        checkedChildren="On"
                                        unCheckedChildren="Off"
                                        onChange={(checked) => updateActive(record, checked)}
                                    />
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            <Modal
                title="Add Home Service Provider"
                open={addModal}
                onOk={handleAddProvider}
                onCancel={() => { setAddModal(false); addForm.resetFields(); }}
                okText="Create Provider"
                confirmLoading={addSaving}
                width={640}
                destroyOnClose
            >
                <Form form={addForm} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item label="Full Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
                        <Input placeholder="Provider full name" />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Email is required' },
                            { type: 'email', message: 'Enter a valid email' },
                        ]}
                    >
                        <Input placeholder="provider@example.com" />
                    </Form.Item>
                    <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Phone is required' }]}>
                        <Input placeholder="10-digit mobile number" />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Password is required' },
                            { min: 8, message: 'Minimum 8 characters' },
                        ]}
                    >
                        <Input.Password placeholder="Minimum 8 characters" />
                    </Form.Item>
                    <Form.Item label="Provider Type" name="provider_type" rules={[{ required: true, message: 'Provider type is required' }]}>
                        <Select placeholder="Select type" options={PROVIDER_TYPES} />
                    </Form.Item>
                    <Form.Item label="City" name="city_id" rules={[{ required: true, message: 'City is required' }]}>
                        <Select
                            showSearch
                            placeholder="Select city"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={cities.map((c) => ({ value: c.id, label: c.name }))}
                        />
                    </Form.Item>
                    <Form.Item label="License Number" name="license_number">
                        <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item label="Experience (years)" name="experience_years">
                        <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="0" />
                    </Form.Item>
                    <Form.Item label="Service Radius (km)" name="service_radius_km">
                        <InputNumber min={0} max={500} step={0.5} style={{ width: '100%' }} placeholder="Optional" />
                    </Form.Item>
                    <Form.Item label="Services Offered" name="service_ids">
                        <Select
                            mode="multiple"
                            placeholder="Select services this provider can offer"
                            options={allServices.map((s) => ({ value: s.id, label: s.name }))}
                            allowClear
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}