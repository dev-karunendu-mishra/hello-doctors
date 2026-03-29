import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    message,
} from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export default function HomeServiceAddresses() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [cities, setCities] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [addressRes, citiesRes] = await Promise.all([
                window.axios.get('/patient/data/addresses'),
                window.axios.get('/patient/data/meta/cities'),
            ]);

            setAddresses(addressRes.data?.data || []);
            setCities(citiesRes.data?.data || citiesRes.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load address data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateModal = () => {
        setEditingAddress(null);
        form.resetFields();
        form.setFieldsValue({ label: 'Home', is_default: addresses.length === 0 });
        setModalOpen(true);
    };

    const openEditModal = (address) => {
        setEditingAddress(address);
        form.setFieldsValue({
            ...address,
            is_default: !!address.is_default,
        });
        setModalOpen(true);
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            if (editingAddress) {
                await window.axios.put(`/patient/data/addresses/${editingAddress.id}`, values);
                message.success('Address updated successfully.');
            } else {
                await window.axios.post('/patient/data/addresses', values);
                message.success('Address saved successfully.');
            }

            setModalOpen(false);
            await loadData();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save address.');
        } finally {
            setSaving(false);
        }
    };

    const deleteAddress = async (addressId) => {
        try {
            await window.axios.delete(`/patient/data/addresses/${addressId}`);
            message.success('Address deleted successfully.');
            await loadData();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to delete address.');
        }
    };

    return (
        <AdminLayout>
            <Head title="Home Service Addresses" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Home Service Addresses</Title>
                    <Space>
                        <Link href="/patient/home-services/book">
                            <Button type="default">Back to Booking</Button>
                        </Link>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                            Add Address
                        </Button>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Maintain accurate address details for faster provider dispatch."
                />

                <Row gutter={[16, 16]}>
                    {addresses.map((address) => (
                        <Col xs={24} md={12} key={address.id}>
                            <Card
                                loading={loading}
                                title={
                                    <Space>
                                        <span>{address.label || 'Home'}</span>
                                        {address.is_default ? <Text type="success">(Default)</Text> : null}
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(address)}>
                                            Edit
                                        </Button>
                                        <Popconfirm
                                            title="Delete this address?"
                                            description="This action cannot be undone."
                                            onConfirm={() => deleteAddress(address.id)}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />}>
                                                Delete
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                }
                            >
                                <Space direction="vertical" size={4}>
                                    <Text strong>{address.contact_name} ({address.contact_phone})</Text>
                                    <Text>{address.line1}</Text>
                                    {address.line2 ? <Text>{address.line2}</Text> : null}
                                    {address.landmark ? <Text type="secondary">Landmark: {address.landmark}</Text> : null}
                                    <Text>{address.city?.name} - {address.pincode}</Text>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {!loading && addresses.length === 0 ? (
                    <Card>
                        <Text type="secondary">No addresses found. Add your first address to start booking.</Text>
                    </Card>
                ) : null}
            </Space>

            <Modal
                title={editingAddress ? 'Edit Address' : 'Add New Address'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={onSubmit}
                confirmLoading={saving}
                destroyOnClose
                width={760}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}> 
                                <Select
                                    options={[
                                        { value: 'Home', label: 'Home' },
                                        { value: 'Office', label: 'Office' },
                                        { value: 'Other', label: 'Other' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_name" label="Contact Name" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_phone" label="Contact Phone" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="line1" label="Address Line 1" rules={[{ required: true, message: 'Required' }]}> 
                        <Input />
                    </Form.Item>

                    <Form.Item name="line2" label="Address Line 2">
                        <Input />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item name="landmark" label="Landmark">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Required' }]}> 
                                <Select options={cities.map((city) => ({ value: city.id, label: city.name }))} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col xs={24} md={12}>
                            <Form.Item name="latitude" label="Latitude">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="longitude" label="Longitude">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="is_default" label="Default Address" valuePropName="checked">
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
