/**
 * Headers for same-origin JSON requests that must pass Laravel's CSRF checks.
 * Uses both the meta tag token and the encrypted XSRF-TOKEN cookie (when present).
 */
export function getJsonRequestIntegrityHeaders(
    inertiaCsrfToken?: string | null,
): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (typeof document === 'undefined') {
        return headers;
    }

    const metaToken =
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? '';

    const cookieRow = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
    const cookieRaw = cookieRow ? cookieRow.slice('XSRF-TOKEN='.length) : '';
    let xsrfFromCookie = '';
    if (cookieRaw !== '') {
        try {
            xsrfFromCookie = decodeURIComponent(cookieRaw);
        } catch {
            xsrfFromCookie = cookieRaw;
        }
    }

    const csrf = (inertiaCsrfToken ?? metaToken).trim();
    if (csrf !== '') {
        headers['X-CSRF-TOKEN'] = csrf;
    }

    if (xsrfFromCookie !== '') {
        headers['X-XSRF-TOKEN'] = xsrfFromCookie;
    }

    return headers;
}
