import { usePage } from '@inertiajs/react';
import ar from '@/locales/ar';
import en from '@/locales/en';

export type SupportedLocale = 'en' | 'ar';

type Dictionary = Record<string, string>;

const dictionaries: Record<SupportedLocale, Dictionary> = {
    en,
    ar,
};

function isSupportedLocale(locale: string): locale is SupportedLocale {
    return locale === 'en' || locale === 'ar';
}

function replaceParams(template: string, params?: Record<string, string | number>): string {
    if (!params) {
        return template;
    }

    return Object.entries(params).reduce((value, [key, paramValue]) => {
        return value.replaceAll(`{${key}}`, String(paramValue));
    }, template);
}

export function resolveLocale(rawLocale: unknown): SupportedLocale {
    const locale = String(rawLocale ?? '').toLowerCase();
    return isSupportedLocale(locale) ? locale : 'en';
}

export function translateKey(
    locale: SupportedLocale,
    key: string,
    fallback?: string,
    params?: Record<string, string | number>,
): string {
    const dictionary = dictionaries[locale] ?? dictionaries.en;
    const text = dictionary[key] ?? fallback ?? key;
    return replaceParams(text, params);
}

export function useI18n(options?: { forceLocale?: SupportedLocale }) {
    const pageProps = usePage().props as { locale?: string };
    const locale = options?.forceLocale ?? resolveLocale(pageProps.locale);

    return {
        locale,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
        t: (key: string, fallback?: string, params?: Record<string, string | number>) =>
            translateKey(locale, key, fallback, params),
    };
}

