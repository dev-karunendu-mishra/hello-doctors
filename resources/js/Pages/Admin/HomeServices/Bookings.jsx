import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title } = Typography;

const statusColors = {
    pending: 'gold',
    assigned: 'processing',
    confirmed: 'blue',
    in_progress: 'cyan',
    completed: 'green',
    cancelled: 'red',
    no_show: 'default',
};

const paymentStatusColors = {
    pending: 'orange',
    paid: 'green',
    failed: 'red',
    refunded: 'purple',
};

const paymentMethodLabel = {
    online: 'Online / UPI',
    cod: 'Cash on Visit',
};

export default function HomeServiceBookingsAdmin() {
    const [assignForm] = Form.useForm();
    const [statusForm] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [providers, setProviders] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 30, total: 0 });
    const [status, setStatus] = useState(null);

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const loadProviders = async () => {
        try {
            const response = await window.axios.get('/admin/home-services/providers-data', { params: { page: 1 } });
            setProviders(response.data?.data?.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load providers.');
        }
    };

    const loadBookings = async (page = 1, nextStatus = status) => {
        setLoading(true);
        try {
            const params = { page };
            if (nextStatus) params.status = nextStatus;

            const response = await window.axios.get('/admin/home-services/bookings-data', { params });
            const paginated = response.data?.data || {};
            setBookings(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 30,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProviders();
        loadBookings();
    }, []);

    const openAssignModal = (booking) => {
        setSelectedBooking(booking);
        assignForm.resetFields();
        assignForm.setFieldValue('provider_id', booking.provider_id || null);
        setAssignModalOpen(true);
    };

    const openStatusModal = (booking) => {
        setSelectedBooking(booking);
        statusForm.resetFields();
        statusForm.setFieldValue('status', booking.status);
        setStatusModalOpen(true);
    };

    const submitAssign = async () => {
        if (!selectedBooking) return;

        try {
            const values = await assignForm.validateFields();
            setSubmitting(true);

            await window.axios.post(`/admin/home-services/bookings-data/${selectedBooking.id}/assign-provider`, values);
            message.success('Provider assigned successfully.');
            setAssignModalOpen(false);
            await loadBookings(pagination.current);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to assign provider.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitStatusUpdate = async () => {
        if (!selectedBooking) return;

        try {
            const values = await statusForm.validateFields();
            setSubmitting(true);

            await window.axios.post(`/admin/home-services/bookings-data/${selectedBooking.id}/status`, values);
            message.success('Booking status updated successfully.');
            setStatusModalOpen(false);
            await loadBookings(pagination.current);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to update status.');
        } finally {
            setSubmitting(false);
        }
    };

    const serviceCompatibleProviders = (booking) => {
        return providers.filter((provider) =>
            (provider.service_links || []).some((link) => Number(link.home_service_id) === Number(booking.home_service_id))
        );
    };

    return (
        <AdminLayout>
            <Head title="Home Service Bookings" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Home Service Bookings</Title>
                    <Space>
                        <Link href="/admin/home-services">
                            <Button>Service Master</Button>
                        </Link>
                        <Link href="/admin/home-services/providers">
                            <Button>Providers</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Assign providers and track booking lifecycle from a single board."
                />

                <Card>
                    <Space style={{ marginBottom: 16 }}>
                        <Select
                            allowClear
                            style={{ width: 220 }}
                            placeholder="Filter by status"
                            value={status}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'assigned', label: 'Assigned' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'no_show', label: 'No Show' },
                            ]}
                            onChange={async (value) => {
                                setStatus(value || null);
                                await loadBookings(1, value || null);
                            }}
                        />
                    </Space>

                    <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={bookings}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            onChange: (page) => loadBookings(page),
                            showSizeChanger: false,
                        }}
                        columns={[
                            { title: 'Booking No.', dataIndex: 'booking_number', key: 'booking_number' },
                            {
                                title: 'User',
                                key: 'user',
                                render: (_, record) => (
                                    <Space direction="vertical" size={0}>
                                        <span>{record.user?.name || '-'}</span>
                                        <span style={{ color: '#888' }}>{record.user?.phone || '-'}</span>
                                    </Space>
                                ),
                            },
                            {
                                title: 'Service',
                                key: 'service',
                                render: (_, record) => record.service?.name || '-',
                            },
                            {
                                title: 'Provider',
                                key: 'provider',
                                render: (_, record) => record.provider?.user?.name || 'Not assigned',
                            },
                            {
                                title: 'Visit',
                                key: 'visit',
                                render: (_, record) => `${record.service_date} ${String(record.service_time || '').slice(0, 5)}`,
                            },
                            {
                                title: 'Amount',
                                key: 'amount',
                                render: (_, record) => `INR ${record.total_amount || 0}`,
                            },
                            {
                                title: 'Payment',
                                key: 'payment_status',
                                render: (_, record) => <Tag color={paymentStatusColors[record.payment_status] || 'default'}>{record.payment_status || 'pending'}</Tag>,
                            },
                            {
                                title: 'Method',
                                key: 'payment_method',
                                render: (_, record) => paymentMethodLabel[record.payment_method || 'cod'] || record.payment_method || 'cod',
                            },
                            {
                                title: 'Status',
                                key: 'status',
                                render: (_, record) => <Tag color={statusColors[record.status] || 'default'}>{record.status}</Tag>,
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                    <Space>
                                        <Button size="small" onClick={() => openAssignModal(record)}>
                                            Assign
                                        </Button>
                                        <Button size="small" onClick={() => openStatusModal(record)}>
                                            Status
                                        </Button>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            <Modal
                title="Assign Provider"
                open={assignModalOpen}
                onCancel={() => setAssignModalOpen(false)}
                onOk={submitAssign}
                confirmLoading={submitting}
                destroyOnClose
            >
                <Form form={assignForm} layout="vertical">
                    <Form.Item
                        name="provider_id"
                        label="Provider"
                        rules={[{ required: true, message: 'Please select provider.' }]}
                    >
                        <Select
                            placeholder="Select provider"
                            options={(selectedBooking ? serviceCompatibleProviders(selectedBooking) : []).map((provider) => ({
                                value: provider.id,
                                label: `${provider.user?.name || 'Provider'} (${provider.provider_type})`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} placeholder="Optional assignment notes" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Update Booking Status"
                open={statusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={submitStatusUpdate}
                confirmLoading={submitting}
                destroyOnClose
            >
                <Form form={statusForm} layout="vertical">
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Please select status.' }]}
                    >
                        <Select
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'assigned', label: 'Assigned' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'no_show', label: 'No Show' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} placeholder="Optional status update note" />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
