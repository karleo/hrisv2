import axios from 'axios';

type PageWithCsrf = {
    props?: {
        csrf_token?: unknown;
    };
};

/**
 * Inertia posts via axios without a hidden `_token` field. Laravel accepts the
 * token via the `X-CSRF-TOKEN` header instead.
 */
export function syncAxiosCsrfFromPage(page: PageWithCsrf | null | undefined): void {
    const fromProps =
        page?.props && typeof page.props.csrf_token === 'string' ? page.props.csrf_token : '';
    const fromMeta =
        typeof document !== 'undefined'
            ? (document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '')
            : '';
    const token = fromProps || fromMeta;
    if (token.length > 0) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
}
