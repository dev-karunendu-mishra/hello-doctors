import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, Form, Input, Button, Switch, InputNumber, Alert, Upload, Radio, Space } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { TextArea } = Input;

export default function SpecialtyCreate({ existingImages }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        icon: '',
        image_path: '',
        image_file: null,
        description: '',
        is_active: true,
        sort_order: 0,
    });

    const [imageSource, setImageSource] = useState('existing'); // 'existing' or 'upload'
    const [fileList, setFileList] = useState([]);
    const [selectedExisting, setSelectedExisting] = useState('');

    // Debug: Log existing images
    console.log('Existing Images:', existingImages);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('icon', data.icon || '');
        formData.append('description', data.description || '');
        formData.append('is_active', data.is_active ? '1' : '0');
        formData.append('sort_order', data.sort_order);
        
        if (imageSource === 'upload' && data.image_file) {
            formData.append('image_file', data.image_file);
        } else if (imageSource === 'existing' && data.image_path) {
            formData.append('image_path', data.image_path);
        }
        
        post('/admin/specialties', {
            data: formData,
            forceFormData: true,
        });
    };

    const handleImageChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            setData('image_file', newFileList[0].originFileObj);
            setData('image_path', '');
        } else {
            setData('image_file', null);
        }
    };

    const handleExistingImageSelect = (path) => {
        setSelectedExisting(path);
        setData('image_path', path);
        setData('image_file', null);
    };

    const uploadProps = {
        beforeUpload: () => false,
        maxCount: 1,
        listType: 'picture',
        fileList,
        onChange: handleImageChange,
        accept: 'image/jpeg,image/jpg,image/png,image/gif',
    };

    return (
        <AdminLayout>
            <Head title="Create Specialty" />
            
            <div className="mb-4">
                <Link href="/admin/specialties">
                    <Button icon={<ArrowLeftOutlined />}>Back to List</Button>
                </Link>
            </div>

            {errors && Object.keys(errors).length > 0 && (
                <Alert 
                    message="Please fix the errors below" 
                    type="error" 
                    showIcon 
                    className="mb-6"
                />
            )}

            <Card title="Create New Specialty">
                <form onSubmit={handleSubmit}>
                    <Form.Item 
                        label="Specialty Name" 
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="e.g., Cardiology, Dermatology"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Icon/Emoji (Optional)" 
                        validateStatus={errors.icon ? 'error' : ''}
                        help={errors.icon || 'Enter an emoji or icon'}
                    >
                        <Input
                            size="large"
                            placeholder="🫀 or ❤️"
                            value={data.icon}
                            onChange={(e) => setData('icon', e.target.value)}
                            maxLength={10}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Specialty Image" 
                        validateStatus={errors.image_path || errors.image_file ? 'error' : ''}
                        help={errors.image_path || errors.image_file}
                    >
                        <Radio.Group 
                            value={imageSource} 
                            onChange={(e) => {
                                setImageSource(e.target.value);
                                if (e.target.value === 'existing') {
                                    setFileList([]);
                                    setData('image_file', null);
                                } else {
                                    setSelectedExisting('');
                                    setData('image_path', '');
                                }
                            }}
                            className="mb-3"
                        >
                            <Radio value="existing">Select Existing Image</Radio>
                            <Radio value="upload">Upload New Image</Radio>
                        </Radio.Group>

                        {imageSource === 'existing' && (
                            <div className="mt-3">
                                {(!existingImages || existingImages.length === 0) ? (
                                    <Alert 
                                        message="No existing images found" 
                                        description="Please upload a new image or check that images exist in public/images/specialties/ folder"
                                        type="info" 
                                        showIcon 
                                    />
                                ) : (
                                    <div style={{ 
                                        maxHeight: '400px', 
                                        overflowY: 'auto', 
                                        border: '1px solid #d9d9d9', 
                                        borderRadius: '4px', 
                                        padding: '16px',
                                        backgroundColor: '#fafafa'
                                    }}>
                                        <div className="mb-2 text-sm text-gray-600">
                                            Found {existingImages.length} images. Click to select:
                                        </div>
                                        <Space wrap size={16}>
                                            {existingImages.map((img) => (
                                                <div
                                                    key={img.path}
                                                    onClick={() => handleExistingImageSelect(img.path)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: selectedExisting === img.path ? '3px solid #1890ff' : '2px solid #d9d9d9',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        textAlign: 'center',
                                                        width: '70px',
                                                        transition: 'all 0.3s',
                                                        backgroundColor: '#fff'
                                                    }}
                                                    className="hover:shadow-lg"
                                                >
                                                    <img
                                                        src={`/${img.path}`}
                                                        alt={img.name}
                                                        style={{ 
                                                            width: '30px',
                                                            height: '30px',
                                                            objectFit: 'contain',
                                                            display: 'block',
                                                            margin: '0 auto'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="30" height="30"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E?%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        marginTop: '4px',
                                                        wordBreak: 'break-all',
                                                        color: '#666'
                                                    }}>
                                                        {img.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </Space>
                                    </div>
                                )}
                            </div>
                        )}

                        {imageSource === 'upload' && (
                            <div className="mt-3">
                                <Upload {...uploadProps}>
                                    <Button icon={<UploadOutlined />}>Select Image File</Button>
                                </Upload>
                                <div className="text-gray-500 text-sm mt-2">
                                    Max file size: 2MB. Supported formats: JPG, PNG, GIF
                                </div>
                            </div>
                        )}
                    </Form.Item>

                    <Form.Item 
                        label="Description (Optional)" 
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Brief description of the specialty..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Sort Order" 
                        validateStatus={errors.sort_order ? 'error' : ''}
                        help={errors.sort_order || 'Lower numbers appear first'}
                    >
                        <InputNumber
                            size="large"
                            min={0}
                            value={data.sort_order}
                            onChange={(value) => setData('sort_order', value)}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Active Status"
                        validateStatus={errors.is_active ? 'error' : ''}
                        help={errors.is_active}
                    >
                        <Switch
                            checked={data.is_active}
                            onChange={(checked) => setData('is_active', checked)}
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={processing}
                            size="large"
                        >
                            Create Specialty
                        </Button>
                    </Form.Item>
                </form>
            </Card>
        </AdminLayout>
    );
}
