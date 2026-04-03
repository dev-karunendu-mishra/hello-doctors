import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
} from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

const dayOptions = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
];

const statusColors = {
    pending: 'gold',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red',
    'no-show': 'default',
};

const api = {
    get: (url, config = {}) => window.axios.get(url, config),
    post: (url, payload) => window.axios.post(url, payload),
    put: (url, payload) => window.axios.put(url, payload),
    del: (url) => window.axios.delete(url),
};

const defaultAppointmentFilters = {
    doctor_id: null,
    clinic_id: null,
    status: null,
    type: null,
    sort_by: 'appointment_date',
    sort_dir: 'desc',
};

const statusFilters = [
    { text: 'Pending',   value: 'pending' },
    { text: 'Confirmed', value: 'confirmed' },
    { text: 'Completed', value: 'completed' },
    { text: 'Cancelled', value: 'cancelled' },
    { text: 'No Show',   value: 'no-show' },
];

const typeFilters = [
    { text: 'In Person',     value: 'in-person' },
    { text: 'Online',        value: 'online' },
    { text: 'Home Visit',    value: 'home-visit' },
];

export default function Index() {
    const [loading, setLoading] = useState(true);
    const [savingClinic, setSavingClinic] = useState(false);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [cities, setCities] = useState([]);

    const [managementDoctorId, setManagementDoctorId] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [managementClinicId, setManagementClinicId] = useState(null);

    const [appointmentFilters, setAppointmentFilters] = useState(defaultAppointmentFilters);
    const [columnFilters, setColumnFilters] = useState({});
    const [filterClinics, setFilterClinics] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointmentPagination, setAppointmentPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    const [scheduleRows, setScheduleRows] = useState([]);
    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState(null);
    const [clinicForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();

    const selectedClinic = useMemo(
        () => clinics.find((clinic) => clinic.id === managementClinicId) || null,
        [clinics, managementClinicId]
    );

    const selectedDoctor = useMemo(
        () => doctors.find((doctor) => doctor.id === managementDoctorId) || null,
        [doctors, managementDoctorId]
    );

    const loadBaseData = async () => {
        setLoading(true);
        try {
            const [doctorRes, cityRes] = await Promise.all([
                api.get('/admin/appointments-data/doctors'),
                api.get('/admin/meta/cities'),
            ]);

            setDoctors(doctorRes.data.data || []);
            setCities(cityRes.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load initial data.');
        } finally {
            setLoading(false);
        }
    };

    const loadManagementDoctorClinics = async (newDoctorId) => {
        if (!newDoctorId) {
            setClinics([]);
            setManagementClinicId(null);
            setScheduleRows([]);
            return;
        }

        try {
            const clinicRes = await api.get(`/admin/appointments-data/doctors/${newDoctorId}/hospital-clinics`);
            const clinicList = clinicRes.data.data || [];
            setClinics(clinicList);
            setManagementClinicId((currentClinicId) =>
                clinicList.some((clinic) => clinic.id === currentClinicId) ? currentClinicId : null
            );
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load clinics.');
        }
    };

    const loadFilterClinics = async (newDoctorId) => {
        if (!newDoctorId) {
            setFilterClinics([]);
            return;
        }

        try {
            const clinicRes = await api.get(`/admin/appointments-data/doctors/${newDoctorId}/hospital-clinics`);
            setFilterClinics(clinicRes.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load filter clinics.');
        }
    };

    const loadClinicData = async (newDoctorId, newClinicId) => {
        if (!newDoctorId || !newClinicId) {
            setScheduleRows([]);
            return;
        }

        try {
            const scheduleRes = await api.get(`/admin/appointments-data/doctors/${newDoctorId}/hospital-clinics/${newClinicId}/schedules`);

            setScheduleRows(scheduleRes.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load clinic data.');
        }
    };

    const loadAppointments = async (page = 1, nextFilters = appointmentFilters) => {
        try {
            const statusParam  = nextFilters.status?.length  ? nextFilters.status  : undefined;
            const typeParam    = nextFilters.type?.length    ? nextFilters.type    : undefined;
            const response = await api.get('/admin/appointments-data/appointments', {
                params: {
                    page,
                    doctor_id: nextFilters.doctor_id || undefined,
                    clinic_id: nextFilters.clinic_id || undefined,
                    status:    statusParam,
                    type:      typeParam,
                    sort_by:   nextFilters.sort_by  || undefined,
                    sort_dir:  nextFilters.sort_dir || undefined,
                },
                paramsSerializer: (params) => {
                    const parts = [];
                    Object.entries(params).forEach(([key, val]) => {
                        if (val === undefined || val === null) return;
                        if (Array.isArray(val)) {
                            val.forEach((v) => parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`));
                        } else {
                            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
                        }
                    });
                    return parts.join('&');
                },
            });

            const paginated = response.data.data || {};
            setAppointments(paginated.data || []);
            setAppointmentPagination({
                current: paginated.current_page || 1,
                pageSize: paginated.per_page || 20,
                total: paginated.total || 0,
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load appointments.');
        }
    };

    useEffect(() => {
        (async () => {
            await loadBaseData();
            await loadAppointments(1, defaultAppointmentFilters);
        })();
    }, []);

    useEffect(() => {
        loadManagementDoctorClinics(managementDoctorId);
    }, [managementDoctorId]);

    useEffect(() => {
        loadClinicData(managementDoctorId, managementClinicId);
    }, [managementDoctorId, managementClinicId]);

    const updateAppointmentFilters = async (changes) => {
        const nextFilters = { ...appointmentFilters, ...changes };
        setAppointmentFilters(nextFilters);
        await loadAppointments(1, nextFilters);
    };

    const handleFilterDoctorChange = async (value) => {
        const nextDoctorId = value || null;
        setFilterClinics([]);
        await loadFilterClinics(nextDoctorId);
        await updateAppointmentFilters({ doctor_id: nextDoctorId, clinic_id: null });
    };

    const handleTableChange = async (pagination, antFilters, sorter) => {
        const statusValues = antFilters.status?.length   ? antFilters.status   : null;
        const typeValues   = antFilters.consultation_type?.length ? antFilters.consultation_type : null;
        const sortBy  = sorter?.field  || 'appointment_date';
        const sortDir = sorter?.order === 'ascend' ? 'asc' : 'desc';
        const nextFilters = {
            ...appointmentFilters,
            status:   statusValues,
            type:     typeValues,
            sort_by:  sortBy,
            sort_dir: sortDir,
        };
        setColumnFilters(antFilters);
        setAppointmentFilters(nextFilters);
        await loadAppointments(pagination.current, nextFilters);
    };

    const openCreateClinic = () => {
        setEditingClinic(null);
        clinicForm.resetFields();
        clinicForm.setFieldsValue({ is_active: true });
        setClinicModalOpen(true);
    };

    const openEditClinic = () => {
        if (!selectedClinic) return;
        setEditingClinic(selectedClinic);
        clinicForm.setFieldsValue({
            hospital_clinic_name: selectedClinic.hospital_clinic_name,
            address: selectedClinic.address,
            landmarks: selectedClinic.landmarks,
            city_id: selectedClinic.city_id,
            consultation_fee: Number(selectedClinic.consultation_fee || 0),
            phone: selectedClinic.phone,
            email: selectedClinic.email,
            is_active: selectedClinic.is_active,
        });
        setClinicModalOpen(true);
    };

    const saveClinic = async () => {
        try {
            const values = await clinicForm.validateFields();
            if (!managementDoctorId) {
                message.error('Select a doctor first.');
                return;
            }

            setSavingClinic(true);

            if (editingClinic) {
                await api.put(`/admin/appointments-data/doctors/${managementDoctorId}/hospital-clinics/${editingClinic.id}`, values);
                message.success('Clinic updated successfully.');
            } else {
                await api.post(`/admin/appointments-data/doctors/${managementDoctorId}/hospital-clinics`, values);
                message.success('Clinic created successfully.');
            }

            setClinicModalOpen(false);
            await loadManagementDoctorClinics(managementDoctorId);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save clinic.');
        } finally {
            setSavingClinic(false);
        }
    };

    const deleteClinic = async () => {
        if (!selectedClinic || !managementDoctorId) return;

        try {
            await api.del(`/admin/appointments-data/doctors/${managementDoctorId}/hospital-clinics/${selectedClinic.id}`);
            message.success('Clinic deleted successfully.');
            await loadManagementDoctorClinics(managementDoctorId);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to delete clinic.');
        }
    };

    const saveSchedule = async () => {
        if (!managementDoctorId || !managementClinicId) {
            message.error('Select doctor and clinic first.');
            return;
        }

        try {
            const values = await scheduleForm.validateFields();
            setSavingSchedule(true);
            await api.post(`/admin/appointments-data/doctors/${managementDoctorId}/hospital-clinics/${managementClinicId}/schedules`, {
                schedules: values.schedules,
            });
            message.success('Schedule saved successfully.');
            await loadClinicData(managementDoctorId, managementClinicId);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

    useEffect(() => {
        const byDay = new Map((scheduleRows || []).map((item) => [item.day_of_week, item]));
        scheduleForm.setFieldsValue({
            schedules: dayOptions.map((day) => {
                const row = byDay.get(day.value);
                return {
                    day_of_week: day.value,
                    opening_time: row?.opening_time ? row.opening_time.slice(0, 5) : null,
                    closing_time: row?.closing_time ? row.closing_time.slice(0, 5) : null,
                    break_start_time: row?.break_start_time ? row.break_start_time.slice(0, 5) : null,
                    break_end_time: row?.break_end_time ? row.break_end_time.slice(0, 5) : null,
                    slot_duration_minutes: row?.slot_duration_minutes ?? 30,
                    max_appointments_per_slot: row?.max_appointments_per_slot ?? 1,
                    is_available: row?.is_available ?? false,
                };
            }),
        });
    }, [scheduleRows, scheduleForm]);

    const buildAppointmentsColumns = () => [
        {
            title: 'No.',
            dataIndex: 'appointment_number',
            key: 'appointment_number',
            width: 175,
            sorter: true,
            sortOrder: appointmentFilters.sort_by === 'appointment_number'
                ? (appointmentFilters.sort_dir === 'asc' ? 'ascend' : 'descend')
                : null,
            showSorterTooltip: { target: 'sorter-icon' },
        },
        {
            title: 'Patient',
            key: 'patient',
            width: 160,
            render: (_, record) => record.patient?.name || '-',
        },
        {
            title: 'Doctor',
            key: 'doctor',
            width: 160,
            render: (_, record) => record.doctor_hospital_clinic?.doctor_profile?.user?.name || '-',
        },
        {
            title: 'Clinic',
            key: 'clinic',
            width: 180,
            render: (_, record) => record.doctor_hospital_clinic?.hospital_clinic_name || '-',
        },
        {
            title: 'Date',
            dataIndex: 'appointment_date',
            key: 'appointment_date',
            width: 130,
            sorter: true,
            sortOrder: appointmentFilters.sort_by === 'appointment_date'
                ? (appointmentFilters.sort_dir === 'asc' ? 'ascend' : 'descend')
                : null,
            defaultSortOrder: 'descend',
            showSorterTooltip: { target: 'sorter-icon' },
            render: (value) => (value ? String(value).slice(0, 10) : '-'),
        },
        {
            title: 'Time',
            key: 'appointment_time',
            width: 90,
            render: (_, record) => (record.appointment_time || '').slice(0, 5),
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            width: 135,
            filters: statusFilters,
            filteredValue: columnFilters.status || null,
            filterMultiple: true,
            render: (_, record) => <Tag color={statusColors[record.status] || 'default'}>{record.status}</Tag>,
        },
        {
            title: 'Type',
            dataIndex: 'consultation_type',
            key: 'consultation_type',
            width: 130,
            filters: typeFilters,
            filteredValue: columnFilters.consultation_type || null,
            filterMultiple: true,
        },
    ];

    return (
        <AdminLayout>
            <Head title="Appointments Management" />

            <Card 
                title={
                    <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Appointment Flow Management
                    </span>
                }
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Admin controls all doctor clinics, schedules, and appointments from this page."
                />

                {loading ? (
                    <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs
                        defaultActiveKey="appointments"
                        items={[
                            {
                                key: 'appointments',
                                label: 'Appointments Data Grid',
                                children: (
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <Row gutter={[12, 12]} align="middle">
                                            <Col xs={24} md={7}>
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    style={{ width: '100%' }}
                                                    placeholder="Filter by doctor"
                                                    value={appointmentFilters.doctor_id}
                                                    onChange={handleFilterDoctorChange}
                                                    allowClear
                                                    options={doctors.map((doctor) => ({
                                                        value: doctor.id,
                                                        label: `${doctor.name}${doctor.specialty ? ` (${doctor.specialty})` : ''}`,
                                                    }))}
                                                />
                                            </Col>
                                            <Col xs={24} md={7}>
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    style={{ width: '100%' }}
                                                    placeholder={appointmentFilters.doctor_id ? 'Filter by clinic' : 'Select doctor first'}
                                                    value={appointmentFilters.clinic_id}
                                                    onChange={(value) => updateAppointmentFilters({ clinic_id: value || null })}
                                                    allowClear
                                                    disabled={!appointmentFilters.doctor_id}
                                                    options={filterClinics.map((clinic) => ({
                                                        value: clinic.id,
                                                        label: `${clinic.hospital_clinic_name} - ${clinic.city?.name || 'City N/A'}`,
                                                    }))}
                                                />
                                            </Col>
                                            <Col xs={24} md={4}>
                                                <Button
                                                    block
                                                    onClick={async () => {
                                                        setFilterClinics([]);
                                                        setColumnFilters({});
                                                        setAppointmentFilters(defaultAppointmentFilters);
                                                        await loadAppointments(1, defaultAppointmentFilters);
                                                    }}
                                                >
                                                    Reset All
                                                </Button>
                                            </Col>
                                            <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                                                <Tag color="geekblue">Total: {appointmentPagination.total}</Tag>
                                                <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                                    Use column headers to filter &amp; sort
                                                </Typography.Text>
                                            </Col>
                                        </Row>

                                        <Table
                                            rowKey="id"
                                            bordered
                                            size="middle"
                                            scroll={{ x: 1100 }}
                                            dataSource={appointments}
                                            onChange={handleTableChange}
                                            showSorterTooltip={{ target: 'sorter-icon' }}
                                            pagination={{
                                                current: appointmentPagination.current,
                                                pageSize: appointmentPagination.pageSize,
                                                total: appointmentPagination.total,
                                                showSizeChanger: false,
                                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                                            }}
                                            columns={buildAppointmentsColumns()}
                                        />
                                    </Space>
                                ),
                            },
                            {
                                key: 'management',
                                label: 'Doctor, Clinic & Schedule Management',
                                children: (
                                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                        <Typography.Text type="secondary">
                                            Search doctor, manage hospital/clinic records, and maintain weekly schedules.
                                        </Typography.Text>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    style={{ width: '100%' }}
                                                    placeholder="Search or select doctor"
                                                    value={managementDoctorId}
                                                    onChange={(value) => setManagementDoctorId(value)}
                                                    allowClear
                                                    options={doctors.map((doctor) => ({
                                                        value: doctor.id,
                                                        label: `${doctor.name}${doctor.specialty ? ` (${doctor.specialty})` : ''}`,
                                                    }))}
                                                />
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Space>
                                                    <Button icon={<PlusOutlined />} type="primary" onClick={openCreateClinic} disabled={!managementDoctorId}>
                                                        Add Clinic
                                                    </Button>
                                                    <Button onClick={openEditClinic} disabled={!selectedClinic}>Edit Clinic</Button>
                                                    <Button danger onClick={deleteClinic} disabled={!selectedClinic}>Delete Clinic</Button>
                                                </Space>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    style={{ width: '100%' }}
                                                    placeholder={managementDoctorId ? 'Select clinic' : 'Select doctor first'}
                                                    value={managementClinicId}
                                                    onChange={(value) => setManagementClinicId(value)}
                                                    allowClear
                                                    disabled={!managementDoctorId}
                                                    options={clinics.map((clinic) => ({
                                                        value: clinic.id,
                                                        label: `${clinic.hospital_clinic_name} - ${clinic.city?.name || 'City N/A'}`,
                                                    }))}
                                                />
                                            </Col>
                                            <Col xs={24} md={12}>
                                                {selectedDoctor && selectedClinic && (
                                                    <Tag color="blue">
                                                        {selectedDoctor.name} | {selectedClinic.hospital_clinic_name}
                                                    </Tag>
                                                )}
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: '8px 0' }} />

                                        <Card size="small" title="Weekly Schedule">
                                            {!managementClinicId ? (
                                                <Alert type="warning" showIcon message="Select a clinic to edit schedule." />
                                            ) : (
                                                <Form form={scheduleForm} layout="vertical">
                                                    <Form.List name="schedules">
                                                        {(fields) => (
                                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                                {fields.map((field, index) => (
                                                                    <Card key={field.key} size="small" title={dayOptions[index]?.label || `Day ${index}`}>
                                                                        <Row gutter={12}>
                                                                            <Col xs={24} md={4}>
                                                                                <Form.Item name={[field.name, 'day_of_week']} hidden>
                                                                                    <InputNumber />
                                                                                </Form.Item>
                                                                                <Form.Item name={[field.name, 'is_available']} label="Available" valuePropName="checked">
                                                                                    <Switch />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={5}>
                                                                                <Form.Item
                                                                                    name={[field.name, 'opening_time']}
                                                                                    label="Open"
                                                                                    rules={[{ pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: 'Use HH:MM format.' }]}
                                                                                >
                                                                                    <Input placeholder="09:00" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={5}>
                                                                                <Form.Item
                                                                                    name={[field.name, 'closing_time']}
                                                                                    label="Close"
                                                                                    rules={[{ pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: 'Use HH:MM format.' }]}
                                                                                >
                                                                                    <Input placeholder="17:00" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={5}>
                                                                                <Form.Item
                                                                                    name={[field.name, 'break_start_time']}
                                                                                    label="Break Start"
                                                                                    rules={[{ pattern: /^$|^([01]\d|2[0-3]):([0-5]\d)$/, message: 'Use HH:MM format.' }]}
                                                                                >
                                                                                    <Input placeholder="13:00" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={5}>
                                                                                <Form.Item
                                                                                    name={[field.name, 'break_end_time']}
                                                                                    label="Break End"
                                                                                    rules={[{ pattern: /^$|^([01]\d|2[0-3]):([0-5]\d)$/, message: 'Use HH:MM format.' }]}
                                                                                >
                                                                                    <Input placeholder="14:00" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={4}>
                                                                                <Form.Item name={[field.name, 'slot_duration_minutes']} label="Slot (min)" rules={[{ required: true }]}>
                                                                                    <InputNumber min={5} max={240} style={{ width: '100%' }} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={12} md={4}>
                                                                                <Form.Item name={[field.name, 'max_appointments_per_slot']} label="Max/Slot" rules={[{ required: true }]}>
                                                                                    <InputNumber min={1} max={20} style={{ width: '100%' }} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>
                                                                    </Card>
                                                                ))}
                                                            </Space>
                                                        )}
                                                    </Form.List>
                                                    <Button type="primary" loading={savingSchedule} onClick={saveSchedule}>
                                                        Save Weekly Schedule
                                                    </Button>
                                                </Form>
                                            )}
                                        </Card>
                                    </Space>
                                ),
                            },
                        ]}
                    />
                )}
            </Card>

            <Modal
                title={editingClinic ? 'Edit Clinic' : 'Add Clinic'}
                open={clinicModalOpen}
                onCancel={() => setClinicModalOpen(false)}
                onOk={saveClinic}
                confirmLoading={savingClinic}
                destroyOnClose
            >
                <Form form={clinicForm} layout="vertical">
                    <Form.Item
                        name="hospital_clinic_name"
                        label="Hospital/Clinic Name"
                        rules={[
                            { required: true, message: 'Please enter clinic name.' },
                            { min: 3, message: 'Clinic name should be at least 3 characters.' },
                        ]}
                        extra="Use a clear unique name for this city (e.g., CityCare Noida Sector 18)."
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Select a city.' }]}>
                        <Select
                            options={cities.map((city) => ({
                                value: city.id,
                                label: city.name,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="Address"
                        rules={[{ required: true, message: 'Please enter full clinic address.' }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="landmarks" label="Landmarks">
                        <Input />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone"
                                rules={[{ pattern: /^[0-9+\-()\s]{7,20}$/, message: 'Enter valid phone number.' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email">
                                <Input type="email" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="consultation_fee"
                                label="Consultation Fee"
                                extra="Leave empty to fallback to doctor default consultation fee."
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="Active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
