import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Row,
    Select,
    Space,
    Spin,
    Tag,
    Typography,
    message,
} from 'antd';
import { HomeOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;

export default function HomeServicesIndex() {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = useMemo(() => {
        const byId = new Map();
        services.forEach((service) => {
            if (service.category?.id && !byId.has(service.category.id)) {
                byId.set(service.category.id, service.category);
            }
        });

        return Array.from(byId.values());
    }, [services]);

    const loadCities = async () => {
        try {
            const response = await window.axios.get('/patient/data/meta/cities');
            setCities(response.data?.data || response.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load cities.');
        }
    };

    const loadServices = async (filters = {}) => {
        setLoading(true);
        try {
            const response = await window.axios.get('/patient/data/home-services', { params: filters });
            setServices(response.data?.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load home services.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCities();
        loadServices();
    }, []);

    const applyFilters = async (nextCity = selectedCity, nextCategory = selectedCategory) => {
        const params = {};
        if (nextCity) params.city_id = nextCity;
        if (nextCategory) params.category_id = nextCategory;
        await loadServices(params);
    };

    return (
        <AdminLayout>
            <Head title="Home Services" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <Title level={3} style={{ marginBottom: 0 }}>Book Home Services</Title>
                        <Text type="secondary">Nurse, attendant, sample collection and home checkups at your doorstep.</Text>
                    </div>

                    <Space wrap>
                        <Link href="/patient/home-services/addresses">
                            <Button>Manage Addresses</Button>
                        </Link>
                        <Link href="/patient/home-services/bookings">
                            <Button icon={<HomeOutlined />}>My Home Bookings</Button>
                        </Link>
                        <Link href="/patient/home-services/book">
                            <Button type="primary" icon={<PlusOutlined />}>Book Now</Button>
                        </Link>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Choose a service and continue to booking."
                    description="Use city and category filters to discover services currently available for home visits."
                />

                <Card>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} md={10}>
                            <Select
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Filter by city"
                                value={selectedCity}
                                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                                onChange={async (value) => {
                                    setSelectedCity(value || null);
                                    await applyFilters(value || null, selectedCategory);
                                }}
                            />
                        </Col>
                        <Col xs={24} md={10}>
                            <Select
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Filter by category"
                                value={selectedCategory}
                                options={categories.map((category) => ({ value: category.id, label: category.name }))}
                                onChange={async (value) => {
                                    setSelectedCategory(value || null);
                                    await applyFilters(selectedCity, value || null);
                                }}
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <Button
                                block
                                onClick={async () => {
                                    setSelectedCity(null);
                                    setSelectedCategory(null);
                                    await loadServices();
                                }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Spin spinning={loading}>
                    {services.length === 0 ? (
                        <Card>
                            <Empty description="No home services found for selected filters." />
                        </Card>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {services.map((service) => (
                                <Col xs={24} md={12} xl={8} key={service.id}>
                                    <Card
                                        hoverable
                                        actions={[
                                            <Link key="book" href={`/patient/home-services/book?service_id=${service.id}`}>
                                                Book This Service
                                            </Link>,
                                        ]}
                                    >
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <Title level={5} style={{ margin: 0 }}>{service.name}</Title>
                                            <Space wrap>
                                                <Tag color="blue">{service.category?.name || 'General'}</Tag>
                                                <Tag>{service.duration_minutes} min</Tag>
                                                <Tag color="green">INR {service.base_price}</Tag>
                                            </Space>
                                            <Text type="secondary">
                                                {service.description || 'Home visit service with trained provider support.'}
                                            </Text>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Spin>
            </Space>
        </AdminLayout>
    );
}
