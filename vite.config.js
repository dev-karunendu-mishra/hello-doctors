import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }

                    if (id.includes('@inertiajs') || id.includes('react') || id.includes('scheduler')) {
                        return 'vendor-react';
                    }

                    if (id.includes('@ant-design/icons')) {
                        return 'vendor-antd-icons';
                    }

                    if (id.includes('/antd/es/table') || id.includes('/antd/es/list') || id.includes('/rc-table') || id.includes('/rc-virtual-list')) {
                        return 'vendor-antd-data';
                    }

                    if (id.includes('/antd/es/date-picker') || id.includes('/antd/es/time-picker') || id.includes('/antd/es/calendar') || id.includes('/rc-picker')) {
                        return 'vendor-antd-datetime';
                    }

                    if (id.includes('antd') || id.includes('/rc-')) {
                        return 'vendor-antd-core';
                    }

                    if (id.includes('@fullcalendar')) {
                        return 'vendor-calendar';
                    }

                    if (id.includes('leaflet') || id.includes('react-leaflet')) {
                        return 'vendor-maps';
                    }

                    return 'vendor';
                },
            },
        },
    },
});
