import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const shouldRunWayfinder = process.env.SKIP_WAYFINDER !== '1';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        ...(shouldRunWayfinder
            ? [
                  wayfinder({
                      formVariants: true,
                      command: 'php artisan wayfinder:generate --no-interaction',
                  }),
              ]
            : []),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
