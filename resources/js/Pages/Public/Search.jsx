import { Head, Link, router } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Input, Select, Pagination, Tag, Empty, Avatar } from 'antd';
import { SearchOutlined, EnvironmentOutlined, MedicineBoxOutlined, PhoneOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title } = Typography;

export default function Search({ doctors, cities, specialties, filters }) {
    const [searchForm, setSearchForm] = useState({
        search: filters.search || '',
        city: filters.city || null,
        specialty: filters.specialty || null,
        available_online: filters.available_online || false,
        sort: filters.sort || 'name',
    });

    const handleSearch = () => {
        const params = new URLSearchParams();
        Object.keys(searchForm).forEach(key => {
            if (searchForm[key]) {
                params.append(key, searchForm[key]);
            }
        });
        router.get(`/search?${params.toString()}`);
    };

    const handleReset = () => {
        setSearchForm({
            search: '',
            city: null,
            specialty: null,
            available_online: false,
            sort: 'name',
        });
        router.get('/search');
    };

    return (
        <>
            <Head title="Search Doctors" />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <Title level={2} className="mb-6">Find Doctors</Title>

                    {/* Search Filters */}
                    <Card className="mb-6">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Input
                                    size="large"
                                    placeholder="Search by name, specialty..."
                                    prefix={<SearchOutlined />}
                                    value={searchForm.search}
                                    onChange={(e) => setSearchForm({...searchForm, search: e.target.value})}
                                    onPressEnter={handleSearch}
                                />
                            </Col>
                            <Col xs={24} md={5}>
                                <Select
                                    size="large"
                                    placeholder="Select City"
                                    className="w-full"
                                    value={searchForm.city}
                                    onChange={(value) => setSearchForm({...searchForm, city: value})}
                                    allowClear
                                >
                                    {cities.map(city => (
                                        <Select.Option key={city.id} value={city.id}>
                                            {city.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} md={5}>
                                <Select
                                    size="large"
                                    placeholder="Select Specialty"
                                    className="w-full"
                                    value={searchForm.specialty}
                                    onChange={(value) => setSearchForm({...searchForm, specialty: value})}
                                    allowClear
                                >
                                    {specialties.map(spec => (
                                        <Select.Option key={spec.id} value={spec.id}>
                                            {spec.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} md={3}>
                                <Select
                                    size="large"
                                    placeholder="Sort"
                                    className="w-full"
                                    value={searchForm.sort}
                                    onChange={(value) => setSearchForm({...searchForm, sort: value})}
                                >
                                    <Select.Option value="name">Name</Select.Option>
                                    <Select.Option value="experience">Experience</Select.Option>
                                    <Select.Option value="fee">Fee</Select.Option>
                                </Select>
                            </Col>
                            <Col xs={24} md={3}>
                                <Button type="primary" size="large" block onClick={handleSearch}>
                                    <SearchOutlined /> Search
                                </Button>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <Button onClick={handleReset}>Reset Filters</Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Results */}
                    {doctors.data.length === 0 ? (
                        <Card>
                            <Empty 
                                description="No doctors found. Try adjusting your search criteria."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </Card>
                    ) : (
                        <>
                            <div className="mb-4 text-gray-600">
                                Found {doctors.total} doctors
                            </div>

                            <Row gutter={[16, 16]}>
                                {doctors.data.map(doctor => (
                                    <Col xs={24} key={doctor.id}>
                                        <Card hoverable>
                                            <Row gutter={16}>
                                                <Col xs={24} sm={6} md={4}>
                                                    {doctor.image ? (
                                                        <Avatar size={120} src={doctor.image} />
                                                    ) : (
                                                        <Avatar size={120} icon={<UserOutlined />} />
                                                    )}
                                                </Col>
                                                <Col xs={24} sm={18} md={20}>
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <Title level={4} className="mb-2">{doctor.name}</Title>
                                                            <div className="mb-2">
                                                                <Tag color="blue" icon={<MedicineBoxOutlined />}>
                                                                    {doctor.specialty}
                                                                </Tag>
                                                                {doctor.is_available_online && (
                                                                    <Tag color="green">Online Consultation</Tag>
                                                                )}
                                                            </div>
                                                            {doctor.experience_years && (
                                                                <div className="text-gray-600 mb-1">
                                                                    Experience: {doctor.experience_years} years
                                                                </div>
                                                            )}
                                                            {doctor.consultation_fee && (
                                                                <div className="text-gray-600 mb-1">
                                                                    Fee: ₹{doctor.consultation_fee}
                                                                </div>
                                                            )}
                                                            <div className="text-gray-600 mb-2">
                                                                <EnvironmentOutlined /> {doctor.cities.map(c => c.name).join(', ')}
                                                            </div>
                                                            <div className="text-gray-700 mb-3">
                                                                {doctor.bio}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link href={`/doctors/${doctor.id}`}>
                                                            <Button type="primary">View Full Profile</Button>
                                                        </Link>
                                                        {doctor.website && (
                                                            <Button 
                                                                icon={<GlobalOutlined />}
                                                                href={doctor.website}
                                                                target="_blank"
                                                            >
                                                                Website
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination */}
                            <div className="mt-6 flex justify-center">
                                <Pagination
                                    current={doctors.current_page}
                                    total={doctors.total}
                                    pageSize={doctors.per_page}
                                    onChange={(page) => {
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('page', page);
                                        router.get(`/search?${params.toString()}`);
                                    }}
                                    showSizeChanger={false}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
