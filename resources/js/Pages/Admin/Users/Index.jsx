import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Table, Button, Tag, Space, Card } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

export default function Index({ users }) {
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                const colors = {
                    super_admin: 'red',
                    doctor: 'blue',
                    patient: 'green',
                };
                return <Tag color={colors[role]}>{role.replace('_', ' ').toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link href={route('admin.users.show', record.id)}>
                        <Button type="primary" size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>
                    <Link href={route('admin.users.edit', record.id)}>
                        <Button size="small" icon={<EditOutlined />}>
                            Edit
                        </Button>
                    </Link>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="User Management" />

            <Card
                title="All Users"
                extra={
                    <Link href={route('admin.users.create')}>
                        <Button type="primary" icon={<PlusOutlined />}>
                            Add User
                        </Button>
                    </Link>
                }
            >
                <Table
                    columns={columns}
                    dataSource={users.data}
                    rowKey="id"
                    pagination={{
                        total: users.total,
                        current: users.current_page,
                        pageSize: users.per_page,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} users`,
                    }}
                />
            </Card>
        </AdminLayout>
    );
}
