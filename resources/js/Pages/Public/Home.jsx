import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Input, Select, Statistic, message } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, EnvironmentOutlined, UserOutlined, AimOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;
const { Search } = Input;

export default function Home({ auth, cities, specialties, featuredDoctors, stats }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState(null);
    const [citySearchText, setCitySearchText] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Auto-detect user location on component mount
    useEffect(() => {
        detectUserLocation();
    }, []);

    const detectUserLocation = async () => {
        setDetectingLocation(true);
        
        if (!navigator.geolocation) {
            message.info('Geolocation is not supported by your browser');
            setDetectingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Use reverse geocoding to get city name
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    
                    const detectedCity = data.address?.city || 
                                       data.address?.town || 
                                       data.address?.village || 
                                       data.address?.state_district;
                    
                    if (detectedCity) {
                        // Try to match with database cities
                        const matchedCity = cities.find(
                            city => city.name.toLowerCase() === detectedCity.toLowerCase()
                        );
                        
                        if (matchedCity) {
                            setSelectedCity(matchedCity.id);
                            setCitySearchText(''); // Clear custom text for DB cities
                            message.success(`Location detected: ${matchedCity.name}`);
                        } else {
                            // If not in database, set as custom text
                            setSelectedCity(null);
                            setCitySearchText(detectedCity);
                            message.success(`Location detected: ${detectedCity}`);
                        }
                    }
                } catch (error) {
                    console.error('Error getting location name:', error);
                    message.error('Could not detect your city');
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    message.warning('Location access denied. Please select city manually.');
                } else {
                    message.error('Could not detect your location');
                }
                setDetectingLocation(false);
            }
        );
    };

    const handleCityChange = (value, option) => {
        setSelectedCity(value);
        setCitySearchText(''); // Clear custom text when selecting from dropdown
    };

    const handleCitySearch = (value) => {
        setCitySearchText(value);
        // If the text matches a city from database, select it
        const matchedCity = cities.find(
            city => city.name.toLowerCase() === value.toLowerCase()
        );
        if (matchedCity) {
            setSelectedCity(matchedCity.id);
        } else {
            setSelectedCity(null);
        }
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        
        // Use city name instead of ID for better URL readability
        if (selectedCity) {
            // Get city name from the selected ID
            const selectedCityObj = cities.find(c => c.id === selectedCity);
            if (selectedCityObj) {
                params.append('city_name', selectedCityObj.name);
            }
        } else if (citySearchText) {
            // Use custom typed city name
            params.append('city_name', citySearchText);
        }
        
        window.location.href = `/search?${params.toString()}`;
    };

    return (
        <>
            <Head title="Hello Doctors - Find Best Doctors" />
            
            {/* Header */}
            <Header auth={auth} />
            
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
                                            showSearch
                                            placeholder={
                                                <span>
                                                    <EnvironmentOutlined /> {detectingLocation ? 'Detecting...' : 'Select or type city'}
                                                </span>
                                            }
                                            className="w-full"
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                            onSearch={handleCitySearch}
                                            searchValue={!selectedCity ? citySearchText : undefined}
                                            allowClear
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            notFoundContent={
                                                <div className="text-center py-2">
                                                    <p>City not in list?</p>
                                                    <p className="text-xs text-gray-500">Just type and press Enter</p>
                                                </div>
                                            }
                                            suffixIcon={
                                                detectingLocation ? (
                                                    <AimOutlined spin />
                                                ) : (
                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        icon={<AimOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            detectUserLocation();
                                                        }}
                                                        title="Detect my location"
                                                    />
                                                )
                                            }
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
                                            {specialty.image_url ? (
                                                <img 
                                                    src={specialty.image_url} 
                                                    alt={specialty.name}
                                                    style={{ width: 48, height: 48, margin: '0 auto', objectFit: 'contain' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <div style={{ display: specialty.image_url ? 'none' : 'block' }}>
                                                {specialty.icon ? (
                                                    <span style={{ fontSize: 32 }}>{specialty.icon}</span>
                                                ) : (
                                                    <MedicineBoxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                                )}
                                            </div>
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
                                    <Link href={`/search?city_name=${city.name}`}>
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

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
