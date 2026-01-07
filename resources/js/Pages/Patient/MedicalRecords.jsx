import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

export default function MedicalRecords() {
    return (
        <AdminLayout>
            <Head title="Medical Records" />

            <Card 
                title={
                    <span>
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        Medical Records
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The medical records feature is currently under development. You'll be able to view your medical history here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No medical records available"
                />
            </Card>
        </AdminLayout>
    );
}
