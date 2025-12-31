import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, Form, Input, Button, Select, Upload, DatePicker, Checkbox, InputNumber, Alert } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function AdvertisementEdit({ advertisement, flash }) {
    const { data, setData, post, processing, errors } = useForm({
        title: advertisement.title || '',
        description: advertisement.description || '',
        link_url: advertisement.link_url || '',
        position: advertisement.position || 'home_banner',
        start_date: advertisement.start_date || '',
        end_date: advertisement.end_date || '',
        is_active: advertisement.is_active || false,
        sort_order: advertisement.sort_order || 0,
        image: null,
        _method: 'PUT',
    });

    const [fileList, setFileList] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/advertisements/${advertisement.id}`);
    };

    const handleImageChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            setData('image', newFileList[0].originFileObj);
        } else {
            setData('image', null);
        }
    };

    const uploadProps = {
        beforeUpload: () => false,
        maxCount: 1,
        listType: 'picture',
        fileList,
        onChange: handleImageChange,
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Edit Advertisement
                </h2>
            }
        >
            <Head title={`Edit ${advertisement.title}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <Link href="/admin/advertisements">
                            <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                        </Link>
                    </div>

                    {flash?.success && (
                        <Alert 
                            message="Success" 
                            description={flash.success} 
                            type="success" 
                            showIcon 
                            closable 
                            className="mb-6"
                        />
                    )}

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <Form layout="vertical">
                                <Form.Item 
                                    label="Title" 
                                    validateStatus={errors.title ? 'error' : ''}
                                    help={errors.title}
                                    required
                                >
                                    <Input
                                        size="large"
                                        placeholder="Advertisement Title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Description" 
                                    validateStatus={errors.description ? 'error' : ''}
                                    help={errors.description}
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Brief description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Link URL" 
                                    validateStatus={errors.link_url ? 'error' : ''}
                                    help={errors.link_url}
                                >
                                    <Input
                                        size="large"
                                        placeholder="https://example.com"
                                        value={data.link_url}
                                        onChange={(e) => setData('link_url', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Position" 
                                    validateStatus={errors.position ? 'error' : ''}
                                    help={errors.position}
                                    required
                                >
                                    <Select
                                        size="large"
                                        value={data.position}
                                        onChange={(value) => setData('position', value)}
                                    >
                                        <Select.Option value="home_banner">Home Banner</Select.Option>
                                        <Select.Option value="sidebar">Sidebar</Select.Option>
                                        <Select.Option value="footer">Footer</Select.Option>
                                        <Select.Option value="search_results">Search Results</Select.Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item 
                                    label="Start Date" 
                                    validateStatus={errors.start_date ? 'error' : ''}
                                    help={errors.start_date}
                                    required
                                >
                                    <DatePicker
                                        size="large"
                                        className="w-full"
                                        defaultValue={data.start_date ? dayjs(data.start_date) : null}
                                        onChange={(date) => setData('start_date', date ? date.format('YYYY-MM-DD') : '')}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="End Date (Optional)" 
                                    validateStatus={errors.end_date ? 'error' : ''}
                                    help={errors.end_date}
                                >
                                    <DatePicker
                                        size="large"
                                        className="w-full"
                                        defaultValue={data.end_date ? dayjs(data.end_date) : null}
                                        onChange={(date) => setData('end_date', date ? date.format('YYYY-MM-DD') : '')}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Sort Order" 
                                    validateStatus={errors.sort_order ? 'error' : ''}
                                    help={errors.sort_order}
                                >
                                    <InputNumber
                                        size="large"
                                        className="w-full"
                                        value={data.sort_order}
                                        onChange={(value) => setData('sort_order', value)}
                                    />
                                </Form.Item>

                                <Form.Item 
                                    label="Advertisement Image" 
                                    validateStatus={errors.image ? 'error' : ''}
                                    help={errors.image}
                                >
                                    {advertisement.image_url && (
                                        <div className="mb-2">
                                            <img src={advertisement.image_url} alt="Current" className="w-64 h-auto object-cover rounded" />
                                        </div>
                                    )}
                                    <Upload {...uploadProps}>
                                        <Button icon={<UploadOutlined />}>
                                            {advertisement.image_url ? 'Change Image' : 'Select Image'}
                                        </Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item>
                                    <Checkbox
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    >
                                        Active
                                    </Checkbox>
                                </Form.Item>

                                <div className="mb-4 text-gray-600">
                                    <div>Total Clicks: {advertisement.click_count}</div>
                                    <div>Created: {new Date(advertisement.created_at).toLocaleDateString()}</div>
                                </div>

                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        htmlType="submit"
                                        loading={processing}
                                        block
                                    >
                                        Update Advertisement
                                    </Button>
                                </Form.Item>
                            </Form>
                        </form>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
