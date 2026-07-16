import { router } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { AttendancePhotoCapture } from '@/components/attendance-photo-capture';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AttendancePermissionHelp } from '@/components/attendance-permission-help';
import { useGeolocation } from '@/hooks/use-geolocation';

type OpenEntry = {
    source: 'manual' | 'biometric';
    id: number | null;
    biometric_session_id: number | null;
    clock_in_at: string;
    work_mode: string | null;
    work_mode_label: string;
    requires_field_evidence: boolean;
};

type Props = {
    openEntry: OpenEntry;
    // Trigger element (defaults to a "Check out" button)
    trigger?: React.ReactNode;
    onSuccess?: () => void;
};

export function AttendanceCheckOutDialog({ openEntry, trigger, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [dailySummary, setDailySummary] = useState('');
    const [remarks, setRemarks] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const geo = useGeolocation();
    const isField = openEntry.requires_field_evidence;

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setDailySummary('');
            setRemarks('');
            setPhoto(null);
            setErrors({});
            geo.reset();
        }
        setOpen(next);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (isField && !photo) {
            newErrors['check_out_photo'] = 'A photo is required to check out from field work.';
        }

        if (isField && geo.state.status !== 'acquired') {
            newErrors['check_out_latitude'] = 'GPS location is required to check out from field work.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) {
            return;
        }

        setProcessing(true);

        const formData = new FormData();

        if (dailySummary.trim()) {
            formData.append('daily_summary', dailySummary.trim());
        }

        if (remarks.trim()) {
            formData.append('check_out_remarks', remarks.trim());
        }

        if (photo) {
            formData.append('check_out_photo', photo);
        }

        if (geo.state.status === 'acquired') {
            formData.append('check_out_latitude', String(geo.state.latitude));
            formData.append('check_out_longitude', String(geo.state.longitude));
        }

        router.post('/time-attendance/check-out', formData, {
            forceFormData: true,
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
            onSuccess: () => {
                setOpen(false);
                onSuccess?.();
            },
            onFinish: () => setProcessing(false),
        });
    };

    const checkedInAt = new Date(openEntry.clock_in_at).toLocaleString();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? <Button variant="outline">Check out</Button>}
            </DialogTrigger>
            <DialogContent className="top-[4dvh] flex max-h-[92dvh] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:top-[50%] sm:max-w-md sm:translate-y-[-50%] sm:gap-4 sm:p-6">
                <DialogHeader className="shrink-0 px-4 pt-4 text-left sm:px-0 sm:pt-0">
                    <DialogTitle>Check Out</DialogTitle>
                    <DialogDescription>
                        Checked in since {checkedInAt} · {openEntry.work_mode_label}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-0 sm:pb-0">
                    {/* GPS location (required for field) */}
                    <div className="flex flex-col gap-2">
                        <Label>
                            Current location
                            {isField && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {geo.state.status === 'acquired' ? (
                            <div className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                                <MapPin className="text-primary size-4 shrink-0" />
                                <span>
                                    {geo.state.latitude.toFixed(6)}, {geo.state.longitude.toFixed(6)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto h-auto px-1 py-0"
                                    onClick={geo.reset}
                                >
                                    Clear
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 w-full touch-manipulation gap-2 sm:w-auto"
                                onClick={geo.acquire}
                                disabled={geo.state.status === 'loading'}
                            >
                                <MapPin className="size-4" />
                                {geo.state.status === 'loading'
                                    ? 'Getting location… allow access when asked'
                                    : isField
                                        ? 'Allow location & get GPS'
                                        : 'Allow location (optional)'}
                            </Button>
                        )}
                        {geo.state.status === 'error' && (
                            <AttendancePermissionHelp type="location" message={geo.state.message} />
                        )}
                        {errors['check_out_latitude'] && (
                            <p className="text-destructive text-sm">{errors['check_out_latitude']}</p>
                        )}
                    </div>

                    {/* Photo capture (required for field) */}
                    <AttendancePhotoCapture
                        label="Check-out photo"
                        required={isField}
                        onCapture={setPhoto}
                        error={errors['check_out_photo']}
                    />

                    {/* Optional remarks */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="check_out_remarks">Remarks (optional)</Label>
                        <Textarea
                            id="check_out_remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={2}
                            maxLength={2000}
                            placeholder="Notes about your field work today…"
                        />
                    </div>

                    {/* Daily summary */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="daily_summary">What did you work on today? (optional)</Label>
                        <Textarea
                            id="daily_summary"
                            value={dailySummary}
                            onChange={(e) => setDailySummary(e.target.value)}
                            rows={3}
                            maxLength={5000}
                            placeholder="Notes or bullet list of tasks…"
                        />
                        {errors['daily_summary'] && (
                            <p className="text-destructive text-sm">{errors['daily_summary']}</p>
                        )}
                    </div>

                    {errors['check_out'] && (
                        <p className="text-destructive text-sm">{errors['check_out']}</p>
                    )}
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t px-4 py-4 sm:border-0 sm:px-0 sm:py-0">
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 w-full touch-manipulation sm:w-auto"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="min-h-11 w-full touch-manipulation sm:w-auto"
                        onClick={handleSubmit}
                        disabled={processing}
                    >
                        {processing ? 'Checking out…' : 'Check out now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
