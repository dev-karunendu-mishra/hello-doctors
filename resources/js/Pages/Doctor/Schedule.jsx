import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

export default function Schedule() {
    return (
        <AdminLayout>
            <Head title="My Schedule" />

            <Card 
                title={
                    <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Schedule Management
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The schedule management feature is currently under development. You'll be able to manage your working hours and availability here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No schedule configured yet"
                />
            </Card>
        </AdminLayout>
    );
}
