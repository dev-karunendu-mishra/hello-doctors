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
import { useEffect, useMemo, useState } from 'react';

const statusColor = {
    pending: 'gold',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red',
    'no-show': 'default',
};

export default function Appointments() {
    const [loading, setLoading] = useState(true);
    const [clinics, setClinics] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [filters, setFilters] = useState({ clinic_id: null, status: null });
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [saving, setSaving] = useState(false);
    const [statusForm] = Form.useForm();

    const loadClinics = async () => {
        const clinicRes = await window.axios.get('/api/doctor/hospital-clinics');
        setClinics(clinicRes.data.data || []);
    };

    const loadAppointments = async (nextFilters = filters, page = 1) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/api/doctor/appointments', {
                params: {
                    clinic_id: nextFilters.clinic_id || undefined,
                    status: nextFilters.status || undefined,
                    page,
                },
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
        (async () => {
            try {
                await loadClinics();
                await loadAppointments({ clinic_id: null, status: null });
            } catch (error) {
                message.error(error?.response?.data?.message || 'Failed to load doctor appointment data.');
                setLoading(false);
            }
        })();
    }, []);

    const applyFilters = async (nextFilters) => {
        setFilters(nextFilters);
        await loadAppointments(nextFilters);
    };

    const openStatusModal = (record) => {
        setSelectedAppointment(record);
        statusForm.setFieldsValue({
            status: record.status,
            cancellation_reason: record.cancellation_reason,
            notes: record.notes,
        });
        setStatusModalOpen(true);
    };

    const saveStatus = async () => {
        if (!selectedAppointment) return;
        try {
            const values = await statusForm.validateFields();
            setSaving(true);
            await window.axios.put(`/api/doctor/appointments/${selectedAppointment.id}`, values);
            message.success('Appointment updated successfully.');
            setStatusModalOpen(false);
            await loadAppointments(filters);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to update appointment.');
        } finally {
            setSaving(false);
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
                    message="Review appointments across clinics and update statuses in real time."
                />

                <Space style={{ marginBottom: 16 }} wrap>
                    <Select
                        style={{ width: 240 }}
                        placeholder="Filter by clinic"
                        allowClear
                        value={filters.clinic_id}
                        onChange={(value) => applyFilters({ ...filters, clinic_id: value || null })}
                        options={clinics.map((clinic) => ({
                            value: clinic.id,
                            label: `${clinic.hospital_clinic_name} - ${clinic.city?.name || 'City N/A'}`,
                        }))}
                    />
                    <Select
                        style={{ width: 220 }}
                        placeholder="Filter by status"
                        allowClear
                        value={filters.status}
                        onChange={(value) => applyFilters({ ...filters, status: value || null })}
                        options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
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
                        onChange: (page) => loadAppointments(filters, page),
                        showSizeChanger: false,
                    }}
                    columns={[
                        { title: 'No.', dataIndex: 'appointment_number', key: 'appointment_number' },
                        {
                            title: 'Patient',
                            key: 'patient',
                            render: (_, record) => record.patient?.name || '-',
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
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                                <Button size="small" onClick={() => openStatusModal(record)}>
                                    Update Status
                                </Button>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                title="Update Appointment Status"
                open={statusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={saveStatus}
                confirmLoading={saving}
                destroyOnClose
            >
                <Form form={statusForm} layout="vertical">
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'no-show', label: 'No Show' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="cancellation_reason" label="Cancellation Reason">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes" extra="Optional note visible to the care team for this appointment.">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
