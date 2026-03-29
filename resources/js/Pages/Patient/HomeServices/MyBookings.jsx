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

const statusColor = {
    pending: 'gold',
    assigned: 'processing',
    confirmed: 'blue',
    in_progress: 'cyan',
    completed: 'green',
    cancelled: 'red',
    no_show: 'default',
};

export default function HomeServiceMyBookings() {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [status, setStatus] = useState('upcoming');

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelForm] = Form.useForm();

    const loadBookings = async (nextStatus = status, page = 1) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/patient/data/home-service-bookings', {
                params: { status: nextStatus, page },
            });

            const paginated = response.data?.data || {};
            setBookings(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load home service bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings('upcoming');
    }, []);

    const openCancelModal = (record) => {
        setSelectedBooking(record);
        cancelForm.resetFields();
        setCancelModalOpen(true);
    };

    const onCancelBooking = async () => {
        if (!selectedBooking) return;

        try {
            const values = await cancelForm.validateFields();
            setCancelling(true);
            await window.axios.post(`/patient/data/home-service-bookings/${selectedBooking.id}/cancel`, {
                reason: values.reason,
            });

            message.success('Booking cancelled successfully.');
            setCancelModalOpen(false);
            await loadBookings(status, pagination.current);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to cancel booking.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="My Home Service Bookings" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>My Home Service Bookings</Title>
                    <Space>
                        <Link href="/patient/home-services">
                            <Button>Browse Services</Button>
                        </Link>
                        <Link href="/patient/home-services/book">
                            <Button type="primary">New Booking</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Track all home service requests and cancel eligible bookings when needed."
                />

                <Card>
                    <Space style={{ marginBottom: 16 }}>
                        <Select
                            style={{ width: 220 }}
                            value={status}
                            onChange={async (value) => {
                                setStatus(value);
                                await loadBookings(value, 1);
                            }}
                            options={[
                                { value: 'upcoming', label: 'Upcoming' },
                                { value: 'past', label: 'Past' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'assigned', label: 'Assigned' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'no_show', label: 'No Show' },
                            ]}
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
                            onChange: (page) => loadBookings(status, page),
                            showSizeChanger: false,
                        }}
                        columns={[
                            { title: 'Booking No.', dataIndex: 'booking_number', key: 'booking_number' },
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
                                title: 'Date',
                                dataIndex: 'service_date',
                                key: 'service_date',
                            },
                            {
                                title: 'Time',
                                key: 'service_time',
                                render: (_, record) => (record.service_time || '').slice(0, 5),
                            },
                            {
                                title: 'Total',
                                key: 'total_amount',
                                render: (_, record) => `INR ${record.total_amount || 0}`,
                            },
                            {
                                title: 'Status',
                                key: 'status',
                                render: (_, record) => (
                                    <Tag color={statusColor[record.status] || 'default'}>
                                        {record.status}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                    <Button
                                        size="small"
                                        danger
                                        disabled={!['pending', 'assigned', 'confirmed'].includes(record.status)}
                                        onClick={() => openCancelModal(record)}
                                    >
                                        Cancel
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            <Modal
                title="Cancel Home Service Booking"
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                onOk={onCancelBooking}
                confirmLoading={cancelling}
                destroyOnClose
            >
                <Form form={cancelForm} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[
                            { required: true, message: 'Please provide reason.' },
                            { max: 1000, message: 'Keep reason under 1000 characters.' },
                        ]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
