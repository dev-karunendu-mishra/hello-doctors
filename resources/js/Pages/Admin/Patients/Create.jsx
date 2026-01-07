import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Input, Button, Switch, Space, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.patients.store'));
    };

    return (
        <AdminLayout>
            <Head title="Create Patient" />

            <div className="mb-4">
                <Link href={route('admin.patients.index')}>
                    <Button icon={<ArrowLeftOutlined />}>Back to Patients</Button>
                </Link>
            </div>

            <Card title="Create New Patient">
                {Object.keys(errors).length > 0 && (
                    <Alert
                        message="Validation Errors"
                        description={
                            <ul>
                                {Object.values(errors).map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        }
                        type="error"
                        closable
                        className="mb-4"
                    />
                )}

                <form onSubmit={handleSubmit}>
                    <Form layout="vertical">
                        <Form.Item
                            label="Name"
                            required
                            validateStatus={errors.name ? 'error' : ''}
                            help={errors.name}
                        >
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Enter full name"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            required
                            validateStatus={errors.email ? 'error' : ''}
                            help={errors.email}
                        >
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Enter email address"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            required
                            validateStatus={errors.password ? 'error' : ''}
                            help={errors.password}
                        >
                            <Input.Password
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter password"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            required
                            validateStatus={errors.password_confirmation ? 'error' : ''}
                            help={errors.password_confirmation}
                        >
                            <Input.Password
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Confirm password"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Phone"
                            validateStatus={errors.phone ? 'error' : ''}
                            help={errors.phone}
                        >
                            <Input
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </Form.Item>

                        <Form.Item label="Active">
                            <Switch
                                checked={data.is_active}
                                onChange={(checked) => setData('is_active', checked)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={processing}
                                >
                                    Create Patient
                                </Button>
                                <Link href={route('admin.patients.index')}>
                                    <Button>Cancel</Button>
                                </Link>
                            </Space>
                        </Form.Item>
                    </Form>
                </form>
            </Card>
        </AdminLayout>
    );
}
