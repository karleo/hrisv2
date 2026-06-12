import { cameraDeniedHelp, geolocationDeniedHelp } from '@/lib/device-permissions';

type Props = {
    type: 'camera' | 'location';
    message: string;
};

export function AttendancePermissionHelp({ type, message }: Props) {
    const isDenied =
        message.toLowerCase().includes('denied')
        || message.toLowerCase().includes('blocked')
        || message.toLowerCase().includes('permission');

    if (!isDenied) {
        return <p className="text-destructive text-sm">{message}</p>;
    }

    const help = type === 'camera' ? cameraDeniedHelp() : geolocationDeniedHelp();

    return (
        <div className="bg-destructive/5 border-destructive/20 flex flex-col gap-2 rounded-md border p-3">
            <p className="text-destructive text-sm font-medium">{message}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{help}</p>
        </div>
    );
}
