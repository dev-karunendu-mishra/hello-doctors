import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, Descriptions, Tag, Button, Space, Avatar } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';

export default function Show({ user }) {
    return (
        <AdminLayout>
            <Head title={`${user.name} - User Details`} />

            <div className="mb-4">
                <Space>
                    <Link href={route('admin.users.index')}>
                        <Button icon={<ArrowLeftOutlined />}>Back to Users</Button>
                    </Link>
                    <Link href={route('admin.users.edit', user.id)}>
                        <Button type="primary" icon={<EditOutlined />}>
                            Edit User
                        </Button>
                    </Link>
                </Space>
            </div>

            <Card title="User Information">
                <div className="mb-4 text-center">
                    <Avatar size={100} icon={<UserOutlined />} />
                </div>

                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">
                        {user.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                        <Tag color={
                            user.role === 'super_admin' ? 'red' :
                            user.role === 'doctor' ? 'blue' : 'green'
                        }>
                            {user.role.replace('_', ' ').toUpperCase()}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={user.is_active ? 'green' : 'red'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email Verified">
                        <Tag color={user.email_verified_at ? 'green' : 'orange'}>
                            {user.email_verified_at ? 'Verified' : 'Not Verified'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                        {new Date(user.created_at).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated At">
                        {new Date(user.updated_at).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {user.role === 'doctor' && user.doctor_profile && (
                <Card title="Doctor Information" className="mt-4">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Specialty">
                            {user.doctor_profile.specialty?.name || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Qualification">
                            {user.doctor_profile.qualification || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Experience">
                            {user.doctor_profile.experience_years ? 
                                `${user.doctor_profile.experience_years} years` : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Consultation Fee">
                            {user.doctor_profile.consultation_fee ? 
                                `₹${user.doctor_profile.consultation_fee}` : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cities">
                            {user.doctor_profile.cities?.map(city => (
                                <Tag key={city.id}>{city.name}</Tag>
                            )) || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Verified">
                            <Tag color={user.doctor_profile.is_verified ? 'green' : 'orange'}>
                                {user.doctor_profile.is_verified ? 'Verified' : 'Pending'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </AdminLayout>
    );
}
