import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, Descriptions, Tag, Avatar, Button, Row, Col } from 'antd';
import { UserOutlined, EditOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export default function DoctorShow({ doctor }) {
    return (
        <AdminLayout>
            <Head title={`${doctor.name} - Details`} />

            <div className="mb-4">
                <Link href="/admin/doctors">
                            <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                        </Link>
                    </div>

                    <Card>
                        <Row gutter={24}>
                            <Col xs={24} md={6} className="text-center">
                                {doctor.profile_image_url ? (
                                    <Avatar size={150} src={doctor.profile_image_url} />
                                ) : (
                                    <Avatar size={150} icon={<UserOutlined />} />
                                )}
                            </Col>
                            <Col xs={24} md={18}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{doctor.name}</h2>
                                        <div className="mt-2">
                                            {doctor.is_verified ? (
                                                <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
                                            ) : (
                                                <Tag color="orange" icon={<CloseCircleOutlined />}>Pending Verification</Tag>
                                            )}
                                            {doctor.is_active ? (
                                                <Tag color="blue">Active</Tag>
                                            ) : (
                                                <Tag color="red">Inactive</Tag>
                                            )}
                                            {doctor.is_available_online && (
                                                <Tag color="cyan">Online Consultation</Tag>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/admin/doctors/${doctor.id}/edit`}>
                                        <Button type="primary" icon={<EditOutlined />}>Edit</Button>
                                    </Link>
                                </div>

                                <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                                    <Descriptions.Item label="Email">{doctor.user?.email}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{doctor.phone || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Specialty">{doctor.specialty?.name}</Descriptions.Item>
                                    <Descriptions.Item label="Experience">{doctor.experience_years} years</Descriptions.Item>
                                    <Descriptions.Item label="Consultation Fee">₹{doctor.consultation_fee}</Descriptions.Item>
                                    <Descriptions.Item label="Website">
                                        {doctor.website ? (
                                            <a href={doctor.website} target="_blank" rel="noopener noreferrer">
                                                {doctor.website}
                                            </a>
                                        ) : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Qualifications" span={2}>
                                        {doctor.qualification}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Bio" span={2}>
                                        {doctor.bio || 'No bio provided'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Practice Cities" span={2}>
                                        {doctor.cities?.map(city => (
                                            <Tag key={city.id}>{city.name}</Tag>
                                        ))}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Created At" span={2}>
                                        {new Date(doctor.created_at).toLocaleDateString()}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Col>
                        </Row>
                    </Card>

                    {doctor.working_hours?.length > 0 && (
                        <Card title="Working Hours" className="mt-6">
                            <Row gutter={[16, 16]}>
                                {doctor.working_hours.map((wh, index) => (
                                    <Col xs={24} md={12} key={index}>
                                        <Card size="small">
                                            {wh.city && <div className="font-semibold">{wh.city}</div>}
                                            {wh.timing_text ? (
                                                <div>{wh.timing_text}</div>
                                            ) : (
                                                wh.day_of_week && (
                                                    <div>
                                                        {wh.day_of_week}: {wh.opening_time} - {wh.closing_time}
                                                    </div>
                                                )
                                            )}
                                        </Card>
                                    </Col>
                                ))}n                            </Row>
                        </Card>
                    )}
        </AdminLayout>
    );
}
