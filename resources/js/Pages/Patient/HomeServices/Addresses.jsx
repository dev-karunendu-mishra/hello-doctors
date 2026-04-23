import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    message,
} from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined, AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
const AddressPickerMap = lazy(() => import('@/Components/maps/AddressPickerMap'));

const { Title, Text } = Typography;

export default function HomeServiceAddresses() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [cities, setCities] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [locating, setLocating] = useState(false);
    const [shouldLoadMap, setShouldLoadMap] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const mapContainerRef = useRef(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [addressRes, citiesRes] = await Promise.all([
                window.axios.get('/patient/data/addresses'),
                window.axios.get('/patient/data/meta/cities'),
            ]);

            setAddresses(addressRes.data?.data || []);
            setCities(citiesRes.data?.data || citiesRes.data || []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to load address data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!modalOpen || shouldLoadMap || !mapContainerRef.current || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setShouldLoadMap(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px 0px' }
        );

        observer.observe(mapContainerRef.current);

        return () => observer.disconnect();
    }, [modalOpen, shouldLoadMap]);

    const normalizeCityName = (value) => {
        const normalized = String(value || '').trim().toLowerCase();

        if (normalized === 'prayagraj') {
            return 'allahabad';
        }

        return normalized;
    };

    const findMatchingCityId = (address = {}) => {
        const candidates = [
            address.city,
            address.town,
            address.village,
            address.county,
            address.state_district,
            address.state,
        ]
            .map((value) => normalizeCityName(value))
            .filter(Boolean);

        const matchedCity = cities.find((city) => candidates.includes(normalizeCityName(city.name)));

        return matchedCity?.id;
    };

    const syncCoordinatesToForm = (latitude, longitude) => {
        const nextCoordinates = {
            lat: Number(latitude),
            lng: Number(longitude),
        };

        setSelectedCoords(nextCoordinates);
        form.setFieldsValue({
            latitude: nextCoordinates.lat.toFixed(6),
            longitude: nextCoordinates.lng.toFixed(6),
        });

        return nextCoordinates;
    };

    const reverseGeocodeCoordinates = async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed with status ${response.status}`);
            }

            const data = await response.json();
            const address = data.address || {};
            const cityId = findMatchingCityId(address);
            const line1 = [address.house_number, address.road || address.pedestrian || address.hamlet]
                .filter(Boolean)
                .join(', ');
            const line2 = [address.suburb || address.neighbourhood, address.city_district]
                .filter(Boolean)
                .join(', ');
            const landmark = address.landmark || address.amenity || address.building || address.suburb || '';

            form.setFieldsValue({
                line1: line1 || form.getFieldValue('line1'),
                line2: line2 || form.getFieldValue('line2'),
                landmark: landmark || form.getFieldValue('landmark'),
                pincode: address.postcode || form.getFieldValue('pincode'),
                city_id: cityId || form.getFieldValue('city_id'),
                latitude: Number(latitude).toFixed(6),
                longitude: Number(longitude).toFixed(6),
            });
        } catch (error) {
            console.error('Failed to reverse geocode selected location:', error);
        }
    };

    const handleLocationSelection = async (coords, shouldAutofillAddress = false) => {
        const nextCoordinates = syncCoordinatesToForm(coords.lat, coords.lng);

        if (shouldAutofillAddress) {
            await reverseGeocodeCoordinates(nextCoordinates.lat, nextCoordinates.lng);
        }
    };

    const detectCurrentLocation = () => {
        if (!navigator.geolocation) {
            message.error('Geolocation is not supported in this browser.');
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await handleLocationSelection({ lat: latitude, lng: longitude }, true);
                message.success('Current location detected. You can fine-tune it on the map.');
                setLocating(false);
            },
            (error) => {
                const errorMessage = error.code === error.PERMISSION_DENIED
                    ? 'Location permission was denied. Please enable it in your browser.'
                    : 'Unable to detect your current location right now.';

                message.error(errorMessage);
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const openCreateModal = () => {
        setEditingAddress(null);
        setSelectedCoords(null);
        form.resetFields();
        form.setFieldsValue({ label: 'Home', is_default: addresses.length === 0 });
        setModalOpen(true);
    };

    const openEditModal = (address) => {
        setEditingAddress(address);

        const latitude = Number(address.latitude);
        const longitude = Number(address.longitude);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            setSelectedCoords({ lat: latitude, lng: longitude });
        } else {
            setSelectedCoords(null);
        }

        form.setFieldsValue({
            ...address,
            is_default: !!address.is_default,
        });
        setModalOpen(true);
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            if (editingAddress) {
                await window.axios.put(`/patient/data/addresses/${editingAddress.id}`, values);
                message.success('Address updated successfully.');
            } else {
                await window.axios.post('/patient/data/addresses', values);
                message.success('Address saved successfully.');
            }

            setModalOpen(false);
            await loadData();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error?.response?.data?.message || 'Failed to save address.');
        } finally {
            setSaving(false);
        }
    };

    const deleteAddress = async (addressId) => {
        try {
            await window.axios.delete(`/patient/data/addresses/${addressId}`);
            message.success('Address deleted successfully.');
            await loadData();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to delete address.');
        }
    };

    return (
        <AdminLayout>
            <Head title="Home Service Addresses" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Home Service Addresses</Title>
                    <Space>
                        <Link href="/patient/home-services/book">
                            <Button type="default">Back to Booking</Button>
                        </Link>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                            Add Address
                        </Button>
                    </Space>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="Maintain accurate address details for faster provider dispatch."
                />

                <Row gutter={[16, 16]}>
                    {addresses.map((address) => (
                        <Col xs={24} md={12} key={address.id}>
                            <Card
                                loading={loading}
                                title={
                                    <Space>
                                        <span>{address.label || 'Home'}</span>
                                        {address.is_default ? <Text type="success">(Default)</Text> : null}
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(address)}>
                                            Edit
                                        </Button>
                                        <Popconfirm
                                            title="Delete this address?"
                                            description="This action cannot be undone."
                                            onConfirm={() => deleteAddress(address.id)}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />}>
                                                Delete
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                }
                            >
                                <Space direction="vertical" size={4}>
                                    <Text strong>{address.contact_name} ({address.contact_phone})</Text>
                                    <Text>{address.line1}</Text>
                                    {address.line2 ? <Text>{address.line2}</Text> : null}
                                    {address.landmark ? <Text type="secondary">Landmark: {address.landmark}</Text> : null}
                                    <Text>{address.city?.name} - {address.pincode}</Text>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {!loading && addresses.length === 0 ? (
                    <Card>
                        <Text type="secondary">No addresses found. Add your first address to start booking.</Text>
                    </Card>
                ) : null}
            </Space>

            <Modal
                title={editingAddress ? 'Edit Address' : 'Add New Address'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={onSubmit}
                confirmLoading={saving}
                destroyOnClose
                width={760}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}> 
                                <Select
                                    options={[
                                        { value: 'Home', label: 'Home' },
                                        { value: 'Office', label: 'Office' },
                                        { value: 'Other', label: 'Other' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_name" label="Contact Name" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="contact_phone" label="Contact Phone" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="line1" label="Address Line 1" rules={[{ required: true, message: 'Required' }]}> 
                        <Input />
                    </Form.Item>

                    <Form.Item name="line2" label="Address Line 2">
                        <Input />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col xs={24} md={8}>
                            <Form.Item name="landmark" label="Landmark">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Required' }]}> 
                                <Select options={cities.map((city) => ({ value: city.id, label: city.name }))} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: 'Required' }]}> 
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col xs={24} md={12}>
                            <Form.Item name="latitude" label="Latitude">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="longitude" label="Longitude">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="Use your current location or click on the map to pin the service address precisely."
                    />

                    <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
                        <Space wrap>
                            <Button icon={<AimOutlined />} onClick={detectCurrentLocation} loading={locating}>
                                Use Current Location
                            </Button>
                            <Text type="secondary">
                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                {selectedCoords
                                    ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`
                                    : 'Click on the map or use your current location to fill coordinates.'}
                            </Text>
                        </Space>

                        <div ref={mapContainerRef}>
                            {shouldLoadMap ? (
                                <Suspense
                                    fallback={(
                                        <Card size="small">
                                            <Text type="secondary">Loading map...</Text>
                                        </Card>
                                    )}
                                >
                                    <AddressPickerMap
                                        position={selectedCoords}
                                        isVisible={modalOpen}
                                        onChange={handleLocationSelection}
                                    />
                                </Suspense>
                            ) : (
                                <Card size="small">
                                    <Text type="secondary">Preparing map...</Text>
                                </Card>
                            )}
                        </div>
                    </Space>

                    <Form.Item name="is_default" label="Default Address" valuePropName="checked">
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
