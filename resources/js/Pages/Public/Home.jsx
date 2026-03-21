import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Button, Input, Select, Statistic, message } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, EnvironmentOutlined, UserOutlined, AimOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;
const { Search } = Input;

export default function Home({ auth, site, seo, cities, specialties, featuredDoctors, stats }) {
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

    // Priority: meta_title > (site_name + site_tagline) > default
    const pageTitle = seo?.meta_title || (site?.name && site?.tagline ? `${site.name} - ${site.tagline}` : "Hello Doctors - Find Best Doctors");
    const pageDescription = seo?.meta_description || "Find and connect with verified healthcare professionals across Uttar Pradesh. Search by specialty, city, or doctor name. Book appointments with experienced doctors.";
    const pageKeywords = seo?.meta_keywords || "doctors, healthcare, medical professionals, find doctors, appointments, Uttar Pradesh, specialties, verified doctors";
    const ogTitle = seo?.og_title || pageTitle;
    const ogDescription = seo?.og_description || pageDescription;

    return (
        <>
            <Head title={pageTitle}>
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={pageKeywords} />
                <meta name="author" content={seo?.meta_author || site?.name || "Hello Doctors"} />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={seo?.app_url || window.location.href} />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={ogDescription} />
                {seo?.og_image && <meta property="og:image" content={seo.og_image} />}
                
                {/* Twitter */}
                <meta name="twitter:card" content={seo?.twitter_card || "summary_large_image"} />
                <meta name="twitter:url" content={seo?.app_url || window.location.href} />
                <meta name="twitter:title" content={ogTitle} />
                <meta name="twitter:description" content={ogDescription} />
                {seo?.twitter_site && <meta name="twitter:site" content={seo.twitter_site} />}
                {seo?.og_image && <meta name="twitter:image" content={seo.og_image} />}
                
                <link rel="canonical" href={seo?.app_url || window.location.origin} />
            </Head>
            
            {/* Header */}
            <Header auth={auth} />
            
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Hero Section - Modern Design */}
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
                    {/* Animated Background Shapes */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="relative container mx-auto px-4 py-24 lg:py-32">
                        <div className="max-w-5xl mx-auto">
                            {/* Hero Content */}
                            <div className="text-center mb-12 animate-fade-in">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                    Find the Best Doctors
                                    <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mt-2">
                                        Near You
                                    </span>
                                </h1>
                                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto font-light">
                                    Connect with verified healthcare professionals across multiple cities
                                </p>
                            </div>

                            {/* Enhanced Search Bar */}
                            <Card 
                                className="shadow-2xl backdrop-blur-sm bg-white/95 border-0 rounded-2xl overflow-hidden"
                                bodyStyle={{ padding: '32px' }}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={11}>
                                        <div className="relative">
                                            <Input
                                                size="large"
                                                placeholder="Search doctor name, specialty..."
                                                prefix={<SearchOutlined className="text-blue-500 text-lg" />}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onPressEnter={handleSearch}
                                                className="rounded-xl border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-all"
                                                style={{ height: '52px', fontSize: '16px' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} md={9}>
                                        <Select
                                            size="large"
                                            showSearch
                                            placeholder={
                                                <span className="flex items-center gap-2">
                                                    <EnvironmentOutlined className="text-green-500" /> 
                                                    {detectingLocation ? 'Detecting location...' : 'Select or type city'}
                                                </span>
                                            }
                                            className="w-full rounded-xl"
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                            onSearch={handleCitySearch}
                                            searchValue={!selectedCity ? citySearchText : undefined}
                                            allowClear
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            notFoundContent={
                                                <div className="text-center py-4">
                                                    <p className="text-gray-600 font-medium">City not in list?</p>
                                                    <p className="text-xs text-gray-400 mt-1">Just type and press Enter</p>
                                                </div>
                                            }
                                            suffixIcon={
                                                detectingLocation ? (
                                                    <AimOutlined spin className="text-blue-500" />
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
                                                        className="text-blue-500 hover:text-blue-600"
                                                    />
                                                )
                                            }
                                            style={{ height: '52px' }}
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
                                            className="h-[52px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl transition-all font-semibold text-base"
                                        >
                                            Search
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    </div>

                    {/* Wave Separator */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="currentColor" className="text-gray-50"/>
                        </svg>
                    </div>
                </div>

                {/* Statistics - Modern Design */}
                <div className="py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <Row gutter={[32, 32]} justify="center">
                            <Col xs={24} sm={8} md={8}>
                                <Card 
                                    className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl group hover:-translate-y-2"
                                    bodyStyle={{ padding: '40px 24px' }}
                                >
                                    <div className="mb-4">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                            <UserOutlined className="text-white text-3xl" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-gray-800 mb-2">
                                        {stats.total_doctors.toLocaleString()}
                                    </div>
                                    <div className="text-gray-600 font-medium text-lg">Verified Doctors</div>
                                    <div className="mt-3 text-sm text-blue-600 font-medium">Ready to help you</div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8} md={8}>
                                <Card 
                                    className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl group hover:-translate-y-2"
                                    bodyStyle={{ padding: '40px 24px' }}
                                >
                                    <div className="mb-4">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                            <EnvironmentOutlined className="text-white text-3xl" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-gray-800 mb-2">
                                        {stats.total_cities.toLocaleString()}
                                    </div>
                                    <div className="text-gray-600 font-medium text-lg">Cities Covered</div>
                                    <div className="mt-3 text-sm text-green-600 font-medium">Across India</div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8} md={8}>
                                <Card 
                                    className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl group hover:-translate-y-2"
                                    bodyStyle={{ padding: '40px 24px' }}
                                >
                                    <div className="mb-4">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                            <MedicineBoxOutlined className="text-white text-3xl" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-gray-800 mb-2">
                                        {stats.total_specialties.toLocaleString()}
                                    </div>
                                    <div className="text-gray-600 font-medium text-lg">Specialties</div>
                                    <div className="mt-3 text-sm text-purple-600 font-medium">Expert care</div>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Specialties - Modern Design */}
                <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                Browse by Specialty
                            </h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Find the right specialist for your healthcare needs
                            </p>
                        </div>
                        <Row gutter={[24, 24]}>
                            {specialties.map(specialty => (
                                <Col xs={12} sm={8} md={6} lg={4} key={specialty.id}>
                                    <Link href={`/search?specialty=${specialty.id}`}>
                                        <Card 
                                            hoverable 
                                            className="text-center border-0 shadow-md hover:shadow-xl rounded-2xl transition-all duration-300 group hover:-translate-y-1 bg-white"
                                            bodyStyle={{ padding: '28px 16px' }}
                                        >
                                            <div className="mb-3">
                                                {specialty.image_url ? (
                                                    <img 
                                                        src={specialty.image_url} 
                                                        alt={specialty.name}
                                                        className="w-14 h-14 mx-auto object-contain group-hover:scale-110 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'block';
                                                        }}
                                                    />
                                                ) : null}
                                                <div style={{ display: specialty.image_url ? 'none' : 'block' }}>
                                                    {specialty.icon ? (
                                                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">
                                                            {specialty.icon}
                                                        </span>
                                                    ) : (
                                                        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                            <MedicineBoxOutlined className="text-white text-2xl" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="font-semibold text-gray-800 mb-1 text-sm group-hover:text-blue-600 transition-colors">
                                                {specialty.name}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {specialty.doctors_count} doctors
                                            </div>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* Featured Doctors - Modern Design */}
                {featuredDoctors.length > 0 && (
                    <div className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                    Featured Doctors
                                </h2>
                                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                    Meet our highly qualified and experienced healthcare professionals
                                </p>
                            </div>
                            <Row gutter={[24, 24]}>
                                {featuredDoctors.map(doctor => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                                        <Card
                                            hoverable
                                            className="border-0 shadow-md hover:shadow-2xl rounded-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                                            bodyStyle={{ padding: 0 }}
                                        >
                                            {/* Doctor Image */}
                                            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                                                {doctor.image ? (
                                                    <img 
                                                        alt={doctor.name} 
                                                        src={doctor.image} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <UserOutlined className="text-6xl text-blue-300" />
                                                    </div>
                                                )}
                                                {/* Overlay gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </div>

                                            {/* Doctor Info */}
                                            <div className="p-5">
                                                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
                                                    {doctor.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                                                    <MedicineBoxOutlined />
                                                    <span className="text-sm">{doctor.specialty}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500 mb-3">
                                                    <EnvironmentOutlined />
                                                    <span className="text-xs line-clamp-1">{doctor.cities}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-4 min-h-[40px]">
                                                    {doctor.bio}
                                                </p>
                                                <Link href={`/doctors/${doctor.slug}`}>
                                                    <Button 
                                                        type="primary" 
                                                        block 
                                                        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 font-semibold h-10"
                                                    >
                                                        View Profile
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </div>
                )}

                {/* Cities - Modern Design */}
                <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                Find Doctors by City
                            </h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Choose your city and discover top healthcare professionals near you
                            </p>
                        </div>

                        {/* Grid View */}
                        <Row gutter={[20, 20]}>
                            {cities.map(city => (
                                <Col xs={12} sm={8} md={6} lg={4} key={city.id}>
                                    <Link href={`/search?city_name=${city.name}`}>
                                        <Card 
                                            hoverable 
                                            className="text-center border-0 shadow-md hover:shadow-xl rounded-2xl transition-all duration-300 group hover:-translate-y-1 bg-white"
                                            bodyStyle={{ padding: '24px 16px' }}
                                        >
                                            <div className="mb-3">
                                                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                                                    <EnvironmentOutlined className="text-white text-2xl" />
                                                </div>
                                            </div>
                                            <div className="font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">
                                                {city.name}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {city.doctors_count} doctors
                                            </div>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* CTA Section - Modern Design */}
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '32px 32px'
                        }}></div>
                    </div>

                    <div className="relative container mx-auto px-4 text-center">
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6">
                                    <UserOutlined className="text-5xl text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Are you a doctor?
                            </h2>
                            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                                Join our network and connect with patients across multiple cities. 
                                Expand your practice and help more people find quality healthcare.
                            </p>
                            <Link href="/register-doctor">
                                <Button 
                                    size="large" 
                                    className="h-14 px-10 rounded-xl bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-xl hover:shadow-2xl font-bold text-lg transition-all hover:scale-105"
                                >
                                    Register as Doctor
                                </Button>
                            </Link>
                            <p className="mt-6 text-blue-200 text-sm">
                                Already registered? <Link href="/login" className="text-white underline hover:text-blue-100">Sign in here</Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
