import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Typography, Statistic, Tag, Descriptions, Avatar } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, MedicineBoxOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Dashboard({ profile, stats }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Doctor Dashboard
                </h2>
            }
        >
            <Head title="Doctor Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Profile Summary */}
                    <Card className="mb-6">
                        <Row gutter={24}>
                            <Col xs={24} md={6} className="text-center">
                                {profile.profile_image_url ? (
                                    <Avatar size={150} src={profile.profile_image_url} />
                                ) : (
                                    <Avatar size={150} icon={<UserOutlined />} />
                                )}
                            </Col>
                            <Col xs={24} md={18}>
                                <Title level={3}>{profile.name}</Title>
                                <div className="mb-4">
                                    <Tag color="blue" icon={<MedicineBoxOutlined />} className="text-base py-1 px-3">
                                        {profile.specialty?.name}
                                    </Tag>
                                    {profile.is_verified ? (
                                        <Tag color="green" icon={<CheckCircleOutlined />} className="text-base py-1 px-3">
                                            Verified
                                        </Tag>
                                    ) : (
                                        <Tag color="orange" icon={<ClockCircleOutlined />} className="text-base py-1 px-3">
                                            Pending Verification
                                        </Tag>
                                    )}
                                    {profile.is_active ? (
                                        <Tag color="green">Active</Tag>
                                    ) : (
                                        <Tag color="red">Inactive</Tag>
                                    )}
                                </div>

                                <Descriptions column={{ xs: 1, sm: 2 }}>
                                    <Descriptions.Item label="Email">{profile.user?.email}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{profile.phone || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Experience">{profile.experience_years} years</Descriptions.Item>
                                    <Descriptions.Item label="Consultation Fee">₹{profile.consultation_fee}</Descriptions.Item>
                                </Descriptions>

                                {profile.cities?.length > 0 && (
                                    <div className="mt-4">
                                        <EnvironmentOutlined /> Practice Locations: {' '}
                                        {profile.cities.map(c => c.name).join(', ')}
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Card>

                    {/* Statistics */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic 
                                    title="Profile Views" 
                                    value={stats.profile_views}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic 
                                    title="Total Cities" 
                                    value={profile.cities?.length || 0}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic 
                                    title="Working Hours Set" 
                                    value={profile.working_hours?.length || 0}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic 
                                    title="Profile Completion" 
                                    value={stats.profile_completion}
                                    suffix="%"
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions */}
                    <Card title="Quick Actions">
                        <Row gutter={16}>
                            <Col xs={24} sm={8}>
                                <Link href="/doctor/profile/edit">
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg">
                                        Edit Profile
                                    </button>
                                </Link>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Link href="/doctor/profile">
                                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg">
                                        View Public Profile
                                    </button>
                                </Link>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Link href="/doctor/settings">
                                    <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg">
                                        Settings
                                    </button>
                                </Link>
                            </Col>
                        </Row>
                    </Card>

                    {/* Alerts */}
                    {!profile.is_verified && (
                        <Card className="mt-6 bg-yellow-50 border-yellow-200">
                            <Paragraph>
                                <ClockCircleOutlined className="text-yellow-600 mr-2" />
                                Your profile is pending verification. Our team will review and verify your profile soon.
                            </Paragraph>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
