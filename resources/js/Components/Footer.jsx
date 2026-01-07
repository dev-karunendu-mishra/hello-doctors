import { Link, useForm } from '@inertiajs/react';
import { Row, Col, Input, Button, Typography, message } from 'antd';
import { 
    FacebookOutlined, 
    TwitterOutlined, 
    LinkedinOutlined, 
    InstagramOutlined, 
    YoutubeOutlined,
    MailOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Footer() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const handleSubscribe = (e) => {
        e.preventDefault();
        
        post('/subscribe', {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Successfully subscribed to updates!');
                reset('email');
            },
            onError: (errors) => {
                if (errors.email) {
                    message.error(errors.email);
                } else {
                    message.error('Failed to subscribe. Please try again.');
                }
            }
        });
    };

    return (
        <footer className="bg-gray-800 text-white">
            <div className="container mx-auto px-4 py-12">
                <Row gutter={[32, 32]}>
                    {/* For Patients */}
                    <Col xs={24} sm={12} lg={6}>
                        <Title level={4} className="text-slate-300 font-semibold mb-4" style={{ color: '#cbd5e1' }}>
                            FOR PATIENTS
                        </Title>
                        <div className="flex flex-col space-y-2">
                            <Link href="/find-doctor" className="text-gray-300 hover:text-white transition-colors">
                                Find right doctor
                            </Link>
                            <Link href="/find-hospital" className="text-gray-300 hover:text-white transition-colors">
                                Find right hospital
                            </Link>
                            <Link href="/find-blood-donor" className="text-gray-300 hover:text-white transition-colors">
                                Find blood donor
                            </Link>
                        </div>
                    </Col>

                    {/* For Partners */}
                    <Col xs={24} sm={12} lg={6}>
                        <Title level={4} className="text-slate-300 font-semibold mb-4" style={{ color: '#cbd5e1' }}>
                            FOR PARTNERS
                        </Title>
                        <div className="flex flex-col space-y-2">
                            <Link href="/health-grade" className="text-gray-300 hover:text-white transition-colors">
                                Health grade for hospitals
                            </Link>
                            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                                Hospital client login
                            </Link>
                            <Link href="/advertise" className="text-gray-300 hover:text-white transition-colors">
                                Advertise with us
                            </Link>
                        </div>
                    </Col>

                    {/* Register Here */}
                    <Col xs={24} sm={12} lg={6}>
                        <Title level={4} className="text-slate-300 font-semibold mb-4" style={{ color: '#cbd5e1' }}>
                            REGISTER HERE
                        </Title>
                        <div className="flex flex-col space-y-2">
                            <Link href="/register?type=doctor" className="text-gray-300 hover:text-white transition-colors">
                                Register as a Doctor
                            </Link>
                            <Link href="/register?type=hospital" className="text-gray-300 hover:text-white transition-colors">
                                Register as a Hospital
                            </Link>
                            <Link href="/register?type=blood-donor" className="text-gray-300 hover:text-white transition-colors">
                                Register as a Blood donor
                            </Link>
                        </div>
                    </Col>

                    {/* About Us & Subscribe */}
                    <Col xs={24} sm={12} lg={6}>
                        <Title level={4} className="text-slate-300 font-semibold mb-4" style={{ color: '#cbd5e1' }}>
                            ABOUT US
                        </Title>
                        <div className="flex flex-col space-y-2 mb-6">
                            <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                                Terms and conditions
                            </Link>
                            <Link href="/career" className="text-gray-300 hover:text-white transition-colors">
                                Career
                            </Link>
                            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                                Contact Us
                            </Link>
                        </div>

                        <Title level={5} className="text-slate-300 font-semibold mb-3" style={{ color: '#cbd5e1' }}>
                            SUBSCRIBE FOR UPDATES
                        </Title>
                        <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                prefix={<MailOutlined />}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="bg-white"
                                disabled={processing}
                            />
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                block
                                loading={processing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Subscribe →
                            </Button>
                        </form>

                        {/* Social Media Icons */}
                        <div className="flex space-x-3 mt-4">
                            <a 
                                href="https://facebook.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-blue-600 flex items-center justify-center transition-colors"
                            >
                                <FacebookOutlined className="text-white text-lg" />
                            </a>
                            <a 
                                href="https://twitter.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-blue-400 flex items-center justify-center transition-colors"
                            >
                                <TwitterOutlined className="text-white text-lg" />
                            </a>
                            <a 
                                href="https://linkedin.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-blue-700 flex items-center justify-center transition-colors"
                            >
                                <LinkedinOutlined className="text-white text-lg" />
                            </a>
                            <a 
                                href="https://instagram.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-pink-600 flex items-center justify-center transition-colors"
                            >
                                <InstagramOutlined className="text-white text-lg" />
                            </a>
                            <a 
                                href="https://youtube.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-red-600 flex items-center justify-center transition-colors"
                            >
                                <YoutubeOutlined className="text-white text-lg" />
                            </a>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700 py-6">
                <div className="container mx-auto px-4">
                    <div className="text-center text-gray-400">
                        <Text className="text-gray-400">
                            powered by <span className="text-white font-semibold">Networkid</span>
                            [An ISO Certified company]. All rights reserved.
                        </Text>
                    </div>
                </div>
            </div>
        </footer>
    );
}
