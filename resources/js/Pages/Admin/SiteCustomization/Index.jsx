import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, Tabs, Form, Input, Button, Upload, ColorPicker, message, Space } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import AdminLayout from '@/Layouts/AdminLayout';

const { TabPane } = Tabs;
const { TextArea } = Input;

export default function SiteCustomization({ settings }) {
    const [activeTab, setActiveTab] = useState('general');
    
    const generalForm = useForm({
        group: 'general',
        settings: settings.general,
    });

    const appearanceForm = useForm({
        group: 'appearance',
        settings: settings.appearance,
    });

    const contactForm = useForm({
        group: 'contact',
        settings: settings.contact,
    });

    const handleSubmit = (form) => {
        form.post(route('admin.site-customization.update'), {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Settings updated successfully');
            },
            onError: (errors) => {
                message.error('Failed to update settings');
                console.error(errors);
            },
        });
    };

    const handleImageUpload = (file, key, group) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', key);
        formData.append('group', group);

        fetch(route('admin.site-customization.upload-image'), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    message.success('Image uploaded successfully');
                    if (group === 'general') {
                        generalForm.setData('settings', {
                            ...generalForm.data.settings,
                            [key]: data.url,
                        });
                    } else if (group === 'appearance') {
                        appearanceForm.setData('settings', {
                            ...appearanceForm.data.settings,
                            [key]: data.url,
                        });
                    }
                }
            })
            .catch(error => {
                message.error('Failed to upload image');
                console.error(error);
            });

        return false; // Prevent default upload behavior
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <h1 style={{ marginBottom: 24 }}>Site Customization</h1>

                <Card>
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane tab="General Settings" key="general">
                            <Form layout="vertical">
                                <Form.Item label="Site Name">
                                    <Input
                                        size="large"
                                        value={generalForm.data.settings.site_name}
                                        onChange={(e) =>
                                            generalForm.setData('settings', {
                                                ...generalForm.data.settings,
                                                site_name: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Site Tagline">
                                    <Input
                                        size="large"
                                        value={generalForm.data.settings.site_tagline}
                                        onChange={(e) =>
                                            generalForm.setData('settings', {
                                                ...generalForm.data.settings,
                                                site_tagline: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Site Description">
                                    <TextArea
                                        rows={4}
                                        value={generalForm.data.settings.site_description}
                                        onChange={(e) =>
                                            generalForm.setData('settings', {
                                                ...generalForm.data.settings,
                                                site_description: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Site Logo">
                                    <Upload
                                        beforeUpload={(file) =>
                                            handleImageUpload(file, 'site_logo', 'general')
                                        }
                                        showUploadList={false}
                                    >
                                        <Button icon={<UploadOutlined />}>Upload Logo</Button>
                                    </Upload>
                                    {generalForm.data.settings.site_logo && (
                                        <img
                                            src={generalForm.data.settings.site_logo}
                                            alt="Logo"
                                            style={{ marginTop: 10, maxHeight: 100 }}
                                        />
                                    )}
                                </Form.Item>

                                <Form.Item label="Site Favicon">
                                    <Upload
                                        beforeUpload={(file) =>
                                            handleImageUpload(file, 'site_favicon', 'general')
                                        }
                                        showUploadList={false}
                                    >
                                        <Button icon={<UploadOutlined />}>Upload Favicon</Button>
                                    </Upload>
                                    {generalForm.data.settings.site_favicon && (
                                        <img
                                            src={generalForm.data.settings.site_favicon}
                                            alt="Favicon"
                                            style={{ marginTop: 10, maxHeight: 32 }}
                                        />
                                    )}
                                </Form.Item>

                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={generalForm.processing}
                                    onClick={() => handleSubmit(generalForm)}
                                >
                                    Save General Settings
                                </Button>
                            </Form>
                        </TabPane>

                        <TabPane tab="Appearance" key="appearance">
                            <Form layout="vertical">
                                <Form.Item label="Primary Color">
                                    <Input
                                        type="color"
                                        value={appearanceForm.data.settings.primary_color}
                                        onChange={(e) =>
                                            appearanceForm.setData('settings', {
                                                ...appearanceForm.data.settings,
                                                primary_color: e.target.value,
                                            })
                                        }
                                        style={{ width: 100, height: 40 }}
                                    />
                                </Form.Item>

                                <Form.Item label="Secondary Color">
                                    <Input
                                        type="color"
                                        value={appearanceForm.data.settings.secondary_color}
                                        onChange={(e) =>
                                            appearanceForm.setData('settings', {
                                                ...appearanceForm.data.settings,
                                                secondary_color: e.target.value,
                                            })
                                        }
                                        style={{ width: 100, height: 40 }}
                                    />
                                </Form.Item>

                                <Form.Item label="Hero Title">
                                    <Input
                                        size="large"
                                        value={appearanceForm.data.settings.hero_title}
                                        onChange={(e) =>
                                            appearanceForm.setData('settings', {
                                                ...appearanceForm.data.settings,
                                                hero_title: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Hero Subtitle">
                                    <TextArea
                                        rows={3}
                                        value={appearanceForm.data.settings.hero_subtitle}
                                        onChange={(e) =>
                                            appearanceForm.setData('settings', {
                                                ...appearanceForm.data.settings,
                                                hero_subtitle: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Hero Background Image">
                                    <Upload
                                        beforeUpload={(file) =>
                                            handleImageUpload(file, 'hero_background', 'appearance')
                                        }
                                        showUploadList={false}
                                    >
                                        <Button icon={<UploadOutlined />}>Upload Background</Button>
                                    </Upload>
                                    {appearanceForm.data.settings.hero_background && (
                                        <img
                                            src={appearanceForm.data.settings.hero_background}
                                            alt="Hero Background"
                                            style={{ marginTop: 10, maxHeight: 150, width: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </Form.Item>

                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={appearanceForm.processing}
                                    onClick={() => handleSubmit(appearanceForm)}
                                >
                                    Save Appearance Settings
                                </Button>
                            </Form>
                        </TabPane>

                        <TabPane tab="Contact & Social" key="contact">
                            <Form layout="vertical">
                                <Form.Item label="Contact Email">
                                    <Input
                                        size="large"
                                        type="email"
                                        value={contactForm.data.settings.contact_email}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                contact_email: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Contact Phone">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.contact_phone}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                contact_phone: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Contact Address">
                                    <TextArea
                                        rows={3}
                                        value={contactForm.data.settings.contact_address}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                contact_address: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <h3 style={{ marginTop: 24, marginBottom: 16 }}>Social Media Links</h3>

                                <Form.Item label="Facebook URL">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.facebook_url}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                facebook_url: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Twitter URL">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.twitter_url}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                twitter_url: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="LinkedIn URL">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.linkedin_url}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                linkedin_url: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="Instagram URL">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.instagram_url}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                instagram_url: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Form.Item label="YouTube URL">
                                    <Input
                                        size="large"
                                        value={contactForm.data.settings.youtube_url}
                                        onChange={(e) =>
                                            contactForm.setData('settings', {
                                                ...contactForm.data.settings,
                                                youtube_url: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={contactForm.processing}
                                    onClick={() => handleSubmit(contactForm)}
                                >
                                    Save Contact Settings
                                </Button>
                            </Form>
                        </TabPane>
                    </Tabs>
                </Card>
            </div>
        </AdminLayout>
    );
}
