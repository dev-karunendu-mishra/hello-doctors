import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, Descriptions, Tag, Button, Space, Avatar } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';

export default function Show({ patient }) {
    return (
        <AdminLayout>
            <Head title={`${patient.name} - Patient Details`} />

            <div className="mb-4">
                <Space>
                    <Link href={route('admin.patients.index')}>
                        <Button icon={<ArrowLeftOutlined />}>Back to Patients</Button>
                    </Link>
                    <Link href={route('admin.patients.edit', patient.id)}>
                        <Button type="primary" icon={<EditOutlined />}>
                            Edit Patient
                        </Button>
                    </Link>
                </Space>
            </div>

            <Card title="Patient Information">
                <div className="mb-4 text-center">
                    <Avatar size={100} icon={<UserOutlined />} />
                </div>

                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Name">{patient.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{patient.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">
                        {patient.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={patient.is_active ? 'green' : 'red'}>
                            {patient.is_active ? 'Active' : 'Inactive'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email Verified">
                        <Tag color={patient.email_verified_at ? 'green' : 'orange'}>
                            {patient.email_verified_at ? 'Verified' : 'Not Verified'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Registered">
                        {new Date(patient.created_at).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                        {new Date(patient.updated_at).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </AdminLayout>
    );
}
