export type NotificationItemData = {
    request_code?: string;
    request_type?: string;
    request_date?: string;
    route?: string;
    request_id?: number;
    decision?: string;
    document_name?: string;
    expiry_date?: string;
    document_notification_stage?: string;
    document_status?: string;
    /** Public-disk profile photo (`/storage/...`). Submitter on new requests; approver on decision alerts. */
    employee_photo_url?: string | null;
};

export function notificationHref(item: { data?: NotificationItemData }): string {
    const direct = item.data?.route;
    if (direct) {
        return direct;
    }

    const requestId = item.data?.request_id;
    if (!requestId) {
        return '#';
    }

    switch (item.data?.request_type) {
        case 'leave_request':
            return `/leave-requests/${requestId}`;
        case 'employee_request':
            return `/employee-requests/${requestId}`;
        case 'it_request':
            return `/it-requests/${requestId}`;
        case 'it_asset':
            return `/it-assets/${requestId}`;
        case 'employee_document_expiry':
            return '/my-profile';
        default:
            return '#';
    }
}

export function formatRequestDate(value?: string): string {
    if (!value) {
        return '';
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return value;
    }
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
}

export function formatRequestType(value?: string): string {
    if (!value) {
        return 'Request';
    }
    const labels: Record<string, string> = {
        leave_request: 'Leave Request Form',
        employee_request: 'Employee Request Form',
        it_request: 'IT Request Form',
        it_asset_request: 'IT Asset Request Form',
        employee_document_expiry: 'Document Expiry Alert',
    };
    return labels[value] ?? 'Request Form';
}

/**
 * Secondary line under the request code. For manager decisions on any request form
 * (`leave_request`, `employee_request`, `it_request`, `it_asset_request`), the API stores
 * `decision: approved|rejected` and we show “… • Approved” / “… • Rejected”. Submission
 * alerts (no `decision`) keep “Tap to open request”.
 */
export function formatNotificationSubtext(data?: NotificationItemData): string {
    const typeLabel = formatRequestType(data?.request_type);
    const decision = data?.decision?.toLowerCase();
    const expiryDate = formatRequestDate(data?.expiry_date ?? data?.request_date);
    const stage = data?.document_notification_stage?.toLowerCase();

    if (data?.request_type === 'employee_document_expiry') {
        if (stage === 'expired_final') {
            return expiryDate ? `${typeLabel} • Expired on ${expiryDate}` : `${typeLabel} • Expired`;
        }

        return expiryDate ? `${typeLabel} • Expires on ${expiryDate}` : typeLabel;
    }

    if (decision === 'approved') {
        return `${typeLabel} • Approved`;
    }
    if (decision === 'rejected') {
        return `${typeLabel} • Rejected`;
    }

    return `${typeLabel} • Tap to open request`;
}
