<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    translate="no"
    class="notranslate"
    @class(['dark' => ($appearance ?? 'system') == 'dark'])
>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="google" content="notranslate">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/images/prime-logistics-mark.png" type="image/png">
        <link rel="apple-touch-icon" href="/images/prime-logistics-mark.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        {{-- crypto.randomUUID is unavailable on plain HTTP; patch before any app scripts load. --}}
        <script>
            (function () {
                if (typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function') {
                    return;
                }

                function fallbackRandomUuid() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
                        var random = (Math.random() * 16) | 0;
                        var value = char === 'x' ? random : (random & 0x3) | 0x8;

                        return value.toString(16);
                    });
                }

                if (typeof window.crypto === 'undefined') {
                    window.crypto = { randomUUID: fallbackRandomUuid };
                } else {
                    window.crypto.randomUUID = fallbackRandomUuid;
                }
            })();
        </script>

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased notranslate" translate="no">
        @inertia
    </body>
</html>
