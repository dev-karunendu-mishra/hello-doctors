import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Tag, Space, Input, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Search } = Input;

export default function SpecialtiesIndex({ specialties, filters }) {
    const [searchText, setSearchText] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    const handleSearch = (value) => {
        router.get('/admin/specialties', {
            search: value,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        router.get('/admin/specialties', {
            search: searchText,
            status: value !== 'all' ? value : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        router.delete(`/admin/specialties/${id}`, {
            onSuccess: () => {
                // Success handled by flash message
            },
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    {record.image_path ? (
                        <img src={`/${record.image_path}`} alt={text} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    ) : record.icon ? (
                        <span style={{ fontSize: '24px' }}>{record.icon}</span>
                    ) : null}
                    <strong>{text}</strong>
                </Space>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '-',
        },
        {
            title: 'Doctors',
            dataIndex: 'doctors_count',
            key: 'doctors_count',
            render: (count) => <Tag color="blue">{count}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (is_active) => (
                <Tag color={is_active ? 'green' : 'red'}>
                    {is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Sort Order',
            dataIndex: 'sort_order',
            key: 'sort_order',
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link href={`/admin/specialties/${record.id}`}>
                        <Button type="default" icon={<EyeOutlined />} size="small">
                            View
                        </Button>
                    </Link>
                    <Link href={`/admin/specialties/${record.id}/edit`}>
                        <Button type="primary" icon={<EditOutlined />} size="small">
                            Edit
                        </Button>
                    </Link>
                    <Popconfirm
                        title="Delete Specialty"
                        description={`Are you sure you want to delete "${record.name}"?`}
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        disabled={record.doctors_count > 0}
                    >
                        <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                            disabled={record.doctors_count > 0}
                            title={record.doctors_count > 0 ? 'Cannot delete specialty with assigned doctors' : ''}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Manage Specialties" />
            
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Manage Specialties</h2>
                <Link href="/admin/specialties/create">
                    <Button type="primary" icon={<PlusOutlined />}>
                        Add Specialty
                    </Button>
                </Link>
            </div>

            <Card>
                <div className="mb-4 flex gap-4">
                    <Search
                        placeholder="Search specialties..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={handleSearch}
                        style={{ flex: 1 }}
                    />
                    <Select
                        size="large"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                        style={{ width: 150 }}
                    >
                        <Select.Option value="all">All Status</Select.Option>
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="inactive">Inactive</Select.Option>
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={specialties.data}
                    rowKey="id"
                    pagination={{
                        current: specialties.current_page,
                        pageSize: specialties.per_page,
                        total: specialties.total,
                        showSizeChanger: false,
                        showTotal: (total) => `Total ${total} specialties`,
                        onChange: (page) => {
                            router.get('/admin/specialties', {
                                page,
                                search: searchText,
                                status: statusFilter !== 'all' ? statusFilter : undefined,
                            }, {
                                preserveState: true,
                                replace: true,
                            });
                        },
                    }}
                />
            </Card>
        </AdminLayout>
    );
}
