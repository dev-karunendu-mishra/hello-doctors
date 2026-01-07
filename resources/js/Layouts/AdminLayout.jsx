import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    TeamOutlined,
    CalendarOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children }) {
    const { auth, url } = usePage().props;
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState(['dashboard']);
    const [openKeys, setOpenKeys] = useState([]);

    // Determine selected menu based on current URL
    useEffect(() => {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/admin/dashboard')) {
            setSelectedKeys(['dashboard']);
        } else if (currentPath.includes('/admin/users')) {
            setSelectedKeys(['all-users']);
            setOpenKeys(['users']);
        } else if (currentPath.includes('/admin/doctors')) {
            setSelectedKeys(['doctors']);
            setOpenKeys(['users']);
        } else if (currentPath.includes('/admin/patients')) {
            setSelectedKeys(['patients']);
            setOpenKeys(['users']);
        } else if (currentPath.includes('/admin/specialties')) {
            setSelectedKeys(['specialties']);
        } else if (currentPath.includes('/admin/appointments')) {
            setSelectedKeys(['appointments']);
        } else if (currentPath.includes('/admin/settings')) {
            setSelectedKeys(['settings']);
        } else if (currentPath.includes('/doctor/appointments')) {
            setSelectedKeys(['my-appointments']);
        } else if (currentPath.includes('/doctor/patients')) {
            setSelectedKeys(['my-patients']);
        } else if (currentPath.includes('/doctor/schedule')) {
            setSelectedKeys(['schedule']);
        } else if (currentPath.includes('/patient/find-doctors')) {
            setSelectedKeys(['find-doctors']);
        } else if (currentPath.includes('/patient/appointments')) {
            setSelectedKeys(['my-appointments']);
        } else if (currentPath.includes('/patient/medical-records')) {
            setSelectedKeys(['medical-records']);
        }
    }, [url]);

    // Menu items based on user role
    const getMenuItems = () => {
        const user = auth.user;
        
        const commonItems = [
            {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: <Link href="/admin/dashboard">Dashboard</Link>,
            },
        ];

        if (user.role === 'super_admin') {
            return [
                ...commonItems,
                {
                    key: 'users',
                    icon: <TeamOutlined />,
                    label: 'User Management',
                    children: [
                        {
                            key: 'all-users',
                            label: <Link href="/admin/users">All Users</Link>,
                        },
                        {
                            key: 'doctors',
                            label: <Link href="/admin/doctors">Doctors</Link>,
                        },
                        {
                            key: 'patients',
                            label: <Link href="/admin/patients">Patients</Link>,
                        },
                    ],
                },
                {
                    key: 'specialties',
                    icon: <MedicineBoxOutlined />,
                    label: <Link href="/admin/specialties">Specialties</Link>,
                },
                {
                    key: 'appointments',
                    icon: <CalendarOutlined />,
                    label: <Link href="/admin/appointments">Appointments</Link>,
                },
                {
                    key: 'settings',
                    icon: <SettingOutlined />,
                    label: <Link href="/admin/settings">Settings</Link>,
                },
            ];
        }

        if (user.role === 'doctor') {
            return [
                ...commonItems,
                {
                    key: 'my-appointments',
                    icon: <CalendarOutlined />,
                    label: <Link href="/doctor/appointments">My Appointments</Link>,
                },
                {
                    key: 'my-patients',
                    icon: <UserOutlined />,
                    label: <Link href="/doctor/patients">My Patients</Link>,
                },
                {
                    key: 'schedule',
                    icon: <MedicineBoxOutlined />,
                    label: <Link href="/doctor/schedule">Schedule</Link>,
                },
            ];
        }

        if (user.role === 'patient') {
            return [
                ...commonItems,
                {
                    key: 'find-doctors',
                    icon: <MedicineBoxOutlined />,
                    label: <Link href="/patient/find-doctors">Find Doctors</Link>,
                },
                {
                    key: 'my-appointments',
                    icon: <CalendarOutlined />,
                    label: <Link href="/patient/appointments">My Appointments</Link>,
                },
                {
                    key: 'medical-records',
                    icon: <MedicineBoxOutlined />,
                    label: <Link href="/patient/medical-records">Medical Records</Link>,
                },
            ];
        }

        return commonItems;
    };

    const userMenuItems = [
        {
            key: 'profile',
            label: <Link href="/profile">Profile</Link>,
            icon: <UserOutlined />,
        },
        {
            key: 'settings',
            label: <Link href="/profile">Settings</Link>,
            icon: <SettingOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: <Link href="/logout" method="post" as="button">Logout</Link>,
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: collapsed ? 16 : 20,
                        fontWeight: 'bold',
                    }}
                >
                    {collapsed ? '🏥' : '🏥 HelloDoctors'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={setOpenKeys}
                    items={getMenuItems()}
                />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f0f0f0',
                    }}
                >
                    <div>
                        {collapsed ? (
                            <MenuUnfoldOutlined
                                style={{ fontSize: 18, cursor: 'pointer' }}
                                onClick={() => setCollapsed(!collapsed)}
                            />
                        ) : (
                            <MenuFoldOutlined
                                style={{ fontSize: 18, cursor: 'pointer' }}
                                onClick={() => setCollapsed(!collapsed)}
                            />
                        )}
                    </div>

                    <Space size={24}>
                        <Badge count={5}>
                            <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
                        </Badge>

                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar icon={<UserOutlined />} />
                                <span>{auth.user.name}</span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: '#999',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    ({auth.user.role?.replace('_', ' ')})
                                </span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>

                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: '#fff',
                        borderRadius: 8,
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
