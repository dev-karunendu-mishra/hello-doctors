import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
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
    Spin,
    Switch,
    message,
} from 'antd';
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
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

export default function Schedule() {
    const [loading, setLoading] = useState(true);
    const [savingClinic, setSavingClinic] = useState(false);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [cities, setCities] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [clinicId, setClinicId] = useState(null);
    const [scheduleRows, setScheduleRows] = useState([]);
    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState(null);
    const [clinicForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();

    const selectedClinic = useMemo(
        () => clinics.find((clinic) => clinic.id === clinicId) || null,
        [clinics, clinicId]
    );

    const loadInitial = async () => {
        setLoading(true);
        try {
            const [cityRes, clinicRes] = await Promise.all([
                window.axios.get('/doctor/data/meta/cities'),
                window.axios.get('/doctor/data/hospital-clinics'),
            ]);

            setCities(cityRes.data.data || []);
            const clinicList = clinicRes.data.data || [];
            setClinics(clinicList);
            setClinicId(clinicList[0]?.id ?? null);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load schedule data.');
        } finally {
            setLoading(false);
        }
    };

    const loadSchedule = async (newClinicId) => {
        if (!newClinicId) {
            setScheduleRows([]);
            return;
        }

        try {
            const response = await window.axios.get(`/doctor/data/hospital-clinics/${newClinicId}/schedules`);
            setScheduleRows(response.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load schedule.');
        }
    };

    useEffect(() => {
        loadInitial();
    }, []);

    useEffect(() => {
        loadSchedule(clinicId);
    }, [clinicId]);

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
            city_id: selectedClinic.city_id,
            address: selectedClinic.address,
            landmarks: selectedClinic.landmarks,
            phone: selectedClinic.phone,
            email: selectedClinic.email,
            consultation_fee: Number(selectedClinic.consultation_fee || 0),
            is_active: selectedClinic.is_active,
        });
        setClinicModalOpen(true);
    };

    const saveClinic = async () => {
        try {
            const values = await clinicForm.validateFields();
            setSavingClinic(true);

            if (editingClinic) {
                await window.axios.put(`/doctor/data/hospital-clinics/${editingClinic.id}`, values);
                message.success('Clinic updated.');
            } else {
                await window.axios.post('/doctor/data/hospital-clinics', values);
                message.success('Clinic created.');
            }

            setClinicModalOpen(false);
            await loadInitial();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save clinic.');
        } finally {
            setSavingClinic(false);
        }
    };

    const deleteClinic = async () => {
        if (!selectedClinic) return;
        try {
            await window.axios.delete(`/doctor/data/hospital-clinics/${selectedClinic.id}`);
            message.success('Clinic deleted.');
            await loadInitial();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to delete clinic.');
        }
    };

    const saveSchedule = async () => {
        if (!clinicId) {
            message.error('Select clinic first.');
            return;
        }

        try {
            const values = await scheduleForm.validateFields();
            setSavingSchedule(true);
            await window.axios.post(`/doctor/data/hospital-clinics/${clinicId}/schedules`, {
                schedules: values.schedules,
            });
            message.success('Schedule updated.');
            await loadSchedule(clinicId);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="My Schedule" />

            <Card 
                title={
                    <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        My Clinics & Schedule
                    </span>
                }
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Manage your clinic locations and day-wise availability from this page."
                />

                {loading ? (
                    <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Row gutter={12}>
                            <Col xs={24} md={12}>
                                <Select
                                    style={{ width: '100%' }}
                                    placeholder="Select clinic"
                                    value={clinicId}
                                    onChange={(value) => setClinicId(value)}
                                    options={clinics.map((clinic) => ({
                                        value: clinic.id,
                                        label: `${clinic.hospital_clinic_name} - ${clinic.city?.name || 'City N/A'}`,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <Space>
                                    <Button icon={<PlusOutlined />} type="primary" onClick={openCreateClinic}>Add Clinic</Button>
                                    <Button onClick={openEditClinic} disabled={!selectedClinic}>Edit Clinic</Button>
                                    <Button danger onClick={deleteClinic} disabled={!selectedClinic}>Delete Clinic</Button>
                                </Space>
                            </Col>
                        </Row>

                        <Card size="small" title="Weekly Availability">
                            {!clinicId ? (
                                <Alert type="warning" showIcon message="Add or select a clinic first." />
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
                        extra="Use a clear unique name so patients can identify your location quickly."
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Select city.' }]}>
                        <Select
                            options={cities.map((city) => ({
                                value: city.id,
                                label: city.name,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Address is required.' }]}>
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
                                extra="Leave empty to fallback to your default profile fee."
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
