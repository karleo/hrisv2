import { router } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { AttendancePhotoCapture } from '@/components/attendance-photo-capture';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGeolocation } from '@/hooks/use-geolocation';

export type WorkModeOption = {
    value: string;
    label: string;
    is_field: boolean;
};

type Props = {
    // Available work modes from the server
    workModeOptions: WorkModeOption[];
    // Trigger element (defaults to a "Check in" button)
    trigger?: React.ReactNode;
    // Called after a successful check-in so parent can close or refresh
    onSuccess?: () => void;
};

export function AttendanceCheckInDialog({ workModeOptions, trigger, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<string>(workModeOptions[0]?.value ?? '');
    const [remarks, setRemarks] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const geo = useGeolocation();

    const currentMode = workModeOptions.find((m) => m.value === selectedMode);
    const isField = currentMode?.is_field ?? false;

    // Reset form when dialog closes
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelectedMode(workModeOptions[0]?.value ?? '');
            setRemarks('');
            setPhoto(null);
            setErrors({});
            geo.reset();
        }
        setOpen(next);
    };

    // Client-side validation before submitting
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedMode) {
            newErrors['work_mode'] = 'Please select a work mode.';
        }

        if (isField && !photo) {
            newErrors['check_in_photo'] = 'A photo is required for field work.';
        }

        if (isField && geo.state.status !== 'acquired') {
            newErrors['check_in_latitude'] = 'GPS location is required for field work.';
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
        formData.append('work_mode', selectedMode);

        if (remarks.trim()) {
            formData.append('check_in_remarks', remarks.trim());
        }

        if (photo) {
            formData.append('check_in_photo', photo);
        }

        if (geo.state.status === 'acquired') {
            formData.append('check_in_latitude', String(geo.state.latitude));
            formData.append('check_in_longitude', String(geo.state.longitude));
        }

        // POST to the time-attendance store endpoint
        router.post('/time-attendance', formData, {
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? <Button>Check in</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Check In</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    {/* Work mode selector */}
                    <div className="flex flex-col gap-2">
                        <Label>Where are you working today?</Label>
                        <div className="grid gap-2">
                            {workModeOptions.map((mode) => (
                                <label
                                    key={mode.value}
                                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                                        selectedMode === mode.value
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="work_mode"
                                        value={mode.value}
                                        checked={selectedMode === mode.value}
                                        onChange={() => setSelectedMode(mode.value)}
                                        className="accent-primary"
                                    />
                                    <span>{mode.label}</span>
                                    {mode.is_field && (
                                        <span className="text-muted-foreground ml-auto text-xs">
                                            Photo + GPS required
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                        {errors['work_mode'] && (
                            <p className="text-destructive text-sm">{errors['work_mode']}</p>
                        )}
                    </div>

                    {/* GPS location */}
                    <div className="flex flex-col gap-2">
                        <Label>
                            Location
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
                                className="gap-2"
                                onClick={geo.acquire}
                                disabled={geo.state.status === 'loading'}
                            >
                                <MapPin className="size-4" />
                                {geo.state.status === 'loading' ? 'Getting location…' : isField ? 'Get my location (required)' : 'Get my location (optional)'}
                            </Button>
                        )}
                        {geo.state.status === 'error' && (
                            <p className="text-destructive text-sm">{geo.state.message}</p>
                        )}
                        {errors['check_in_latitude'] && (
                            <p className="text-destructive text-sm">{errors['check_in_latitude']}</p>
                        )}
                    </div>

                    {/* Photo capture */}
                    <AttendancePhotoCapture
                        label="Check-in photo"
                        required={isField}
                        onCapture={setPhoto}
                        error={errors['check_in_photo']}
                    />

                    {/* Optional remarks */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="check_in_remarks">Remarks (optional)</Label>
                        <Textarea
                            id="check_in_remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder="Any notes about today's work location…"
                        />
                        {errors['check_in_remarks'] && (
                            <p className="text-destructive text-sm">{errors['check_in_remarks']}</p>
                        )}
                    </div>

                    {errors['check_in'] && (
                        <p className="text-destructive text-sm">{errors['check_in']}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={processing}>
                        {processing ? 'Checking in…' : 'Check in now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
