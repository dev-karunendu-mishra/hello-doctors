import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, Descriptions, Tag, Button, Space, Avatar, List } from 'antd';
import { EditOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';

export default function SpecialtyShow({ specialty }) {
    return (
        <AdminLayout>
            <Head title={`Specialty: ${specialty.name}`} />
            
            <div className="mb-4 flex justify-between items-center">
                <Link href="/admin/specialties">
                    <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                </Link>
                <Link href={`/admin/specialties/${specialty.id}/edit`}>
                    <Button type="primary" icon={<EditOutlined />}>Edit Specialty</Button>
                </Link>
            </div>

            <Card title={
                <Space>
                    {specialty.image_path ? (
                        <img src={`/${specialty.image_path}`} alt={specialty.name} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                    ) : specialty.icon ? (
                        <span style={{ fontSize: '24px' }}>{specialty.icon}</span>
                    ) : null}
                    <span>{specialty.name}</span>
                </Space>
            }>
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="ID">{specialty.id}</Descriptions.Item>
                    <Descriptions.Item label="Slug">{specialty.slug}</Descriptions.Item>
                    <Descriptions.Item label="Icon">{specialty.icon || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Image">
                        {specialty.image_path ? (
                            <img src={`/${specialty.image_path}`} alt={specialty.name} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                        ) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sort Order">{specialty.sort_order}</Descriptions.Item>
                    <Descriptions.Item label="Status" span={2}>
                        <Tag color={specialty.is_active ? 'green' : 'red'}>
                            {specialty.is_active ? 'Active' : 'Inactive'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Doctors" span={2}>
                        <Tag color="blue">{specialty.doctors_count}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                        {specialty.description || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">{specialty.created_at}</Descriptions.Item>
                    <Descriptions.Item label="Updated At">{specialty.updated_at}</Descriptions.Item>
                </Descriptions>
            </Card>

            {specialty.doctors && specialty.doctors.length > 0 && (
                <Card title="Recent Doctors with this Specialty" className="mt-4">
                    <List
                        itemLayout="horizontal"
                        dataSource={specialty.doctors}
                        renderItem={(doctor) => (
                            <List.Item
                                actions={[
                                    <Link href={`/admin/doctors/${doctor.id}`}>
                                        <Button type="link">View</Button>
                                    </Link>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={doctor.name}
                                    description={doctor.email}
                                />
                            </List.Item>
                        )}
                    />
                    {specialty.doctors_count > 10 && (
                        <div className="mt-2 text-center">
                            <Link href="/admin/doctors">
                                <Button type="link">View all {specialty.doctors_count} doctors</Button>
                            </Link>
                        </div>
                    )}
                </Card>
            )}
        </AdminLayout>
    );
}
