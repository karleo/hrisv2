import { Camera, MapPin } from 'lucide-react';

export type AttendanceRemarksEvidence = {
    check_in_remarks?: string | null;
    check_out_remarks?: string | null;
    check_in_photo_url?: string | null;
    check_out_photo_url?: string | null;
    check_in_latitude?: number | null;
    check_in_longitude?: number | null;
    check_out_latitude?: number | null;
    check_out_longitude?: number | null;
};

function mapsLink(lat: number, lng: number): string {
    return `https://maps.google.com/?q=${lat},${lng}`;
}

export function AttendanceRemarksCell({ row }: { row: AttendanceRemarksEvidence }) {
    if (!row.check_in_remarks && !row.check_out_remarks) {
        return <span>—</span>;
    }

    return (
        <div className="max-w-[180px] whitespace-pre-wrap text-xs">
            {row.check_in_remarks && (
                <div>
                    <span className="text-muted-foreground font-medium">In:</span> {row.check_in_remarks}
                </div>
            )}
            {row.check_out_remarks && (
                <div>
                    <span className="text-muted-foreground font-medium">Out:</span> {row.check_out_remarks}
                </div>
            )}
        </div>
    );
}

export function AttendanceEvidenceCell({ row }: { row: AttendanceRemarksEvidence }) {
    const hasCheckInLocation =
        row.check_in_latitude != null && row.check_in_longitude != null;
    const hasCheckOutLocation =
        row.check_out_latitude != null && row.check_out_longitude != null;
    const hasEvidence =
        hasCheckInLocation
        || hasCheckOutLocation
        || row.check_in_photo_url
        || row.check_out_photo_url;

    if (!hasEvidence) {
        return <span>—</span>;
    }

    return (
        <div className="flex flex-col gap-1 text-xs">
            {hasCheckInLocation && (
                <a
                    href={mapsLink(row.check_in_latitude!, row.check_in_longitude!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                >
                    <MapPin className="size-3" />
                    In
                </a>
            )}
            {hasCheckOutLocation && (
                <a
                    href={mapsLink(row.check_out_latitude!, row.check_out_longitude!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                >
                    <MapPin className="size-3" />
                    Out
                </a>
            )}
            {row.check_in_photo_url && (
                <a
                    href={row.check_in_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                >
                    <Camera className="size-3" />
                    Photo In
                </a>
            )}
            {row.check_out_photo_url && (
                <a
                    href={row.check_out_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                >
                    <Camera className="size-3" />
                    Photo Out
                </a>
            )}
        </div>
    );
}
