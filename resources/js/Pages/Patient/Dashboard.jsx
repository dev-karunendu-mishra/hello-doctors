import { Card, Row, Col, Button, List, Avatar, Tag, Empty } from 'antd';
import {
    CalendarOutlined,
    MedicineBoxOutlined,
    PlusOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard({ upcomingAppointments, recentRecords, recommendedDoctors }) {
    return (
        <AdminLayout>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h1>Patient Dashboard</h1>
                    <Link href="/patient/find-doctors">
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Book Appointment
                        </Button>
                    </Link>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <span>
                                    <CalendarOutlined /> Upcoming Appointments
                                </span>
                            }
                            extra={<Link href="/patient/appointments">View All</Link>}
                        >
                            {upcomingAppointments && upcomingAppointments.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={upcomingAppointments}
                                    renderItem={(item) => (
                                        <List.Item
                                            actions={[
                                                <Tag color="blue" icon={<ClockCircleOutlined />}>
                                                    {item.status || 'Pending'}
                                                </Tag>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        icon={<MedicineBoxOutlined />}
                                                        style={{ backgroundColor: '#1890ff' }}
                                                    />
                                                }
                                                title={`Dr. ${item.doctor_name || 'Doctor Name'}`}
                                                description={
                                                    <div>
                                                        <div>
                                                            {item.date || 'TBD'} at {item.time || '00:00'}
                                                        </div>
                                                        <div style={{ color: '#999', fontSize: 12 }}>
                                                            {item.specialization || 'General Physician'}
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No upcoming appointments"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Link href="/patient/find-doctors">
                                        <Button type="primary">Book Your First Appointment</Button>
                                    </Link>
                                </Empty>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <span>
                                    <MedicineBoxOutlined /> Recent Medical Records
                                </span>
                            }
                            extra={<Link href="/patient/medical-records">View All</Link>}
                        >
                            {recentRecords && recentRecords.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={recentRecords}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<MedicineBoxOutlined />} />}
                                                title={item.title || 'Medical Record'}
                                                description={
                                                    <div>
                                                        <div>{item.description || 'No description'}</div>
                                                        <div style={{ color: '#999', fontSize: 12 }}>
                                                            {item.date || 'Date not available'}
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No medical records yet"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                        <Card title="Recommended Doctors">
                            {recommendedDoctors && recommendedDoctors.length > 0 ? (
                                <List
                                    grid={{
                                        gutter: 16,
                                        xs: 1,
                                        sm: 2,
                                        md: 3,
                                        lg: 4,
                                        xl: 4,
                                        xxl: 4,
                                    }}
                                    dataSource={recommendedDoctors}
                                    renderItem={(doctor) => (
                                        <List.Item>
                                            <Card
                                                hoverable
                                                actions={[
                                                    <Link href={`/patient/doctor/${doctor.id}`}>
                                                        <Button type="primary" size="small" block>
                                                            View Profile
                                                        </Button>
                                                    </Link>,
                                                ]}
                                            >
                                                <Card.Meta
                                                    avatar={
                                                        <Avatar
                                                            size={64}
                                                            icon={<MedicineBoxOutlined />}
                                                        />
                                                    }
                                                    title={`Dr. ${doctor.name || 'Doctor Name'}`}
                                                    description={
                                                        <div>
                                                            <div>
                                                                {doctor.specialization ||
                                                                    'General Physician'}
                                                            </div>
                                                            <div style={{ marginTop: 8 }}>
                                                                <Tag color="blue">
                                                                    {doctor.experience || '5'} years exp
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No recommended doctors available"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Link href="/patient/find-doctors">
                                        <Button type="primary">Browse All Doctors</Button>
                                    </Link>
                                </Empty>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}
