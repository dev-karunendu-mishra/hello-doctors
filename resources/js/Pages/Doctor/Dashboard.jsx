import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    List,
    Progress,
    Row,
    Statistic,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import {
    BankOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    MedicineBoxOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const statusColors = {
    pending: 'gold',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red',
    'no-show': 'default',
};

function AppointmentAvatar({ name }) {
    const initials = (name || '?').charAt(0).toUpperCase();
    return (
        <Avatar style={{ backgroundColor: '#1890ff' }}>{initials}</Avatar>
    );
}

export default function Dashboard({ profile, stats, todayAppointments, upcomingAppointments }) {
    if (!profile) {
        return (
            <AdminLayout>
                <Head title="Doctor Dashboard" />
                <Alert
                    type="warning"
                    showIcon
                    message="Profile Not Set Up"
                    description="Your doctor profile has not been created yet. Please contact the administrator to complete your registration."
                />
            </AdminLayout>
        );
    }

    const clinics = profile.hospital_clinics || [];
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AdminLayout>
            <Head title="Doctor Dashboard" />

            {/* ── Verification alert ── */}
            {!profile.is_verified && (
                <Alert
                    type="warning"
                    showIcon
                    banner
                    message="Your profile is pending verification. Our team will review it shortly."
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* ── Header row ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Doctor Dashboard</Title>
                    <Text type="secondary">{today}</Text>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link href="/doctor/profile/edit">
                        <Button icon={<EditOutlined />}>Edit Profile</Button>
                    </Link>
                    <Link href="/doctor/appointments">
                        <Button icon={<CalendarOutlined />}>Appointments</Button>
                    </Link>
                    <Link href="/doctor/schedule">
                        <Button type="primary" icon={<ClockCircleOutlined />}>Manage Schedule</Button>
                    </Link>
                </div>
            </div>

            {/* ── Profile summary card ── */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[24, 16]} align="middle">
                    <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
                        {profile.profile_image_url ? (
                            <Avatar size={100} src={profile.profile_image_url} />
                        ) : (
                            <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        )}
                    </Col>
                    <Col xs={24} sm={20}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <Title level={4} style={{ margin: 0 }}>{profile.name}</Title>
                            {profile.is_verified
                                ? <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
                                : <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Verification</Tag>
                            }
                            {profile.is_active
                                ? <Tag color="blue">Active</Tag>
                                : <Tag color="red">Inactive</Tag>
                            }
                            {profile.specialty?.name && (
                                <Tag color="purple" icon={<MedicineBoxOutlined />}>{profile.specialty.name}</Tag>
                            )}
                        </div>
                        <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                            <Descriptions.Item label="Email">{profile.user?.email || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{profile.phone || 'Not provided'}</Descriptions.Item>
                            <Descriptions.Item label="Experience">{profile.experience_years ? `${profile.experience_years} yrs` : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Consultation Fee">₹{profile.consultation_fee || '—'}</Descriptions.Item>
                            <Descriptions.Item label="License">{profile.license_number || '—'}</Descriptions.Item>
                            {profile.cities?.length > 0 && (
                                <Descriptions.Item label={<><EnvironmentOutlined /> Cities</>}>
                                    {profile.cities.map(c => c.name).join(', ')}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                        <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Profile Completion</Text>
                            <Progress
                                percent={stats?.profile_completion || 0}
                                size="small"
                                status={stats?.profile_completion === 100 ? 'success' : 'active'}
                                style={{ maxWidth: 320, marginTop: 4 }}
                            />
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* ── Stat cards ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Today's Appointments"
                            value={stats?.todayAppointments || 0}
                            prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Pending"
                            value={stats?.pendingAppointments || 0}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Patients"
                            value={stats?.totalPatients || 0}
                            prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Completed"
                            value={stats?.completedAppointments || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ── Appointments row ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* Today's appointments */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<><CalendarOutlined /> Today's Appointments</>}
                        extra={<Link href="/doctor/appointments">View All</Link>}
                        style={{ height: '100%' }}
                    >
                        {todayAppointments && todayAppointments.length > 0 ? (
                            <List
                                dataSource={todayAppointments}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Tag color={statusColors[item.status] || 'default'} key="status">
                                                {item.status}
                                            </Tag>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<AppointmentAvatar name={item.patient?.name} />}
                                            title={item.patient?.name || 'Patient'}
                                            description={
                                                <span>
                                                    {(item.appointment_time || '').slice(0, 5)}
                                                    {item.consultation_type && (
                                                        <Tag style={{ marginLeft: 8 }} color="default">{item.consultation_type}</Tag>
                                                    )}
                                                </span>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="No appointments today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>

                {/* Upcoming appointments */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<><ClockCircleOutlined /> Upcoming Appointments</>}
                        extra={<Link href="/doctor/appointments">View All</Link>}
                        style={{ height: '100%' }}
                    >
                        {upcomingAppointments && upcomingAppointments.length > 0 ? (
                            <List
                                dataSource={upcomingAppointments}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Tag color={statusColors[item.status] || 'default'} key="status">
                                                {item.status}
                                            </Tag>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<AppointmentAvatar name={item.patient?.name} />}
                                            title={item.patient?.name || 'Patient'}
                                            description={
                                                <span>
                                                    {item.appointment_date} · {(item.appointment_time || '').slice(0, 5)}
                                                    {item.doctor_hospital_clinic?.city?.name && (
                                                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                                            <EnvironmentOutlined /> {item.doctor_hospital_clinic.city.name}
                                                        </Text>
                                                    )}
                                                </span>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="No upcoming appointments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* ── Clinics / Hospitals ── */}
            <Card
                title={<><BankOutlined /> My Clinics &amp; Hospitals</>}
                extra={<Link href="/doctor/schedule">Manage Schedule</Link>}
                style={{ marginBottom: 24 }}
            >
                {clinics.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {clinics.map((clinic) => (
                            <Col xs={24} sm={12} lg={8} key={clinic.id}>
                                <Card
                                    size="small"
                                    title={
                                        <span>
                                            <BankOutlined style={{ marginRight: 6 }} />
                                            {clinic.hospital_clinic_name}
                                        </span>
                                    }
                                    extra={
                                        <Badge
                                            status={clinic.is_active ? 'success' : 'error'}
                                            text={clinic.is_active ? 'Active' : 'Inactive'}
                                        />
                                    }
                                >
                                    {clinic.city?.name && (
                                        <div style={{ marginBottom: 4 }}>
                                            <EnvironmentOutlined style={{ marginRight: 4, color: '#888' }} />
                                            <Text type="secondary">{clinic.city.name}</Text>
                                        </div>
                                    )}
                                    {clinic.address && (
                                        <div style={{ marginBottom: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{clinic.address}</Text>
                                        </div>
                                    )}
                                    {clinic.consultation_fee && (
                                        <div>
                                            <Text strong>₹{clinic.consultation_fee}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}> consultation fee</Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Empty description="No clinics added yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <Link href="/doctor/schedule">
                            <Button type="primary" icon={<BankOutlined />}>Add Clinic via Schedule</Button>
                        </Link>
                    </Empty>
                )}
            </Card>

            {/* ── Quick actions ── */}
            <Card title="Quick Actions">
                <Row gutter={[12, 12]}>
                    {[
                        { href: '/doctor/profile/edit', label: 'Edit Profile', icon: <EditOutlined />, type: 'default' },
                        { href: '/doctor/appointments', label: 'My Appointments', icon: <CalendarOutlined />, type: 'default' },
                        { href: '/doctor/schedule', label: 'Manage Schedule', icon: <ClockCircleOutlined />, type: 'primary' },
                        { href: '/doctor/patients', label: 'My Patients', icon: <TeamOutlined />, type: 'default' },
                    ].map(({ href, label, icon, type }) => (
                        <Col xs={12} sm={6} key={href}>
                            <Link href={href}>
                                <Button type={type} icon={icon} block size="large">{label}</Button>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </Card>
        </AdminLayout>
    );
}

