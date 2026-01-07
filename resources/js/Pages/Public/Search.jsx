import { Head, Link, router } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Input, Select, Pagination, Tag, Empty, Avatar, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined, MedicineBoxOutlined, PhoneOutlined, GlobalOutlined, UserOutlined, AimOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title } = Typography;

export default function Search({ auth, doctors, cities, specialties, filters }) {
    const [searchForm, setSearchForm] = useState({
        search: filters.search || '',
        city: filters.city || null,
        city_name: filters.city_name || '',
        specialty: filters.specialty || null,
        available_online: filters.available_online || false,
        sort: filters.sort || 'name',
    });
    const [citySearchText, setCitySearchText] = useState(filters.city_name || '');
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Initialize city display text on mount or when filters change
    useEffect(() => {
        if (filters.city_name) {
            setCitySearchText(filters.city_name);
            
            // Try to match with database city
            const matchedCity = cities.find(
                city => city.name.toLowerCase() === filters.city_name.toLowerCase()
            );
            if (matchedCity && !filters.city) {
                setSearchForm(prev => ({ ...prev, city: matchedCity.id }));
            }
        } else if (filters.city) {
            const city = cities.find(c => c.id === parseInt(filters.city));
            if (city) {
                setCitySearchText(city.name);
            }
        }
    }, [filters.city_name, filters.city]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        
        // Add search term
        if (searchForm.search) {
            params.append('search', searchForm.search);
        }
        
        // Use city name instead of ID for better URL readability
        if (searchForm.city) {
            // Get city name from the selected ID
            const selectedCity = cities.find(c => c.id === searchForm.city);
            if (selectedCity) {
                params.append('city_name', selectedCity.name);
            }
        } else if (citySearchText) {
            // Use custom typed city name
            params.append('city_name', citySearchText);
        }
        
        // Add specialty
        if (searchForm.specialty) {
            params.append('specialty', searchForm.specialty);
        }
        
        // Add other filters
        if (searchForm.available_online) {
            params.append('available_online', searchForm.available_online);
        }
        
        if (searchForm.sort && searchForm.sort !== 'name') {
            params.append('sort', searchForm.sort);
        }
        
        router.get(`/search?${params.toString()}`);
    };

    const handleReset = () => {
        setSearchForm({
            search: '',
            city: null,
            city_name: '',
            specialty: null,
            available_online: false,
            sort: 'name',
        });
        setCitySearchText('');
        router.get('/search');
    };

    const handleCityChange = (value, option) => {
        if (value === null || value === undefined) {
            // Clear action
            setSearchForm({
                ...searchForm, 
                city: null,
                city_name: ''
            });
            setCitySearchText('');
        } else {
            // Selection from dropdown
            setSearchForm({
                ...searchForm, 
                city: value,
                city_name: option?.children || ''
            });
            setCitySearchText(option?.children || '');
        }
    };

    const handleCitySearch = (value) => {
        setCitySearchText(value);
        
        if (!value) {
            setSearchForm({ ...searchForm, city: null, city_name: '' });
            return;
        }
        
        // If the text matches a city from database, select it
        const matchedCity = cities.find(
            city => city.name.toLowerCase() === value.toLowerCase()
        );
        if (matchedCity) {
            setSearchForm({ ...searchForm, city: matchedCity.id, city_name: value });
        } else {
            setSearchForm({ ...searchForm, city: null, city_name: value });
        }
    };

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
                    
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    
                    const detectedCity = data.address?.city || 
                                       data.address?.town || 
                                       data.address?.village || 
                                       data.address?.state_district;
                    
                    if (detectedCity) {
                        const matchedCity = cities.find(
                            city => city.name.toLowerCase() === detectedCity.toLowerCase()
                        );
                        
                        if (matchedCity) {
                            setSearchForm(prev => ({ ...prev, city: matchedCity.id, city_name: matchedCity.name }));
                            setCitySearchText(matchedCity.name);
                            message.success(`Location detected: ${matchedCity.name}`);
                        } else {
                            setSearchForm(prev => ({ ...prev, city: null, city_name: detectedCity }));
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

    return (
        <>
            <Head title="Search Doctors" />
            
            <Header auth={auth} />
            
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
                                    showSearch
                                    placeholder={
                                        <span>
                                            <EnvironmentOutlined /> {detectingLocation ? 'Detecting...' : 'Select or type city'}
                                        </span>
                                    }
                                    className="w-full"
                                    value={searchForm.city}
                                    onChange={handleCityChange}
                                    onSearch={handleCitySearch}
                                    allowClear
                                    onClear={() => {
                                        setCitySearchText('');
                                        setSearchForm({ ...searchForm, city: null, city_name: '' });
                                    }}
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            {citySearchText && !searchForm.city && (
                                                <div className="px-3 py-2 border-t text-center bg-blue-50">
                                                    <div className="text-xs text-blue-700">
                                                        <EnvironmentOutlined /> Will search for: <strong>"{citySearchText}"</strong>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    notFoundContent={
                                        <div className="text-center py-2">
                                            <p>No matching city in list</p>
                                            {citySearchText && (
                                                <>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Current: <strong>{citySearchText}</strong>
                                                    </p>
                                                    <p className="text-xs text-blue-600 mt-1">Will use this city for search</p>
                                                </>
                                            )}
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
                                                className="p-0"
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
                                {citySearchText && !searchForm.city && (
                                    <div className="text-xs text-blue-600 mt-1">
                                        <EnvironmentOutlined /> Searching in: <strong>{citySearchText}</strong>
                                    </div>
                                )}
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
            
            <Footer />
        </>
    );
}
