import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { LocationProvider } from './Contexts/LocationContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const AppWithProviders = () => (
            <LocationProvider>
                <App {...props} />
            </LocationProvider>
        );

        if (import.meta.env.SSR) {
            hydrateRoot(el, <AppWithProviders />);
            return;
        }

        createRoot(el).render(<AppWithProviders />);
    },
    progress: {
        color: '#4B5563',
    },
});
