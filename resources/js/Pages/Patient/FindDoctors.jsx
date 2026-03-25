import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Collapse,
    Col,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    message,
} from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const consultationTypes = [
    { value: 'in-person', label: 'In Person' },
    { value: 'online', label: 'Online' },
    { value: 'phone', label: 'Phone' },
];

const groupSlots = (slots) => {
    const groups = {
        Morning: [],
        Afternoon: [],
        Evening: [],
    };

    slots.forEach((slot) => {
        const hour = parseInt(slot.time.split(':')[0], 10);

        if (hour < 12) {
            groups.Morning.push(slot);
        } else if (hour < 17) {
            groups.Afternoon.push(slot);
        } else {
            groups.Evening.push(slot);
        }
    });

    return groups;
};

export default function FindDoctors() {
    const [loading, setLoading] = useState(false);
    const [specialties, setSpecialties] = useState([]);
    const [cities, setCities] = useState([]);
    const [results, setResults] = useState([]);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingSelection, setBookingSelection] = useState(null);
    const [bookingSaving, setBookingSaving] = useState(false);
    const [filters, setFilters] = useState({
        specialty_id: null,
        city_id: null,
        date_from: new Date().toISOString().slice(0, 10),
        date_to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    const [bookingForm] = Form.useForm();

    const loadMeta = async () => {
        try {
            const [specialtyRes, cityRes] = await Promise.all([
                window.axios.get('/api/meta/specialties'),
                window.axios.get('/api/meta/cities'),
            ]);
            setSpecialties(specialtyRes.data.data || []);
            setCities(cityRes.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load filters.');
        }
    };

    const search = async (nextFilters = filters) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/api/patient/available-appointments', {
                params: {
                    specialty_id: nextFilters.specialty_id || undefined,
                    city_id: nextFilters.city_id || undefined,
                    date_from: nextFilters.date_from,
                    date_to: nextFilters.date_to,
                },
            });
            setResults(response.data.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Search failed.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeta();
        search(filters);
    }, []);

    const openBooking = (doctor, clinic, date, slot) => {
        setBookingSelection({ doctor, clinic, date, slot });
        bookingForm.setFieldsValue({
            consultation_type: 'in-person',
            reason_for_visit: '',
        });
        setBookingOpen(true);
    };

    const confirmBooking = async () => {
        if (!bookingSelection) return;

        try {
            const values = await bookingForm.validateFields();
            setBookingSaving(true);
            await window.axios.post('/api/patient/appointments', {
                doctor_hospital_clinic_id: bookingSelection.clinic.id,
                appointment_date: bookingSelection.date,
                appointment_time: bookingSelection.slot.time,
                consultation_type: values.consultation_type,
                reason_for_visit: values.reason_for_visit,
            });
            message.success('Appointment booked successfully.');
            setBookingOpen(false);
            await search(filters);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Booking failed.');
        } finally {
            setBookingSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Find Doctors" />

            <Card 
                title={
                    <span>
                        <MedicineBoxOutlined style={{ marginRight: 8 }} />
                        Book Appointment
                    </span>
                }
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Filter doctors by specialty, city, and dates, then book an available slot."
                />

                <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={5}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Specialty"
                            allowClear
                            value={filters.specialty_id}
                            onChange={(value) => setFilters((prev) => ({ ...prev, specialty_id: value || null }))}
                            options={specialties.map((item) => ({ value: item.id, label: item.name }))}
                        />
                    </Col>
                    <Col xs={24} md={5}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="City"
                            allowClear
                            value={filters.city_id}
                            onChange={(value) => setFilters((prev) => ({ ...prev, city_id: value || null }))}
                            options={cities.map((item) => ({ value: item.id, label: item.name }))}
                        />
                    </Col>
                    <Col xs={24} md={5}>
                        <Input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                        />
                    </Col>
                    <Col xs={24} md={5}>
                        <Input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                        />
                    </Col>
                    <Col xs={24} md={4}>
                        <Button type="primary" loading={loading} onClick={() => search(filters)} block>
                            Search
                        </Button>
                    </Col>
                </Row>

                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {results.map((entry, index) => (
                        <Card
                            key={`${entry.clinic.id}-${index}`}
                            size="small"
                            title={`${entry.doctor.name} (${entry.doctor.specialty || 'Specialty N/A'})`}
                            extra={<Tag color="blue">{entry.clinic.hospital_clinic_name}</Tag>}
                        >
                            <p style={{ marginBottom: 8 }}>
                                {entry.clinic.city} | {entry.clinic.address}
                            </p>
                            <p style={{ marginBottom: 12 }}>
                                Fee: INR {entry.clinic.consultation_fee}
                            </p>

                            <Space direction="vertical" style={{ width: '100%' }}>
                                {entry.available_dates.slice(0, 3).map((day) => (
                                    <div key={day.date}>
                                        <Tag>{day.date}</Tag>
                                        <Collapse
                                            size="small"
                                            items={Object.entries(groupSlots(day.slots)).map(([label, slots]) => ({
                                                key: `${day.date}-${label}`,
                                                label: `${label} (${slots.length})`,
                                                children: (
                                                    <Space wrap>
                                                        {slots.length === 0 && <Typography.Text type="secondary">No slots</Typography.Text>}
                                                        {slots.map((slot) => (
                                                            <Button
                                                                key={`${day.date}-${slot.time}`}
                                                                size="small"
                                                                onClick={() => openBooking(entry.doctor, entry.clinic, day.date, slot)}
                                                            >
                                                                {slot.time}
                                                            </Button>
                                                        ))}
                                                    </Space>
                                                ),
                                            }))}
                                        />
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    ))}
                </Space>
            </Card>

            <Modal
                title="Confirm Booking"
                open={bookingOpen}
                onCancel={() => setBookingOpen(false)}
                onOk={confirmBooking}
                confirmLoading={bookingSaving}
                destroyOnClose
            >
                {bookingSelection && (
                    <div style={{ marginBottom: 12 }}>
                        <p><strong>Doctor:</strong> {bookingSelection.doctor.name}</p>
                        <p><strong>Clinic:</strong> {bookingSelection.clinic.hospital_clinic_name}</p>
                        <p><strong>Date:</strong> {bookingSelection.date}</p>
                        <p><strong>Time:</strong> {bookingSelection.slot.time}</p>
                    </div>
                )}

                <Form form={bookingForm} layout="vertical">
                    <Form.Item name="consultation_type" label="Consultation Type" rules={[{ required: true }]}>
                        <Select options={consultationTypes} />
                    </Form.Item>
                    <Form.Item
                        name="reason_for_visit"
                        label="Reason for Visit"
                        extra="Brief notes help doctor prepare before consultation."
                        rules={[{ max: 1000, message: 'Keep reason under 1000 characters.' }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
