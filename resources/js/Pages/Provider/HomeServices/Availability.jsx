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
    Row,
    Space,
    Spin,
    Switch,
    Typography,
    message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title } = Typography;

const dayOptions = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
];

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function ProviderHomeServiceAvailability() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const loadAvailability = async () => {
        setLoading(true);
        try {
            const response = await window.axios.get('/api/provider/home-service/availability');
            const rows = response.data?.data || [];
            const byDay = new Map(rows.map((item) => [item.day_of_week, item]));

            form.setFieldsValue({
                schedules: dayOptions.map((day) => {
                    const row = byDay.get(day.value);
                    return {
                        day_of_week: day.value,
                        opening_time: row?.opening_time ? row.opening_time.slice(0, 5) : null,
                        closing_time: row?.closing_time ? row.closing_time.slice(0, 5) : null,
                        break_start_time: row?.break_start_time ? row.break_start_time.slice(0, 5) : null,
                        break_end_time: row?.break_end_time ? row.break_end_time.slice(0, 5) : null,
                        slot_duration_minutes: row?.slot_duration_minutes ?? 30,
                        max_bookings_per_slot: row?.max_bookings_per_slot ?? 1,
                        is_available: row?.is_available ?? false,
                    };
                }),
            });
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load weekly availability.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAvailability();
    }, []);

    const onSave = async () => {
        try {
            const values = await form.validateFields();
            const schedules = values.schedules || [];

            for (const row of schedules) {
                if (row.is_available && (!row.opening_time || !row.closing_time)) {
                    message.error('Opening and closing time are required for available days.');
                    return;
                }
            }

            setSaving(true);
            await window.axios.post('/api/provider/home-service/availability', { schedules });
            message.success('Weekly availability updated successfully.');
            await loadAvailability();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to update availability.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Weekly Availability" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Weekly Availability</Title>
                    <Space>
                        <Link href="/provider/home-services/profile">
                            <Button>My Profile</Button>
                        </Link>
                        <Link href="/provider/home-services/bookings">
                            <Button type="primary">Assigned Bookings</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Set day-wise slots for assignment. Mark off days as unavailable."
                />

                {loading ? (
                    <div className="text-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Card>
                        <Form form={form} layout="vertical">
                            <Form.List name="schedules">
                                {(fields) => (
                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                        {fields.map((field, index) => (
                                            <Card
                                                key={field.key}
                                                size="small"
                                                title={dayOptions[index]?.label || `Day ${index}`}
                                            >
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
                                                            rules={[{ pattern: timePattern, message: 'Use HH:MM format.' }]}
                                                        >
                                                            <Input placeholder="09:00" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={12} md={5}>
                                                        <Form.Item
                                                            name={[field.name, 'closing_time']}
                                                            label="Close"
                                                            rules={[{ pattern: timePattern, message: 'Use HH:MM format.' }]}
                                                        >
                                                            <Input placeholder="18:00" />
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
                                                        <Form.Item
                                                            name={[field.name, 'slot_duration_minutes']}
                                                            label="Slot (min)"
                                                            rules={[{ required: true, message: 'Required' }]}
                                                        >
                                                            <InputNumber min={5} max={180} style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={12} md={4}>
                                                        <Form.Item
                                                            name={[field.name, 'max_bookings_per_slot']}
                                                            label="Max/Slot"
                                                            rules={[{ required: true, message: 'Required' }]}
                                                        >
                                                            <InputNumber min={1} max={10} style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                    </Space>
                                )}
                            </Form.List>

                            <Button type="primary" loading={saving} onClick={onSave}>
                                Save Weekly Availability
                            </Button>
                        </Form>
                    </Card>
                )}
            </Space>
        </AdminLayout>
    );
}
