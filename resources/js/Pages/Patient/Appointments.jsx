import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
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
    message,
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const statusColor = {
    pending: 'gold',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red',
    'no-show': 'default',
};

const paymentStatusColor = {
    pending: 'orange',
    paid: 'green',
    failed: 'red',
    refunded: 'purple',
};

const paymentMethodColor = {
    online: 'green',
    cod: 'blue',
};

const paymentMethodLabel = {
    online: 'Online',
    cod: 'Pay at Clinic',
};

export default function Appointments() {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [status, setStatus] = useState('upcoming');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelForm] = Form.useForm();

    const loadAppointments = async (nextStatus = status, page = 1) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/patient/data/appointments', {
                params: { status: nextStatus, page },
            });
            const paginated = response.data.data || {};
            setAppointments(paginated.data || []);
            setPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments('upcoming');
    }, []);

    const onStatusChange = async (value) => {
        setStatus(value);
        await loadAppointments(value);
    };

    const openCancelModal = (record) => {
        setSelectedAppointment(record);
        cancelForm.resetFields();
        setCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedAppointment) return;
        try {
            const values = await cancelForm.validateFields();
            setCancelling(true);
            await window.axios.post(`/patient/data/appointments/${selectedAppointment.id}/cancel`, {
                reason: values.reason,
            });
            message.success('Appointment cancelled successfully.');
            setCancelModalOpen(false);
            await loadAppointments(status);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to cancel appointment.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="My Appointments" />

            <Card 
                title={
                    <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        My Appointments
                    </span>
                }
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Track your upcoming, past, and cancelled appointments here."
                />

                <Space style={{ marginBottom: 16 }}>
                    <Select
                        style={{ width: 220 }}
                        value={status}
                        onChange={onStatusChange}
                        options={[
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'past', label: 'Past' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'no-show', label: 'No Show' },
                        ]}
                    />
                </Space>

                <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={appointments}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page) => loadAppointments(status, page),
                        showSizeChanger: false,
                    }}
                    columns={[
                        { title: 'No.', dataIndex: 'appointment_number', key: 'appointment_number' },
                        {
                            title: 'Doctor',
                            key: 'doctor',
                            render: (_, record) => record.doctor_hospital_clinic?.doctor_profile?.user?.name || '-',
                        },
                        {
                            title: 'Clinic',
                            key: 'clinic',
                            render: (_, record) => record.doctor_hospital_clinic?.hospital_clinic_name || '-',
                        },
                        { title: 'Date', dataIndex: 'appointment_date', key: 'appointment_date' },
                        {
                            title: 'Time',
                            key: 'appointment_time',
                            render: (_, record) => (record.appointment_time || '').slice(0, 5),
                        },
                        {
                            title: 'Status',
                            key: 'status',
                            render: (_, record) => <Tag color={statusColor[record.status] || 'default'}>{record.status}</Tag>,
                        },
                        {
                            title: 'Payment',
                            key: 'payment_status',
                            render: (_, record) => {
                                const paymentStatus = record.payment_status || 'pending';
                                return <Tag color={paymentStatusColor[paymentStatus] || 'default'}>{paymentStatus}</Tag>;
                            },
                        },
                        {
                            title: 'Method',
                            key: 'payment_method',
                            render: (_, record) => {
                                const paymentMethod = record.payment_method || 'cod';
                                return <Tag color={paymentMethodColor[paymentMethod] || 'default'}>{paymentMethodLabel[paymentMethod] || paymentMethod}</Tag>;
                            },
                        },
                        {
                            title: 'Amount',
                            key: 'payment_amount',
                            render: (_, record) => {
                                const amount = Number(record.payment_amount || 0).toFixed(2);
                                const discount = Number(record.discount_amount || 0).toFixed(2);
                                return Number(discount) > 0 ? `₹${amount} (saved ₹${discount})` : `₹${amount}`;
                            },
                        },
                        {
                            title: 'Action',
                            key: 'action',
                            render: (_, record) => (
                                <Button
                                    size="small"
                                    danger
                                    disabled={!(record.status === 'pending' || record.status === 'confirmed')}
                                    onClick={() => openCancelModal(record)}
                                >
                                    Cancel
                                </Button>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                title="Cancel Appointment"
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                onOk={confirmCancel}
                confirmLoading={cancelling}
                destroyOnClose
            >
                <Form form={cancelForm} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Reason for cancellation"
                        rules={[{ required: true, message: 'Please provide reason.' }, { max: 1000, message: 'Keep reason under 1000 characters.' }]}
                        extra="This reason is shared with the clinic and doctor."
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
