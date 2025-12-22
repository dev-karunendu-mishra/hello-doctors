import { Card, Row, Col, Statistic, Calendar, Badge, List, Avatar } from 'antd';
import {
    CalendarOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard({ stats, todayAppointments, upcomingAppointments }) {
    const getListData = (value) => {
        // This would be populated with actual appointment data
        return [];
    };

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {listData.map((item) => (
                    <li key={item.content}>
                        <Badge status={item.type} text={item.content} />
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <AdminLayout>
            <div>
                <h1 style={{ marginBottom: 24 }}>Doctor Dashboard</h1>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Today's Appointments"
                                value={stats?.todayAppointments || 0}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Patients"
                                value={stats?.totalPatients || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Pending"
                                value={stats?.pendingAppointments || 0}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Completed"
                                value={stats?.completedAppointments || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={14}>
                        <Card title="Calendar">
                            <Calendar
                                dateCellRender={dateCellRender}
                                style={{ border: 'none' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                        <Card title="Today's Appointments" style={{ marginBottom: 16 }}>
                            <List
                                itemLayout="horizontal"
                                dataSource={todayAppointments || []}
                                locale={{ emptyText: 'No appointments today' }}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} />}
                                            title={item.patient_name || 'Patient Name'}
                                            description={`${item.time || '00:00'} - ${
                                                item.reason || 'General Checkup'
                                            }`}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>

                        <Card title="Upcoming Appointments">
                            <List
                                itemLayout="horizontal"
                                dataSource={upcomingAppointments || []}
                                locale={{ emptyText: 'No upcoming appointments' }}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} />}
                                            title={item.patient_name || 'Patient Name'}
                                            description={`${item.date || 'TBD'} at ${
                                                item.time || '00:00'
                                            }`}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}
