import { useState } from 'react';
import { Alert, Card, Row, Col, Button, List, Avatar, Tag, Empty, Modal, Form, Input, Space, Descriptions, Select, message } from 'antd';
import {
    CalendarOutlined,
    MedicineBoxOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const abhaStatusColors = {
    not_linked: 'default',
    otp_sent: 'processing',
    verified: 'success',
};

export default function Dashboard({ upcomingAppointments, recentRecords, recommendedDoctors, abhaProfile }) {
    const { auth } = usePage().props;
    const [abhaData, setAbhaData] = useState(abhaProfile || {});
    const [abhaModalOpen, setAbhaModalOpen] = useState(false);
    const [abhaRequestId, setAbhaRequestId] = useState(null);
    const [abhaAccounts, setAbhaAccounts] = useState([]);
    const [abhaQrOpen, setAbhaQrOpen] = useState(false);
    const [abhaQrData, setAbhaQrData] = useState(null);
    const [abhaLoading, setAbhaLoading] = useState(false);
    const [abhaForm] = Form.useForm();

    const requestOtp = async () => {
        try {
            const values = await abhaForm.validateFields(['mobile']);
            setAbhaLoading(true);
            const response = await window.axios.post('/patient/data/abha/request-otp', {
                mobile: values.mobile,
            });
            setAbhaRequestId(response?.data?.data?.request_id || null);
            message.success(response?.data?.message || 'ABHA OTP sent successfully.');
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to request ABHA OTP.');
        } finally {
            setAbhaLoading(false);
        }
    };

    const verifyOtp = async () => {
        try {
            const values = await abhaForm.validateFields(['otp']);
            if (!abhaRequestId) {
                message.error('Please request OTP first.');
                return;
            }

            setAbhaLoading(true);
            const response = await window.axios.post('/patient/data/abha/verify-otp', {
                request_id: abhaRequestId,
                otp: values.otp,
            });

            const payload = response?.data?.data || {};
            if (payload.selection_required) {
                setAbhaAccounts(payload.accounts || []);
                message.success(response?.data?.message || 'OTP verified. Please select your ABHA account.');
                return;
            }

            setAbhaData(payload);
            setAbhaAccounts([]);
            setAbhaModalOpen(false);
            setAbhaRequestId(null);
            abhaForm.resetFields(['otp', 'selected_abha_number']);
            message.success(response?.data?.message || 'ABHA linked successfully.');
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to verify ABHA OTP.');
        } finally {
            setAbhaLoading(false);
        }
    };

    const linkSelectedAbha = async () => {
        try {
            const values = await abhaForm.validateFields(['selected_abha_number']);
            setAbhaLoading(true);
            const response = await window.axios.post('/patient/data/abha/link-account', {
                abha_number: values.selected_abha_number,
            });
            setAbhaData(response?.data?.data || {});
            setAbhaAccounts([]);
            setAbhaModalOpen(false);
            setAbhaRequestId(null);
            abhaForm.resetFields(['otp', 'selected_abha_number']);
            message.success(response?.data?.message || 'ABHA account linked successfully.');
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to link selected ABHA account.');
        } finally {
            setAbhaLoading(false);
        }
    };

    const viewQr = async () => {
        try {
            setAbhaLoading(true);
            const response = await window.axios.get('/patient/data/abha/qr-code');
            setAbhaQrData(response?.data?.data?.data_url || null);
            setAbhaQrOpen(true);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load ABHA QR code.');
        } finally {
            setAbhaLoading(false);
        }
    };

    const syncAbha = async () => {
        try {
            setAbhaLoading(true);
            const response = await window.axios.post('/patient/data/abha/sync');
            setAbhaData(response?.data?.data || {});
            message.success(response?.data?.message || 'ABHA profile synced successfully.');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to sync ABHA profile.');
        } finally {
            setAbhaLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                    <h1>Patient Dashboard</h1>
                    <Link href="/patient/find-doctors">
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Book Appointment
                        </Button>
                    </Link>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <span>
                                    <CalendarOutlined /> Upcoming Appointments
                                </span>
                            }
                            extra={<Link href="/patient/appointments">View All</Link>}
                        >
                            {upcomingAppointments && upcomingAppointments.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={upcomingAppointments}
                                    renderItem={(item) => (
                                        <List.Item
                                            actions={[
                                                <Tag color="blue" icon={<ClockCircleOutlined />}>
                                                    {item.status || 'Pending'}
                                                </Tag>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        icon={<MedicineBoxOutlined />}
                                                        style={{ backgroundColor: '#1890ff' }}
                                                    />
                                                }
                                                title={`Dr. ${item.doctor_name || 'Doctor Name'}`}
                                                description={
                                                    <div>
                                                        <div>
                                                            {item.date || 'TBD'} at {item.time || '00:00'}
                                                        </div>
                                                        <div style={{ color: '#999', fontSize: 12 }}>
                                                            {item.specialization || 'General Physician'}
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No upcoming appointments"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Link href="/patient/find-doctors">
                                        <Button type="primary">Book Your First Appointment</Button>
                                    </Link>
                                </Empty>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <span>
                                    <SafetyCertificateOutlined /> ABHA / ABDM Integration
                                </span>
                            }
                            extra={
                                <Space>
                                    {abhaData?.abha_address && (
                                        <>
                                            <Button icon={<SyncOutlined />} onClick={syncAbha} loading={abhaLoading}>
                                                Sync
                                            </Button>
                                            <Button onClick={viewQr} loading={abhaLoading}>View QR</Button>
                                            <Button onClick={() => window.open('/patient/data/abha/card', '_blank')}>ABHA Card</Button>
                                        </>
                                    )}
                                    <Button type="primary" onClick={() => setAbhaModalOpen(true)}>
                                        {abhaData?.abha_address ? 'Update ABHA' : 'Link ABHA'}
                                    </Button>
                                </Space>
                            }
                        >
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 12 }}
                                message="Connect your ABHA to prepare for ABDM-ready health record workflows and future digital record sharing."
                            />

                            <div style={{ marginBottom: 12 }}>
                                <Tag color={abhaStatusColors[abhaData?.abha_status] || 'default'}>
                                    {(abhaData?.abha_status || 'not_linked').replace('_', ' ').toUpperCase()}
                                </Tag>
                            </div>

                            {abhaData?.abha_address ? (
                                <Descriptions size="small" column={1} bordered>
                                    <Descriptions.Item label="ABHA Number">{abhaData.abha_number || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="ABHA Address">{abhaData.abha_address || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Verified At">{abhaData.abha_verified_at || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Last Synced">{abhaData.abha_last_synced_at || '-'}</Descriptions.Item>
                                </Descriptions>
                            ) : (
                                <Empty
                                    description="No ABHA linked yet"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Button type="primary" onClick={() => setAbhaModalOpen(true)}>
                                        Link ABHA Now
                                    </Button>
                                </Empty>
                            )}
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <span>
                                    <MedicineBoxOutlined /> Recent Medical Records
                                </span>
                            }
                            extra={<Link href="/patient/medical-records">View All</Link>}
                        >
                            {recentRecords && recentRecords.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={recentRecords}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<MedicineBoxOutlined />} />}
                                                title={item.title || 'Medical Record'}
                                                description={
                                                    <div>
                                                        <div>{item.description || 'No description'}</div>
                                                        <div style={{ color: '#999', fontSize: 12 }}>
                                                            {item.date || 'Date not available'}
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No medical records yet"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Recommended Doctors">
                            {recommendedDoctors && recommendedDoctors.length > 0 ? (
                                <List
                                    grid={{
                                        gutter: 16,
                                        xs: 1,
                                        sm: 2,
                                        md: 2,
                                        lg: 2,
                                        xl: 2,
                                        xxl: 2,
                                    }}
                                    dataSource={recommendedDoctors}
                                    renderItem={(doctor) => (
                                        <List.Item>
                                            <Card
                                                hoverable
                                                actions={[
                                                    <Link href={doctor.slug ? `/doctors/${doctor.slug}` : '/doctors'}>
                                                        <Button type="primary" size="small" block disabled={!doctor.slug}>
                                                            View Profile
                                                        </Button>
                                                    </Link>,
                                                ]}
                                            >
                                                <Card.Meta
                                                    avatar={<Avatar size={64} icon={<MedicineBoxOutlined />} />}
                                                    title={`Dr. ${doctor.name || 'Doctor Name'}`}
                                                    description={
                                                        <div>
                                                            <div>{doctor.specialization || 'General Physician'}</div>
                                                            <div style={{ marginTop: 8 }}>
                                                                <Tag color="blue">{doctor.experience || '5'} years exp</Tag>
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty
                                    description="No recommended doctors available"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Link href="/patient/find-doctors">
                                        <Button type="primary">Browse All Doctors</Button>
                                    </Link>
                                </Empty>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            <Modal
                title="Link ABHA"
                open={abhaModalOpen}
                onCancel={() => {
                    setAbhaModalOpen(false);
                    setAbhaRequestId(null);
                    setAbhaAccounts([]);
                }}
                footer={
                    <Space>
                        <Button onClick={() => setAbhaModalOpen(false)}>Close</Button>
                        {!abhaRequestId ? (
                            <Button type="primary" loading={abhaLoading} onClick={requestOtp}>Send OTP</Button>
                        ) : abhaAccounts.length > 0 ? (
                            <Button type="primary" loading={abhaLoading} onClick={linkSelectedAbha}>Link Selected ABHA</Button>
                        ) : (
                            <Button type="primary" loading={abhaLoading} onClick={verifyOtp}>Verify OTP</Button>
                        )}
                    </Space>
                }
                destroyOnClose
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="This flow follows the ABDM ABHA V3 mobile OTP login process. Add your ABHA sandbox credentials in .env to activate live verification."
                    description="Step 1: request OTP on the ABHA-linked mobile number. Step 2: verify OTP. Step 3: if multiple ABHAs are linked to the mobile, choose the correct account to continue."
                />
                <Form
                    form={abhaForm}
                    layout="vertical"
                    initialValues={{ mobile: auth?.user?.phone || '' }}
                >
                    <Form.Item
                        name="mobile"
                        label="Mobile Number"
                        rules={[{ required: true, message: 'Please enter your registered mobile number.' }]}
                    >
                        <Input placeholder="Enter ABHA-linked mobile number" />
                    </Form.Item>

                    {abhaRequestId && (
                        <>
                            <Alert
                                type="success"
                                showIcon
                                style={{ marginBottom: 12 }}
                                message={abhaAccounts.length > 0
                                    ? 'OTP verified. Select the ABHA account you want to link.'
                                    : 'OTP sent. Enter it below to continue the ABHA V3 login process.'}
                            />
                            <Form.Item
                                name="otp"
                                label="OTP"
                                rules={[{ required: true, message: 'Please enter the OTP.' }]}
                            >
                                <Input placeholder="Enter OTP" />
                            </Form.Item>

                            {abhaAccounts.length > 0 && (
                                <Form.Item
                                    name="selected_abha_number"
                                    label="Choose ABHA Account"
                                    rules={[{ required: true, message: 'Please select the ABHA account to link.' }]}
                                >
                                    <Select
                                        placeholder="Select ABHA number"
                                        options={abhaAccounts.map((account) => ({
                                            value: account.abha_number,
                                            label: `${account.name || 'Account'} - ${account.abha_number}${account.abha_address ? ` (${account.abha_address})` : ''}`,
                                        }))}
                                    />
                                </Form.Item>
                            )}
                        </>
                    )}
                </Form>
            </Modal>

            <Modal
                title="ABHA QR Code"
                open={abhaQrOpen}
                onCancel={() => setAbhaQrOpen(false)}
                footer={null}
                destroyOnClose
            >
                {abhaQrData ? (
                    <div style={{ textAlign: 'center' }}>
                        <img src={abhaQrData} alt="ABHA QR Code" style={{ maxWidth: '100%' }} />
                    </div>
                ) : (
                    <Empty description="QR code not available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Modal>
        </AdminLayout>
    );
}
