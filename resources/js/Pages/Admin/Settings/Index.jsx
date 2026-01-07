import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Form, Input, Button, Space, Divider, Typography } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Index({ settings }) {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Settings to save:', values);
        // TODO: Implement settings save functionality
    };

    return (
        <AdminLayout>
            <Head title="Settings" />

            <Card
                title={
                    <span>
                        <SettingOutlined style={{ marginRight: 8 }} />
                        System Settings
                    </span>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={settings}
                >
                    <Title level={5}>Application Settings</Title>
                    <Divider />

                    <Form.Item
                        label="Application Name"
                        name="app_name"
                        rules={[{ required: true, message: 'Please enter application name' }]}
                    >
                        <Input placeholder="Hello Doctors" />
                    </Form.Item>

                    <Form.Item
                        label="Application URL"
                        name="app_url"
                        rules={[
                            { required: true, message: 'Please enter application URL' },
                            { type: 'url', message: 'Please enter a valid URL' },
                        ]}
                    >
                        <Input placeholder="https://hellodoctors.com" />
                    </Form.Item>

                    <Divider />

                    <Title level={5}>Email Settings</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Configure email settings for notifications and communications
                    </Text>

                    <Form.Item
                        label="SMTP Host"
                        name="smtp_host"
                    >
                        <Input placeholder="smtp.gmail.com" />
                    </Form.Item>

                    <Form.Item
                        label="SMTP Port"
                        name="smtp_port"
                    >
                        <Input placeholder="587" />
                    </Form.Item>

                    <Form.Item
                        label="From Email"
                        name="from_email"
                    >
                        <Input placeholder="noreply@hellodoctors.com" />
                    </Form.Item>

                    <Divider />

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                Save Settings
                            </Button>
                            <Button htmlType="button" onClick={() => form.resetFields()}>
                                Reset
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </AdminLayout>
    );
}
