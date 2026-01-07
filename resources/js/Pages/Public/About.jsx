import { Head } from '@inertiajs/react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import { UserOutlined, EnvironmentOutlined, MedicineBoxOutlined, TrophyOutlined } from '@ant-design/icons';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;

export default function About({ auth, stats }) {
    return (
        <>
            <Head title="About Us - Hello Doctors" />
            
            <Header auth={auth} />
            
            <div className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
                    <div className="container mx-auto px-4 text-center">
                        <Title level={1} className="text-white mb-4">
                            About Hello Doctors
                        </Title>
                        <Paragraph className="text-xl text-blue-100 max-w-3xl mx-auto">
                            Connecting patients with the best healthcare professionals across multiple cities in India
                        </Paragraph>
                    </div>
                </div>

                {/* Statistics */}
                <div className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <Row gutter={24} justify="center">
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Verified Doctors" 
                                        value={stats.doctors}
                                        prefix={<UserOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Cities Covered" 
                                        value={stats.cities}
                                        prefix={<EnvironmentOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Specialties" 
                                        value={stats.specialties}
                                        prefix={<MedicineBoxOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic 
                                        title="Years of Service" 
                                        value={stats.years}
                                        prefix={<TrophyOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Mission */}
                <div className="py-12">
                    <div className="container mx-auto px-4">
                        <Row gutter={48}>
                            <Col xs={24} md={12}>
                                <Title level={2}>Our Mission</Title>
                                <Paragraph className="text-lg">
                                    To make quality healthcare accessible to everyone by connecting patients 
                                    with verified and experienced doctors across various specialties and locations.
                                </Paragraph>
                                <Paragraph className="text-lg">
                                    We believe that finding the right doctor should be simple, transparent, 
                                    and convenient for everyone.
                                </Paragraph>
                            </Col>
                            <Col xs={24} md={12}>
                                <Title level={2}>What We Do</Title>
                                <Paragraph className="text-lg">
                                    Hello Doctors is a comprehensive doctor directory platform that helps patients 
                                    find the right healthcare professionals based on specialty, location, and other 
                                    preferences.
                                </Paragraph>
                                <Paragraph className="text-lg">
                                    We verify all doctor profiles to ensure you get accurate and reliable 
                                    information about qualifications, experience, and practice details.
                                </Paragraph>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Features */}
                <div className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <Title level={2} className="text-center mb-8">Why Choose Hello Doctors?</Title>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Verified Profiles</Title>
                                    <Paragraph>
                                        All doctor profiles are verified to ensure accuracy and reliability. 
                                        You can trust the information you find on our platform.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Easy Search</Title>
                                    <Paragraph>
                                        Find doctors by specialty, location, or name. Our advanced search 
                                        makes it easy to find exactly what you're looking for.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Comprehensive Information</Title>
                                    <Paragraph>
                                        Get complete details about doctors including qualifications, experience, 
                                        consultation fees, working hours, and contact information.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Multiple Cities</Title>
                                    <Paragraph>
                                        We cover major cities across Uttar Pradesh, making it easy to find 
                                        doctors wherever you are.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Various Specialties</Title>
                                    <Paragraph>
                                        From general physicians to specialists, we have doctors from over 20 
                                        different medical specialties.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card hoverable>
                                    <Title level={4}>Free to Use</Title>
                                    <Paragraph>
                                        Our platform is completely free for patients. Search, browse, and 
                                        connect with doctors at no cost.
                                    </Paragraph>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* CTA */}
                <div className="py-12">
                    <div className="container mx-auto px-4 text-center">
                        <Card className="bg-blue-50">
                            <Title level={3}>Ready to find your doctor?</Title>
                            <Paragraph className="text-lg mb-6">
                                Search our directory of verified healthcare professionals
                            </Paragraph>
                            <a href="/search">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg">
                                    Search Doctors Now
                                </button>
                            </a>
                        </Card>
                    </div>
                </div>
            </div>
            
            <Footer />
        </>
    );
}
