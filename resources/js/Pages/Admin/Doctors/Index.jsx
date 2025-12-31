import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Input, Select, Tag, Space, Avatar, Popconfirm } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Search } = Input;

export default function DoctorsIndex({ doctors, cities, specialties, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCity, setSelectedCity] = useState(filters.city || null);
    const [selectedSpecialty, setSelectedSpecialty] = useState(filters.specialty || null);
    const [selectedStatus, setSelectedStatus] = useState(filters.status || null);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCity) params.append('city', selectedCity);
        if (selectedSpecialty) params.append('specialty', selectedSpecialty);
        if (selectedStatus) params.append('status', selectedStatus);
        router.get(`/admin/doctors?${params.toString()}`);
    };

    const handleDelete = (id) => {
        router.delete(`/admin/doctors/${id}`, {
            onSuccess: () => {
                // Success handled by flash messages
            }
        });
    };

    const toggleVerification = (id, currentStatus) => {
        router.post(`/admin/doctors/${id}/toggle-verification`, {}, {
            preserveScroll: true,
        });
    };

    const toggleActive = (id, currentStatus) => {
        router.post(`/admin/doctors/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const columns = [
        {
            title: 'Doctor',
            key: 'doctor',
            render: (record) => (
                <Space>
                    {record.profile_image_url ? (
                        <Avatar src={record.profile_image_url} />
                    ) : (
                        <Avatar icon={<UserOutlined />} />
                    )}
                    <div>
                        <div className="font-semibold">{record.name}</div>
                        <div className="text-gray-500 text-sm">{record.user?.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Specialty',
            dataIndex: ['specialty', 'name'],
            key: 'specialty',
        },
        {
            title: 'Cities',
            key: 'cities',
            render: (record) => (
                <div>
                    {record.cities?.map(city => (
                        <Tag key={city.id}>{city.name}</Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'Experience',
            dataIndex: 'experience_years',
            key: 'experience',
            render: (years) => years ? `${years} years` : 'N/A',
        },
        {
            title: 'Status',
            key: 'status',
            render: (record) => (
                <Space direction="vertical" size="small">
                    {record.is_verified ? (
                        <Tag color="green">Verified</Tag>
                    ) : (
                        <Tag color="orange">Pending</Tag>
                    )}
                    {record.is_active ? (
                        <Tag color="blue">Active</Tag>
                    ) : (
                        <Tag color="red">Inactive</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record) => (
                <Space>
                    <Link href={`/admin/doctors/${record.id}`}>
                        <Button type="link" icon={<EyeOutlined />}>View</Button>
                    </Link>
                    <Link href={`/admin/doctors/${record.id}/edit`}>
                        <Button type="link" icon={<EditOutlined />}>Edit</Button>
                    </Link>
                    <Button 
                        type="link" 
                        icon={record.is_verified ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                        onClick={() => toggleVerification(record.id, record.is_verified)}
                    >
                        {record.is_verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button 
                        type="link" 
                        onClick={() => toggleActive(record.id, record.is_active)}
                    >
                        {record.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Popconfirm
                        title="Delete Doctor"
                        description="Are you sure you want to delete this doctor?"
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
                    Manage Doctors
                </h2>
            }
        >
            <Head title="Manage Doctors" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        {/* Filters */}
                        <div className="mb-6">
                            <Space className="w-full" direction="vertical" size="middle">
                                <Space wrap>
                                    <Search
                                        placeholder="Search by name, email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onSearch={handleSearch}
                                        style={{ width: 300 }}
                                    />
                                    <Select
                                        placeholder="Filter by City"
                                        style={{ width: 200 }}
                                        value={selectedCity}
                                        onChange={setSelectedCity}
                                        allowClear
                                    >
                                        {cities.map(city => (
                                            <Select.Option key={city.id} value={city.id}>
                                                {city.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    <Select
                                        placeholder="Filter by Specialty"
                                        style={{ width: 200 }}
                                        value={selectedSpecialty}
                                        onChange={setSelectedSpecialty}
                                        allowClear
                                    >
                                        {specialties.map(spec => (
                                            <Select.Option key={spec.id} value={spec.id}>
                                                {spec.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                    <Select
                                        placeholder="Filter by Status"
                                        style={{ width: 150 }}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        allowClear
                                    >
                                        <Select.Option value="verified">Verified</Select.Option>
                                        <Select.Option value="pending">Pending</Select.Option>
                                        <Select.Option value="active">Active</Select.Option>
                                        <Select.Option value="inactive">Inactive</Select.Option>
                                    </Select>
                                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                        Search
                                    </Button>
                                </Space>
                                <Link href="/admin/doctors/create">
                                    <Button type="primary">Add New Doctor</Button>
                                </Link>
                            </Space>
                        </div>

                        {/* Table */}
                        <Table
                            columns={columns}
                            dataSource={doctors.data}
                            rowKey="id"
                            pagination={{
                                current: doctors.current_page,
                                total: doctors.total,
                                pageSize: doctors.per_page,
                                onChange: (page) => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('page', page);
                                    router.get(`/admin/doctors?${params.toString()}`);
                                },
                            }}
                        />
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
