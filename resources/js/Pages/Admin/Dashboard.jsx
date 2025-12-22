import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
    UserOutlined,
    MedicineBoxOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard({ stats, recentAppointments, recentUsers }) {
    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Patient',
            dataIndex: 'patient',
            key: 'patient',
        },
        {
            title: 'Doctor',
            dataIndex: 'doctor',
            key: 'doctor',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    pending: 'orange',
                    confirmed: 'blue',
                    completed: 'green',
                    cancelled: 'red',
                };
                return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
            },
        },
    ];

    return (
        <AdminLayout>
            <div>
                <h1 style={{ marginBottom: 24 }}>Super Admin Dashboard</h1>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Users"
                                value={stats?.totalUsers || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Doctors"
                                value={stats?.totalDoctors || 0}
                                prefix={<MedicineBoxOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Appointments"
                                value={stats?.totalAppointments || 0}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Completed Today"
                                value={stats?.completedToday || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={16}>
                        <Card title="Recent Appointments">
                            <Table
                                columns={columns}
                                dataSource={recentAppointments || []}
                                pagination={{ pageSize: 5 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Recent Users">
                            <div style={{ maxHeight: 400, overflow: 'auto' }}>
                                {(recentUsers || []).map((user, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                        <div style={{ fontSize: 12, color: '#999' }}>
                                            {user.email}
                                        </div>
                                        <Tag
                                            style={{ marginTop: 4 }}
                                            color={
                                                user.role === 'doctor'
                                                    ? 'blue'
                                                    : user.role === 'patient'
                                                    ? 'green'
                                                    : 'gold'
                                            }
                                        >
                                            {user.role?.replace('_', ' ')}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}
