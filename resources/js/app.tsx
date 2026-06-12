import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { ensureRandomUuidSupport } from './lib/random-uuid';

ensureRandomUuidSupport();

const appName = import.meta.env.VITE_APP_NAME || 'ahamed';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const initialLocale = String((props.initialPage.props as { locale?: string }).locale ?? 'en');
        if (typeof window !== 'undefined') {
            window.document.documentElement.lang = initialLocale;
            window.document.documentElement.dir = initialLocale === 'ar' ? 'rtl' : 'ltr';
        }

        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#1b2046',
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();
