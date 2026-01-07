import { useForm } from '@inertiajs/react';
import { Card, Form, Input, Button, message, Space, Divider } from 'antd';
import { SaveOutlined, GlobalOutlined, GoogleOutlined, FacebookOutlined, TwitterOutlined } from '@ant-design/icons';
import AdminLayout from '@/Layouts/AdminLayout';

const { TextArea } = Input;

export default function SeoSettings({ settings }) {
    const form = useForm({
        settings: settings,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('admin.seo.update'), {
            preserveScroll: true,
            onSuccess: () => {
                message.success('SEO settings updated successfully');
            },
            onError: (errors) => {
                message.error('Failed to update SEO settings');
                console.error(errors);
            },
        });
    };

    const updateSetting = (key, value) => {
        form.setData('settings', {
            ...form.data.settings,
            [key]: value,
        });
    };

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>
                <h1 style={{ marginBottom: 24 }}>SEO Settings</h1>

                <Card>
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <h3>
                            <GlobalOutlined /> Basic Meta Tags
                        </h3>
                        <Divider />

                        <Form.Item
                            label="Meta Title"
                            help="Recommended length: 50-60 characters"
                        >
                            <Input
                                size="large"
                                value={form.data.settings.meta_title}
                                onChange={(e) => updateSetting('meta_title', e.target.value)}
                                placeholder="Your site title"
                                maxLength={60}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item
                            label="Meta Description"
                            help="Recommended length: 150-160 characters"
                        >
                            <TextArea
                                rows={3}
                                value={form.data.settings.meta_description}
                                onChange={(e) => updateSetting('meta_description', e.target.value)}
                                placeholder="Brief description of your site"
                                maxLength={160}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item
                            label="Meta Keywords"
                            help="Comma-separated keywords"
                        >
                            <Input
                                size="large"
                                value={form.data.settings.meta_keywords}
                                onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                                placeholder="keyword1, keyword2, keyword3"
                            />
                        </Form.Item>

                        <Form.Item label="Meta Author">
                            <Input
                                size="large"
                                value={form.data.settings.meta_author}
                                onChange={(e) => updateSetting('meta_author', e.target.value)}
                                placeholder="Author or company name"
                            />
                        </Form.Item>

                        <h3 style={{ marginTop: 32 }}>
                            <FacebookOutlined /> Open Graph (Facebook)
                        </h3>
                        <Divider />

                        <Form.Item label="OG Title">
                            <Input
                                size="large"
                                value={form.data.settings.og_title}
                                onChange={(e) => updateSetting('og_title', e.target.value)}
                                placeholder="Title for social media sharing"
                            />
                        </Form.Item>

                        <Form.Item label="OG Description">
                            <TextArea
                                rows={3}
                                value={form.data.settings.og_description}
                                onChange={(e) => updateSetting('og_description', e.target.value)}
                                placeholder="Description for social media sharing"
                            />
                        </Form.Item>

                        <Form.Item
                            label="OG Image URL"
                            help="Recommended size: 1200x630px"
                        >
                            <Input
                                size="large"
                                value={form.data.settings.og_image}
                                onChange={(e) => updateSetting('og_image', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </Form.Item>

                        <h3 style={{ marginTop: 32 }}>
                            <TwitterOutlined /> Twitter Card
                        </h3>
                        <Divider />

                        <Form.Item label="Twitter Card Type">
                            <Input
                                size="large"
                                value={form.data.settings.twitter_card}
                                onChange={(e) => updateSetting('twitter_card', e.target.value)}
                                placeholder="summary_large_image"
                            />
                        </Form.Item>

                        <Form.Item label="Twitter Site Handle">
                            <Input
                                size="large"
                                value={form.data.settings.twitter_site}
                                onChange={(e) => updateSetting('twitter_site', e.target.value)}
                                placeholder="@yourusername"
                            />
                        </Form.Item>

                        <h3 style={{ marginTop: 32 }}>
                            <GoogleOutlined /> Tracking & Analytics
                        </h3>
                        <Divider />

                        <Form.Item label="Google Analytics ID">
                            <Input
                                size="large"
                                value={form.data.settings.google_analytics_id}
                                onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                                placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                            />
                        </Form.Item>

                        <Form.Item label="Google Site Verification Code">
                            <Input
                                size="large"
                                value={form.data.settings.google_site_verification}
                                onChange={(e) => updateSetting('google_site_verification', e.target.value)}
                                placeholder="Verification code from Google Search Console"
                            />
                        </Form.Item>

                        <Form.Item label="Facebook Pixel ID">
                            <Input
                                size="large"
                                value={form.data.settings.facebook_pixel_id}
                                onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                                placeholder="Facebook Pixel ID"
                            />
                        </Form.Item>

                        <h3 style={{ marginTop: 32 }}>Advanced SEO</h3>
                        <Divider />

                        <Form.Item
                            label="Robots.txt Content"
                            help="Controls how search engines crawl your site"
                        >
                            <TextArea
                                rows={6}
                                value={form.data.settings.robots_txt}
                                onChange={(e) => updateSetting('robots_txt', e.target.value)}
                                placeholder="User-agent: *&#10;Disallow: /admin/&#10;Allow: /"
                                style={{ fontFamily: 'monospace' }}
                            />
                        </Form.Item>

                        <Form.Item label="Sitemap URL">
                            <Input
                                size="large"
                                value={form.data.settings.sitemap_url}
                                onChange={(e) => updateSetting('sitemap_url', e.target.value)}
                                placeholder="/sitemap.xml"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<SaveOutlined />}
                            loading={form.processing}
                        >
                            Save SEO Settings
                        </Button>
                    </Form>
                </Card>
            </div>
        </AdminLayout>
    );
}
