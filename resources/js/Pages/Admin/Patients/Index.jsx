import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Table, Button, Tag, Space, Card } from 'antd';
import { EyeOutlined, EditOutlined, PhoneOutlined, MailOutlined, PlusOutlined } from '@ant-design/icons';

export default function Index({ patients }) {
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
            render: (email) => (
                <Space>
                    <MailOutlined />
                    {email}
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => phone ? (
                <Space>
                    <PhoneOutlined />
                    {phone}
                </Space>
            ) : '-',
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
            title: 'Registered',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link href={route('admin.patients.show', record.id)}>
                        <Button type="primary" size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>
                    <Link href={route('admin.patients.edit', record.id)}>
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
            <Head title="Patient Management" />

            <Card 
                title="All Patients"
                extra={
                    <Link href={route('admin.patients.create')}>
                        <Button type="primary" icon={<PlusOutlined />}>
                            Add Patient
                        </Button>
                    </Link>
                }
            >
                <Table
                    columns={columns}
                    dataSource={patients.data}
                    rowKey="id"
                    pagination={{
                        total: patients.total,
                        current: patients.current_page,
                        pageSize: patients.per_page,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} patients`,
                    }}
                />
            </Card>
        </AdminLayout>
    );
}
