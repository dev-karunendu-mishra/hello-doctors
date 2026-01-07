import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card, Empty, Alert } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';

export default function FindDoctors() {
    return (
        <AdminLayout>
            <Head title="Find Doctors" />

            <Card 
                title={
                    <span>
                        <MedicineBoxOutlined style={{ marginRight: 8 }} />
                        Find Doctors
                    </span>
                }
            >
                <Alert
                    message="Coming Soon"
                    description="The doctor search feature is currently under development. You'll be able to search and find doctors here soon."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Doctor search coming soon"
                />
            </Card>
        </AdminLayout>
    );
}
