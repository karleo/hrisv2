import axios from 'axios';
import { getJsonRequestIntegrityHeaders } from '@/lib/request-integrity-headers';

type PageWithCsrf = {
    props?: Record<string, unknown>;
};

/**
 * Keeps Axios defaults aligned with Laravel CSRF expectations (meta + XSRF cookie),
 * matching how Inertia-driven forms behave.
 */
export function syncAxiosCsrfFromPage(page: unknown): void {
    const p = page as PageWithCsrf | null | undefined;
    const raw = p?.props?.csrf_token;
    const fromProps = typeof raw === 'string' ? raw : '';

    const headers = getJsonRequestIntegrityHeaders(
        fromProps.length > 0 ? fromProps : undefined,
    );

    Object.assign(axios.defaults.headers.common, headers);
}
