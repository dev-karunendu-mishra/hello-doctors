import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Tag, Space, Popconfirm, Image } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';

export default function AdvertisementsIndex({ advertisements }) {
    const handleDelete = (id) => {
        router.delete(`/admin/advertisements/${id}`);
    };

    const columns = [
        {
            title: 'Image',
            key: 'image',
            render: (record) => (
                record.image_url ? (
                    <Image src={record.image_url} width={100} />
                ) : (
                    <div className="text-gray-400">No image</div>
                )
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Position',
            dataIndex: 'position',
            key: 'position',
            render: (position) => (
                <Tag color="blue">{position}</Tag>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (record) => {
                const today = new Date();
                const startDate = new Date(record.start_date);
                const endDate = record.end_date ? new Date(record.end_date) : null;
                
                if (!record.is_active) {
                    return <Tag color="red">Inactive</Tag>;
                }
                if (today < startDate) {
                    return <Tag color="orange">Scheduled</Tag>;
                }
                if (endDate && today > endDate) {
                    return <Tag color="default">Expired</Tag>;
                }
                return <Tag color="green">Active</Tag>;
            },
        },
        {
            title: 'Dates',
            key: 'dates',
            render: (record) => (
                <div>
                    <div>Start: {new Date(record.start_date).toLocaleDateString()}</div>
                    {record.end_date && (
                        <div>End: {new Date(record.end_date).toLocaleDateString()}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Clicks',
            dataIndex: 'click_count',
            key: 'clicks',
        },
        {
            title: 'Sort Order',
            dataIndex: 'sort_order',
            key: 'sort_order',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record) => (
                <Space>
                    {record.link_url && (
                        <Button 
                            type="link" 
                            icon={<EyeOutlined />}
                            href={record.link_url}
                            target="_blank"
                        >
                            View
                        </Button>
                    )}
                    <Link href={`/admin/advertisements/${record.id}/edit`}>
                        <Button type="link" icon={<EditOutlined />}>Edit</Button>
                    </Link>
                    <Popconfirm
                        title="Delete Advertisement"
                        description="Are you sure you want to delete this advertisement?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Manage Advertisements
                </h2>
            }
        >
            <Head title="Manage Advertisements" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <div className="mb-6">
                            <Link href="/admin/advertisements/create">
                                <Button type="primary" icon={<PlusOutlined />}>
                                    Add New Advertisement
                                </Button>
                            </Link>
                        </div>

                        <Table
                            columns={columns}
                            dataSource={advertisements.data}
                            rowKey="id"
                            pagination={{
                                current: advertisements.current_page,
                                total: advertisements.total,
                                pageSize: advertisements.per_page,
                                onChange: (page) => {
                                    router.get(`/admin/advertisements?page=${page}`);
                                },
                            }}
                        />
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
