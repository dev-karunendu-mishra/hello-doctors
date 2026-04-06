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
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Title } = Typography;

export default function HomeServiceAdminIndex() {
    const [form] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categorySaving, setCategorySaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [togglingServiceId, setTogglingServiceId] = useState(null);

    const loadServices = async (page = 1) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/admin/home-services/services', { params: { page } });
            const paginated = response.data?.data || {};
            setServices(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load services.');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await window.axios.get('/admin/home-service-categories');
            setCategories(response.data?.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load categories.');
        }
    };

    useEffect(() => {
        loadServices();
        loadCategories();
    }, []);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({
            duration_minutes: 30,
            base_price: 0,
            price_type: 'fixed',
            buffer_minutes: 15,
            requires_certification: false,
            is_active: true,
            is_featured_on_home: false,
        });
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        form.setFieldsValue({
            category_id: record.category_id || record.category?.id,
            code: record.code,
            name: record.name,
            description: record.description,
            duration_minutes: record.duration_minutes,
            base_price: Number(record.base_price || 0),
            price_type: record.price_type,
            buffer_minutes: record.buffer_minutes,
            requires_certification: !!record.requires_certification,
            is_active: !!record.is_active,
            is_featured_on_home: !!record.is_featured_on_home,
        });
        setModalOpen(true);
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            if (editing) {
                await window.axios.put(`/admin/home-services/services/${editing.id}`, values);
                message.success('Service updated successfully.');
            } else {
                await window.axios.post('/admin/home-services/services', values);
                message.success('Service created successfully.');
            }

            setModalOpen(false);
            await loadServices(pagination.current);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save service.');
        } finally {
            setSaving(false);
        }
    };

    const openCategoryCreate = () => {
        setEditingCategory(null);
        categoryForm.resetFields();
        categoryForm.setFieldsValue({ is_active: true });
        setCategoryModalOpen(true);
    };

    const openCategoryEdit = (record) => {
        setEditingCategory(record);
        categoryForm.setFieldsValue({
            name: record.name,
            description: record.description,
            is_active: !!record.is_active,
        });
        setCategoryModalOpen(true);
    };

    const onSubmitCategory = async () => {
        try {
            const values = await categoryForm.validateFields();
            setCategorySaving(true);

            if (editingCategory) {
                await window.axios.put(`/admin/home-service-categories/${editingCategory.id}`, values);
                message.success('Category updated successfully.');
            } else {
                await window.axios.post('/admin/home-service-categories', values);
                message.success('Category created successfully.');
            }

            setCategoryModalOpen(false);
            await loadCategories();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save category.');
        } finally {
            setCategorySaving(false);
        }
    };

    const handleFeaturedToggle = async (record, checked) => {
        setTogglingServiceId(record.id);

        try {
            await window.axios.put(`/admin/home-services/services/${record.id}`, {
                category_id: record.category_id || record.category?.id,
                code: record.code,
                name: record.name,
                description: record.description,
                duration_minutes: record.duration_minutes,
                base_price: Number(record.base_price || 0),
                price_type: record.price_type,
                buffer_minutes: record.buffer_minutes,
                requires_certification: !!record.requires_certification,
                is_active: !!record.is_active,
                is_featured_on_home: checked,
            });

            setServices((current) => current.map((service) => (
                service.id === record.id
                    ? { ...service, is_featured_on_home: checked }
                    : service
            )));

            message.success(`"${record.name}" ${checked ? 'featured on' : 'removed from'} home page.`);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to update service home-page setting.');
        } finally {
            setTogglingServiceId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Home Services - Service Master" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Home Service Master</Title>
                    <Space>
                        <Link href="/admin/home-services/providers">
                            <Button>Providers</Button>
                        </Link>
                        <Link href="/admin/home-services/bookings">
                            <Button>Bookings</Button>
                        </Link>
                        <Button onClick={openCategoryCreate}>Manage Categories</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Service</Button>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Manage service catalog and pricing for home services."
                />

                <Card>
                    <Table
                        rowKey="id"
                        style={{ marginBottom: 16 }}
                        pagination={false}
                        dataSource={categories}
                        columns={[
                            { title: 'Category', dataIndex: 'name', key: 'name' },
                            {
                                title: 'Services',
                                key: 'services_count',
                                render: (_, record) => record.services_count ?? 0,
                            },
                            {
                                title: 'Status',
                                key: 'is_active',
                                render: (_, record) => record.is_active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                    <Button icon={<EditOutlined />} size="small" onClick={() => openCategoryEdit(record)}>
                                        Edit
                                    </Button>
                                ),
                            },
                        ]}
                    />

                    <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={services}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            onChange: (page) => loadServices(page),
                            showSizeChanger: false,
                        }}
                        columns={[
                            { title: 'Code', dataIndex: 'code', key: 'code' },
                            { title: 'Name', dataIndex: 'name', key: 'name' },
                            {
                                title: 'Category',
                                key: 'category',
                                render: (_, record) => record.category?.name || '-',
                            },
                            {
                                title: 'Duration',
                                key: 'duration_minutes',
                                render: (_, record) => `${record.duration_minutes} min`,
                            },
                            {
                                title: 'Base Price',
                                key: 'base_price',
                                render: (_, record) => `INR ${record.base_price}`,
                            },
                            {
                                title: 'Price Type',
                                key: 'price_type',
                                render: (_, record) => <Tag>{record.price_type}</Tag>,
                            },
                            {
                                title: 'Status',
                                key: 'status',
                                render: (_, record) => record.is_active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
                            },
                            {
                                title: 'Home Page',
                                key: 'is_featured_on_home',
                                render: (_, record) => (
                                    <Switch
                                        size="small"
                                        checked={!!record.is_featured_on_home}
                                        loading={togglingServiceId === record.id}
                                        checkedChildren="Yes"
                                        unCheckedChildren="No"
                                        onChange={(checked) => handleFeaturedToggle(record, checked)}
                                    />
                                ),
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                    <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
                                        Edit
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            <Modal
                open={modalOpen}
                title={editing ? 'Edit Home Service' : 'Add Home Service'}
                onCancel={() => setModalOpen(false)}
                onOk={onSubmit}
                confirmLoading={saving}
                width={760}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Category"
                                name="category_id"
                                rules={[{ required: true, message: 'Please select category.' }]}
                            >
                                <Select
                                    options={categories.map((item) => ({ value: item.id, label: item.name }))}
                                    placeholder="Select category"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Code is required.' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required.' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col xs={24} md={6}>
                            <Form.Item label="Duration (min)" name="duration_minutes" rules={[{ required: true, message: 'Required' }]}> 
                                <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Base Price" name="base_price" rules={[{ required: true, message: 'Required' }]}> 
                                <InputNumber min={0} max={999999.99} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Price Type" name="price_type" rules={[{ required: true, message: 'Required' }]}> 
                                <Select
                                    options={[
                                        { value: 'fixed', label: 'Fixed' },
                                        { value: 'hourly', label: 'Hourly' },
                                        { value: 'package', label: 'Package' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Buffer (min)" name="buffer_minutes" rules={[{ required: true, message: 'Required' }]}> 
                                <InputNumber min={0} max={180} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Requires Certification" name="requires_certification" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Active" name="is_active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Featured on Home Page" name="is_featured_on_home" valuePropName="checked">
                                <Switch checkedChildren="Featured" unCheckedChildren="Standard" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                open={categoryModalOpen}
                title={editingCategory ? 'Edit Category' : 'Add Category'}
                onCancel={() => setCategoryModalOpen(false)}
                onOk={onSubmitCategory}
                confirmLoading={categorySaving}
                destroyOnClose
            >
                <Form form={categoryForm} layout="vertical">
                    <Form.Item label="Category Name" name="name" rules={[{ required: true, message: 'Name is required.' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="Active" name="is_active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
