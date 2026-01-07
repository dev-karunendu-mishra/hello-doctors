import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Descriptions, Tag, Avatar, Divider, Button } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, MedicineBoxOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const { Title, Paragraph } = Typography;

export default function DoctorProfile({ auth, doctor }) {
    return (
        <>
            <Head title={`${doctor.name} - Doctor Profile`} />
            
            <Header auth={auth} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <Link href="/search">
                        <Button className="mb-4">← Back to Search</Button>
                    </Link>

                    {/* Profile Header */}
                    <Card className="mb-6">
                        <Row gutter={24}>
                            <Col xs={24} md={6} className="text-center">
                                {doctor.image ? (
                                    <Avatar size={200} src={doctor.image} />
                                ) : (
                                    <Avatar size={200} icon={<UserOutlined />} />
                                )}
                            </Col>
                            <Col xs={24} md={18}>
                                <Title level={2}>{doctor.name}</Title>
                                <div className="mb-4">
                                    <Tag color="blue" icon={<MedicineBoxOutlined />} className="text-lg py-1 px-3">
                                        {doctor.specialty}
                                    </Tag>
                                    {doctor.is_available_online && (
                                        <Tag color="green" className="text-lg py-1 px-3">
                                            Online Consultation Available
                                        </Tag>
                                    )}
                                </div>

                                <Descriptions column={{ xs: 1, sm: 2 }}>
                                    {doctor.phone && (
                                        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                                            <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
                                        </Descriptions.Item>
                                    )}
                                    {doctor.email && (
                                        <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                            <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
                                        </Descriptions.Item>
                                    )}
                                    {doctor.experience_years && (
                                        <Descriptions.Item label="Experience">
                                            {doctor.experience_years} years
                                        </Descriptions.Item>
                                    )}
                                    {doctor.consultation_fee && (
                                        <Descriptions.Item label="Consultation Fee">
                                            ₹{doctor.consultation_fee}
                                        </Descriptions.Item>
                                    )}
                                    {doctor.website && (
                                        <Descriptions.Item label={<><GlobalOutlined /> Website</>}>
                                            <a href={doctor.website} target="_blank" rel="noopener noreferrer">
                                                Visit Website
                                            </a>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Col>
                        </Row>
                    </Card>

                    {/* About */}
                    {doctor.bio && (
                        <Card title="About" className="mb-6">
                            <Paragraph>{doctor.bio}</Paragraph>
                        </Card>
                    )}

                    {/* Qualifications */}
                    {doctor.qualification && (
                        <Card title="Qualifications" className="mb-6">
                            <Paragraph>{doctor.qualification}</Paragraph>
                        </Card>
                    )}

                    {/* Practice Locations */}
                    {doctor.cities.length > 0 && (
                        <Card title={<><EnvironmentOutlined /> Practice Locations</>} className="mb-6">
                            <Row gutter={[16, 16]}>
                                {doctor.cities.map((city, index) => (
                                    <Col xs={24} md={12} key={index}>
                                        <Card size="small" hoverable>
                                            <Title level={5}>{city.name}</Title>
                                            {city.address && (
                                                <Paragraph className="mb-2">{city.address}</Paragraph>
                                            )}
                                            {city.landmarks && (
                                                <Paragraph type="secondary">
                                                    Landmark: {city.landmarks}
                                                </Paragraph>
                                            )}
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}

                    {/* Working Hours */}
                    {doctor.working_hours.length > 0 && (
                        <Card title={<><ClockCircleOutlined /> Working Hours</>} className="mb-6">
                            <Row gutter={[16, 16]}>
                                {doctor.working_hours.map((wh, index) => (
                                    <Col xs={24} md={12} key={index}>
                                        <Card size="small">
                                            {wh.city && (
                                                <div className="font-semibold mb-2">{wh.city}</div>
                                            )}
                                            {wh.timing_text ? (
                                                <div>{wh.timing_text}</div>
                                            ) : (
                                                wh.day_of_week && (
                                                    <div>
                                                        <span className="capitalize">{wh.day_of_week}</span>: {' '}
                                                        {wh.opening_time} - {wh.closing_time}
                                                    </div>
                                                )
                                            )}
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}

                    {/* Contact CTA */}
                    <Card className="text-center bg-blue-50">
                        <Title level={4}>Need an Appointment?</Title>
                        <Paragraph>
                            Contact {doctor.name} for consultation
                        </Paragraph>
                        <div className="flex gap-4 justify-center">
                            {doctor.phone && (
                                <Button type="primary" size="large" icon={<PhoneOutlined />} href={`tel:${doctor.phone}`}>
                                    Call Now
                                </Button>
                            )}
                            {doctor.email && (
                                <Button size="large" icon={<MailOutlined />} href={`mailto:${doctor.email}`}>
                                    Send Email
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            
            <Footer />
        </>
    );
}
