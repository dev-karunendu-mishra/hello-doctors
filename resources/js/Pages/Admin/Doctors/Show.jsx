import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Row,
    Space,
    Statistic,
    Tag,
    Typography,
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const WEEK_DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
];

const formatTime = (value) => {
    if (!value) return '-';
    return String(value).slice(0, 5);
};

const getScheduleForDay = (schedules, day) =>
    (schedules || []).find((schedule) => Number(schedule.day_of_week) === Number(day.value));

export default function DoctorShow({ doctor }) {
    return (
        <AdminLayout>
            <Head title={`${doctor.name} - Profile View`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Link href="/admin/doctors">
                    <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                </Link>

                <Link href={`/admin/doctors/${doctor.slug || doctor.id}/edit`}>
                    <Button type="primary" icon={<EditOutlined />}>Edit Doctor</Button>
                </Link>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={8}>
                    <Card>
                        <div className="text-center">
                            {doctor.profile_image_url ? (
                                <Avatar size={132} src={doctor.profile_image_url} />
                            ) : (
                                <Avatar size={132} icon={<UserOutlined />} />
                            )}
                            <Title level={3} className="!mt-4 !mb-1">{doctor.name}</Title>
                            <Text type="secondary">{doctor.specialty?.name || 'Specialty not assigned'}</Text>
                        </div>

                        <div className="mt-4">
                            <Space wrap>
                                {doctor.is_verified ? (
                                    <Tag color="success" icon={<SafetyCertificateOutlined />}>Verified</Tag>
                                ) : (
                                    <Tag color="warning" icon={<CloseCircleOutlined />}>Unverified</Tag>
                                )}

                                {doctor.is_active ? (
                                    <Tag color="processing" icon={<CheckCircleOutlined />}>Active</Tag>
                                ) : (
                                    <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>
                                )}

                                {doctor.is_available_online ? (
                                    <Tag color="cyan" icon={<GlobalOutlined />}>Online Available</Tag>
                                ) : (
                                    <Tag color="default">Offline Only</Tag>
                                )}
                            </Space>
                        </div>

                        <Descriptions column={1} size="small" className="mt-4">
                            <Descriptions.Item label="Email">
                                <Space size={6}>
                                    <MailOutlined />
                                    <Text>{doctor.email || '-'}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                                <Space size={6}>
                                    <PhoneOutlined />
                                    <Text>{doctor.phone || '-'}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Address">
                                <Space size={6}>
                                    <EnvironmentOutlined />
                                    <Text>{doctor.address || 'Not specified'}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Website">
                                {doctor.website ? (
                                    <a href={doctor.website} target="_blank" rel="noopener noreferrer">
                                        {doctor.website}
                                    </a>
                                ) : (
                                    <Text type="secondary">Not provided</Text>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                <Col xs={24} xl={16}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic title="Experience" value={doctor.experience_years || 0} suffix="years" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic title="Default Fee" value={doctor.consultation_fee || 0} prefix="INR" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic title="Cities" value={(doctor.cities || []).length} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic title="Clinics" value={(doctor.hospital_clinics || []).length} />
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Professional Information" className="mt-4">
                        <Descriptions bordered column={{ xs: 1, md: 2 }}>
                            <Descriptions.Item label="License Number">{doctor.license_number || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Specialty">{doctor.specialty?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Qualification" span={2}>
                                {doctor.qualification || 'Not provided'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Bio" span={2}>
                                {doctor.bio || 'No bio available'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Practice Cities" span={2}>
                                <Space wrap>
                                    {(doctor.cities || []).length > 0 ? (
                                        doctor.cities.map((city) => <Tag key={city.id}>{city.name}</Tag>)
                                    ) : (
                                        <Text type="secondary">No cities assigned</Text>
                                    )}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="SEO Information" className="mt-4">
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Meta Title">{doctor.meta_title || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Meta Description">
                                {doctor.meta_description || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Meta Keywords">{doctor.meta_keywords || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="System Information" className="mt-4">
                        <Descriptions bordered column={{ xs: 1, md: 2 }}>
                            <Descriptions.Item label="Doctor ID">{doctor.id}</Descriptions.Item>
                            <Descriptions.Item label="Slug">{doctor.slug || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Created At">{doctor.created_at || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Updated At">{doctor.updated_at || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            <Card title="Clinics, Hospitals and Weekly Schedules" className="mt-4">
                {(doctor.hospital_clinics || []).length === 0 ? (
                    <Empty description="No clinic/hospital records found for this doctor" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {doctor.hospital_clinics.map((clinic) => (
                            <Col xs={24} key={clinic.id}>
                                <Card
                                    size="small"
                                    title={clinic.hospital_clinic_name || `Clinic #${clinic.id}`}
                                    extra={
                                        clinic.is_active ? (
                                            <Tag color="success">Active</Tag>
                                        ) : (
                                            <Tag color="error">Inactive</Tag>
                                        )
                                    }
                                >
                                    <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
                                        <Descriptions.Item label="City">{clinic.city?.name || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Consultation Fee">
                                            {clinic.consultation_fee ? `INR ${clinic.consultation_fee}` : 'Uses doctor default'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Address" span={2}>
                                            {clinic.address || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Landmarks">{clinic.landmarks || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Phone">{clinic.phone || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Email">{clinic.email || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Geo Coordinates" span={2}>
                                            {clinic.latitude && clinic.longitude
                                                ? `${clinic.latitude}, ${clinic.longitude}`
                                                : 'Not set'}
                                        </Descriptions.Item>
                                    </Descriptions>

                                    <div className="mt-4 rounded border border-gray-100 bg-gray-50 p-3">
                                        <Title level={5} className="!mb-3">
                                            <ClockCircleOutlined className="mr-2" />
                                            Weekly Schedule
                                        </Title>

                                        <Row gutter={[12, 12]}>
                                            {WEEK_DAYS.map((day) => {
                                                const schedule = getScheduleForDay(clinic.schedules, day);

                                                return (
                                                    <Col xs={24} sm={12} lg={8} xl={6} key={`clinic-${clinic.id}-day-${day.value}`}>
                                                        <Card size="small" className="h-full">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <Text strong>{day.label}</Text>
                                                                {schedule?.is_available ? (
                                                                    <Tag color="success">ON</Tag>
                                                                ) : (
                                                                    <Tag>OFF</Tag>
                                                                )}
                                                            </div>

                                                            {!schedule || !schedule.is_available ? (
                                                                <Text type="secondary">Unavailable</Text>
                                                            ) : (
                                                                <Space direction="vertical" size={2}>
                                                                    <Text>
                                                                        {formatTime(schedule.opening_time)} - {formatTime(schedule.closing_time)}
                                                                    </Text>
                                                                    <Text type="secondary">
                                                                        Break: {schedule.break_start_time && schedule.break_end_time
                                                                            ? `${formatTime(schedule.break_start_time)} - ${formatTime(schedule.break_end_time)}`
                                                                            : 'No break'}
                                                                    </Text>
                                                                    <Text type="secondary">
                                                                        Slot: {schedule.slot_duration_minutes || 30} min
                                                                    </Text>
                                                                    <Text type="secondary">
                                                                        Max per slot: {schedule.max_appointments_per_slot || 1}
                                                                    </Text>
                                                                </Space>
                                                            )}
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>

            <Alert
                className="mt-4"
                type="info"
                showIcon
                message="Security Notice"
                description="Sensitive credentials such as passwords are intentionally excluded from this profile view."
            />
        </AdminLayout>
    );
}
