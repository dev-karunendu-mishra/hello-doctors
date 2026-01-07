import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export default function Patients() {
    return (
        <AdminLayout>
            <Head title="My Patients" />

            <Card 
                title={
                    <span>
                        <UserOutlined style={{ marginRight: 8 }} />
                        My Patients
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The patient management feature is currently under development. You'll be able to view and manage your patients here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No patients assigned yet"
                />
            </Card>
        </AdminLayout>
    );
}
