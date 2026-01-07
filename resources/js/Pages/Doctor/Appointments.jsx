import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export default function Appointments() {
    return (
        <AdminLayout>
            <Head title="My Appointments" />

            <Card 
                title={
                    <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        My Appointments
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The appointments feature is currently under development. You'll be able to view and manage your appointments here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No appointments scheduled yet"
                />
            </Card>
        </AdminLayout>
    );
}
