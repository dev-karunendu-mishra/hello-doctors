import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    DatePicker,
    Drawer,
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
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const statusColor = {
    pending: 'gold',
    assigned: 'processing',
    confirmed: 'blue',
    in_progress: 'cyan',
    completed: 'green',
    cancelled: 'red',
    no_show: 'default',
};

const statusOptions = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
];

const allowedTransitions = {
    assigned: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    pending: [],
    completed: [],
    cancelled: [],
    no_show: [],
};

export default function ProviderHomeServiceBookings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [filters, setFilters] = useState({ status: null, date: null });

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailBooking, setDetailBooking] = useState(null);
    const [statusForm] = Form.useForm();

    const getAllowedStatusOptions = (status) => {
        const allowed = allowedTransitions[status] || [];

        return statusOptions.filter((item) => allowed.includes(item.value));
    };

    const getMapLink = (booking) => {
        const address = booking?.address;
        if (!address) return null;

        if (address.latitude !== null && address.latitude !== undefined && address.longitude !== null && address.longitude !== undefined) {
            return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
        }

        const query = [
            address.line1,
            address.line2,
            address.landmark,
            address.city?.name,
            address.pincode,
        ].filter(Boolean).join(', ');

        if (!query) return null;

        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    };

    const loadBookings = async (nextFilters = filters, page = 1) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/api/provider/home-service/bookings', {
                params: {
                    page,
                    status: nextFilters.status || undefined,
                    date: nextFilters.date || undefined,
                },
            });

            const paginated = response.data?.data || {};
            setBookings(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const applyFilters = async (nextFilters) => {
        setFilters(nextFilters);
        await loadBookings(nextFilters, 1);
    };

    const openStatusModal = (booking) => {
        const options = getAllowedStatusOptions(booking.status);
        setSelectedBooking(booking);
        statusForm.setFieldsValue({
            status: options[0]?.value || undefined,
            notes: '',
        });
        setStatusModalOpen(true);
    };

    const openDetailDrawer = (booking) => {
        setDetailBooking(booking);
        setDetailDrawerOpen(true);
    };

    const saveStatus = async () => {
        if (!selectedBooking) return;

        try {
            const values = await statusForm.validateFields();
            setSaving(true);
            await window.axios.post(`/api/provider/home-service/bookings/${selectedBooking.id}/status`, values);
            message.success('Booking status updated.');
            setStatusModalOpen(false);
            await loadBookings(filters, pagination.current);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to update booking status.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Assigned Home Service Bookings" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Assigned Bookings</Title>
                    <Space>
                        <Link href="/provider/home-services/profile">
                            <Button>My Profile</Button>
                        </Link>
                        <Link href="/provider/home-services/availability">
                            <Button>Weekly Availability</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Manage status updates for your assigned visits and keep patient progress updated."
                />

                <Card>
                    <Space wrap style={{ marginBottom: 16 }}>
                        <Select
                            allowClear
                            style={{ width: 220 }}
                            placeholder="Filter by status"
                            value={filters.status}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'assigned', label: 'Assigned' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'no_show', label: 'No Show' },
                            ]}
                            onChange={async (value) => applyFilters({ ...filters, status: value || null })}
                        />

                        <DatePicker
                            style={{ width: 220 }}
                            placeholder="Filter by date"
                            value={filters.date ? dayjs(filters.date) : null}
                            onChange={async (value) => applyFilters({
                                ...filters,
                                date: value ? value.format('YYYY-MM-DD') : null,
                            })}
                        />

                        <Button onClick={async () => applyFilters({ status: null, date: null })}>Reset</Button>
                    </Space>

                    <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={bookings}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            onChange: (page) => loadBookings(filters, page),
                            showSizeChanger: false,
                        }}
                        columns={[
                            { title: 'Booking No.', dataIndex: 'booking_number', key: 'booking_number' },
                            {
                                title: 'Patient',
                                key: 'patient',
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
                                title: 'Address',
                                key: 'address',
                                render: (_, record) => (
                                    <span>
                                        {record.address?.line1 || '-'}
                                        {record.address?.city?.name ? `, ${record.address.city.name}` : ''}
                                    </span>
                                ),
                            },
                            {
                                title: 'Schedule',
                                key: 'schedule',
                                render: (_, record) => `${record.service_date} ${(record.service_time || '').slice(0, 5)}`,
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
                                    <Space>
                                        <Button size="small" onClick={() => openDetailDrawer(record)}>
                                            View
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => openStatusModal(record)}
                                            disabled={getAllowedStatusOptions(record.status).length === 0}
                                        >
                                            Update Status
                                        </Button>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>

            <Drawer
                title={`Booking Details${detailBooking?.booking_number ? ` - ${detailBooking.booking_number}` : ''}`}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                width={520}
                extra={
                    getMapLink(detailBooking) ? (
                        <Button
                            type="primary"
                            href={getMapLink(detailBooking)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Map
                        </Button>
                    ) : null
                }
            >
                {detailBooking ? (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Card size="small" title="Patient">
                            <Space direction="vertical" size={2}>
                                <Text strong>{detailBooking.user?.name || '-'}</Text>
                                <Text type="secondary">Phone: {detailBooking.user?.phone || '-'}</Text>
                            </Space>
                        </Card>

                        <Card size="small" title="Visit">
                            <Space direction="vertical" size={4}>
                                <Text>Service: {detailBooking.service?.name || '-'}</Text>
                                <Text>Date: {detailBooking.service_date || '-'}</Text>
                                <Text>Time: {(detailBooking.service_time || '').slice(0, 5) || '-'}</Text>
                                <Text>
                                    Status:{' '}
                                    <Tag color={statusColor[detailBooking.status] || 'default'}>
                                        {detailBooking.status}
                                    </Tag>
                                </Text>
                            </Space>
                        </Card>

                        <Card size="small" title="Patient Instructions">
                            <Text>{detailBooking.special_instructions || 'No special instructions provided.'}</Text>
                        </Card>

                        <Card size="small" title="Address">
                            <Space direction="vertical" size={2}>
                                <Text>{detailBooking.address?.line1 || '-'}</Text>
                                {detailBooking.address?.line2 ? <Text>{detailBooking.address.line2}</Text> : null}
                                {detailBooking.address?.landmark ? (
                                    <Text type="secondary">Landmark: {detailBooking.address.landmark}</Text>
                                ) : null}
                                <Text>
                                    {detailBooking.address?.city?.name || '-'}
                                    {detailBooking.address?.pincode ? ` - ${detailBooking.address.pincode}` : ''}
                                </Text>
                            </Space>
                        </Card>
                    </Space>
                ) : null}
            </Drawer>

            <Modal
                title="Update Booking Status"
                open={statusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={saveStatus}
                confirmLoading={saving}
                destroyOnClose
            >
                <Form form={statusForm} layout="vertical">
                    <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Select status.' }]}>
                        <Select options={getAllowedStatusOptions(selectedBooking?.status)} />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={4} maxLength={1000} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
