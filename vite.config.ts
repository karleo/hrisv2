import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig, loadEnv } from 'vite';

function shellQuoteIfNeeded(value: string): string {
    return /\s/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const shouldRunWayfinder = process.env.SKIP_WAYFINDER !== '1';

    const wayfinderCommandOverride =
        env.WAYFINDER_COMMAND?.trim() || process.env.WAYFINDER_COMMAND?.trim();
    const wayfinderPhp =
        env.WAYFINDER_PHP?.trim() ||
        process.env.WAYFINDER_PHP?.trim() ||
        'php';
    const wayfinderCommand =
        wayfinderCommandOverride ??
        `${shellQuoteIfNeeded(wayfinderPhp)} artisan wayfinder:generate --no-interaction`;

    return {
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
                          command: wayfinderCommand,
                      }),
                  ]
                : []),
        ],
        esbuild: {
            jsx: 'automatic',
        },
    };
});
