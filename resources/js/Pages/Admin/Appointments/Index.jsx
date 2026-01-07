import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export default function Index({ appointments }) {
    return (
        <AdminLayout>
            <Head title="Appointments Management" />

            <Card 
                title={
                    <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Appointments
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The appointments management feature is currently under development. You'll be able to view and manage all appointments here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No appointments available yet"
                />
            </Card>
        </AdminLayout>
    );
}
