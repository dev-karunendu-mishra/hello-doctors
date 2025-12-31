import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Input, Select, Statistic } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Paragraph } = Typography;
const { Search } = Input;

export default function Home({ cities, specialties, featuredDoctors, stats }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState(null);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCity) params.append('city', selectedCity);
        window.location.href = `/search?${params.toString()}`;
    };

    return (
        <>
            <Head title="Hello Doctors - Find Best Doctors" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <Title level={1} className="text-white mb-4">
                                Find the Best Doctors Near You
                            </Title>
                            <Paragraph className="text-xl text-blue-100 mb-8">
                                Connect with verified healthcare professionals across multiple cities
                            </Paragraph>

                            {/* Search Bar */}
                            <Card className="shadow-2xl">
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Input
                                            size="large"
                                            placeholder="Search by doctor name, specialty..."
                                            prefix={<SearchOutlined />}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onPressEnter={handleSearch}
                                        />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Select
                                            size="large"
                                            placeholder="Select City"
                                            className="w-full"
                                            onChange={setSelectedCity}
                                            allowClear
                                        >
                                            {cities.map(city => (
                                                <Select.Option key={city.id} value={city.id}>
                                                    {city.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col xs={24} md={4}>
                                        <Button 
                                            type="primary" 
                                            size="large" 
                                            block
                                            onClick={handleSearch}
                                            icon={<SearchOutlined />}
                                        >
                                            Search
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <Row gutter={24} justify="center">
                            <Col xs={24} sm={8} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Verified Doctors" 
                                        value={stats.total_doctors}
                                        prefix={<UserOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Cities Covered" 
                                        value={stats.total_cities}
                                        prefix={<EnvironmentOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Specialties" 
                                        value={stats.total_specialties}
                                        prefix={<MedicineBoxOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Specialties */}
                <div className="py-12">
                    <div className="container mx-auto px-4">
                        <Title level={2} className="text-center mb-8">
                            Browse by Specialty
                        </Title>
                        <Row gutter={[16, 16]}>
                            {specialties.map(specialty => (
                                <Col xs={12} sm={8} md={6} lg={4} key={specialty.id}>
                                    <Link href={`/search?specialty=${specialty.id}`}>
                                        <Card 
                                            hoverable 
                                            className="text-center"
                                            bodyStyle={{ padding: '20px 10px' }}
                                        >
                                            <MedicineBoxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                            <div className="mt-2 font-medium">{specialty.name}</div>
                                            <div className="text-gray-500 text-sm">{specialty.doctors_count} doctors</div>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* Featured Doctors */}
                {featuredDoctors.length > 0 && (
                    <div className="py-12 bg-white">
                        <div className="container mx-auto px-4">
                            <Title level={2} className="text-center mb-8">
                                Featured Doctors
                            </Title>
                            <Row gutter={[16, 16]}>
                                {featuredDoctors.map(doctor => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                                        <Card
                                            hoverable
                                            cover={
                                                doctor.image ? (
                                                    <img alt={doctor.name} src={doctor.image} className="h-48 object-cover" />
                                                ) : (
                                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                                        <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
                                                    </div>
                                                )
                                            }
                                        >
                                            <Card.Meta
                                                title={doctor.name}
                                                description={
                                                    <>
                                                        <div className="text-blue-600 font-medium">{doctor.specialty}</div>
                                                        <div className="text-gray-500 text-sm mt-1">{doctor.cities}</div>
                                                        <div className="text-gray-600 text-sm mt-2">{doctor.bio}</div>
                                                    </>
                                                }
                                            />
                                            <Link href={`/doctors/${doctor.id}`}>
                                                <Button type="primary" block className="mt-4">
                                                    View Profile
                                                </Button>
                                            </Link>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </div>
                )}

                {/* Cities */}
                <div className="py-12">
                    <div className="container mx-auto px-4">
                        <Title level={2} className="text-center mb-8">
                            Find Doctors by City
                        </Title>
                        <Row gutter={[16, 16]}>
                            {cities.map(city => (
                                <Col xs={12} sm={8} md={6} key={city.id}>
                                    <Link href={`/search?city=${city.id}`}>
                                        <Card hoverable className="text-center">
                                            <EnvironmentOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                            <div className="mt-2 font-medium">{city.name}</div>
                                            <div className="text-gray-500 text-sm">{city.doctors_count} doctors</div>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-blue-600 text-white py-16">
                    <div className="container mx-auto px-4 text-center">
                        <Title level={2} className="text-white mb-4">
                            Are you a doctor?
                        </Title>
                        <Paragraph className="text-xl text-blue-100 mb-6">
                            Join our network and connect with patients across multiple cities
                        </Paragraph>
                        <Link href="/register-doctor">
                            <Button type="default" size="large">
                                Register as Doctor
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
