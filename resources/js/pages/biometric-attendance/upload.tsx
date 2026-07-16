import { Link, useForm, usePage } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { type FormEvent, useRef } from 'react';
import { BiometricAttendanceNav } from '@/components/biometric-attendance-nav';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import BiometricAttendanceLayout from '@/layouts/biometric-attendance-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Biometric attendance', href: '/biometric-attendance' },
    { title: 'Upload file', href: '/biometric-attendance/upload' },
];

type DeviceRow = {
    id: number;
    name: string;
    host: string | null;
    timezone: string;
    is_active: boolean;
};

type SupportedFormat = {
    id: string;
    label: string;
};

export default function BiometricUpload(props: {
    devices: DeviceRow[];
    canUpload: boolean;
    supportedFormats: SupportedFormat[];
}) {
    return (
        <BiometricAttendanceLayout breadcrumbs={breadcrumbs} title="Upload biometric file">
            <BiometricUploadContent {...props} />
        </BiometricAttendanceLayout>
    );
}

function BiometricUploadContent({
    devices,
    canUpload,
    supportedFormats,
}: {
    devices: DeviceRow[];
    canUpload: boolean;
    supportedFormats: SupportedFormat[];
}) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeDevices = devices.filter((device) => device.is_active);
    const defaultDeviceId = activeDevices[0]?.id ? String(activeDevices[0].id) : '';

    const { data, setData, post, processing, errors, reset } = useForm<{
        biometric_device_id: string;
        file: File | null;
        format: string;
    }>({
        biometric_device_id: defaultDeviceId,
        file: null,
        format: '',
    });

    function clearFileSelection(): void {
        reset('file');
        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    }

    function submitUpload(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (!canUpload || data.file === null) {
            return;
        }

        post('/biometric-attendance/upload', {
            forceFormData: true,
            onSuccess: () => {
                clearFileSelection();
            },
        });
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <Heading
                title="Upload file"
                description="Import attendance from a ZKTeco or compatible biometric export when the device is offline or you have a saved file."
            />
            <BiometricAttendanceNav currentPath="/biometric-attendance/upload" />

            {flash?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
                    {flash.error}
                </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                <strong>Supported exports:</strong> ZKTeco ATTLOG (.txt / .dat) and CSV reports from ZKTeco,
                ZKBioTime, or similar terminals. Each row needs a device PIN (user ID) and punch date/time. Assign the
                file to the device that recorded the punches so timezone and employee mapping stay correct.
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Upload attendance file</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Choose the device, then select a file exported from the terminal or attendance software. Duplicate
                        punches are skipped automatically.
                    </p>
                </CardHeader>
                <CardContent>
                    {!canUpload && (
                        <p className="text-muted-foreground mb-4 text-sm">
                            Your role needs Biometric attendance → Update to upload files.
                        </p>
                    )}

                    {devices.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No devices configured.{' '}
                            <Link href="/biometric-attendance" className="text-primary underline">
                                Add a device
                            </Link>{' '}
                            first.
                        </p>
                    ) : activeDevices.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No active devices.{' '}
                            <Link href="/biometric-attendance" className="text-primary underline">
                                Activate a device
                            </Link>{' '}
                            before uploading.
                        </p>
                    ) : (
                        <form className="grid gap-4" onSubmit={submitUpload}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="biometric_device_id">Device</Label>
                                    <NativeSelect
                                        id="biometric_device_id"
                                        value={data.biometric_device_id}
                                        onChange={(event) => setData('biometric_device_id', event.target.value)}
                                        required
                                    >
                                        {activeDevices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.name}
                                                {device.host ? ` (${device.host})` : ''}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    {errors.biometric_device_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.biometric_device_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="format">File format (optional)</Label>
                                    <NativeSelect
                                        id="format"
                                        value={data.format}
                                        onChange={(event) => setData('format', event.target.value)}
                                    >
                                        <option value="">Auto-detect</option>
                                        {supportedFormats.map((format) => (
                                            <option key={format.id} value={format.id}>
                                                {format.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    {errors.format && <p className="mt-1 text-sm text-red-600">{errors.format}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="file">Attendance file</Label>
                                <Input
                                    id="file"
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt,.dat,.tsv,text/csv,text/plain"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        setData('file', file);
                                    }}
                                    required
                                />
                                {data.file && (
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Selected: {data.file.name} ({Math.ceil(data.file.size / 1024)} KB)
                                    </p>
                                )}
                                {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={processing || !canUpload || data.file === null}>
                                    <Upload className="mr-2 size-4" />
                                    {processing ? 'Uploading…' : 'Upload & import'}
                                </Button>
                                {data.file && (
                                    <Button type="button" variant="outline" onClick={clearFileSelection}>
                                        Clear file
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">How to export from ZKTeco</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3 text-sm">
                    <p>
                        <strong>ATTLOG (.txt / .dat):</strong> Tab-separated lines like{' '}
                        <code className="text-xs">1001 2026-05-21 08:30:00 0</code> (PIN, timestamp, in/out status).
                        Export from ZKBioTime, device USB download, or ADMS backup tools.
                    </p>
                    <p>
                        <strong>CSV report:</strong> Export from the device web Report page or ZKBioTime with columns
                        such as <em>User ID</em>, <em>Date</em>, <em>Time</em>, and optionally <em>State</em> or{' '}
                        <em>Status</em>.
                    </p>
                    <p>
                        After upload, review imported rows under{' '}
                        <Link href="/biometric-attendance/punches" className="text-primary underline">
                            Raw punches
                        </Link>{' '}
                        and the import summary in{' '}
                        <Link href="/biometric-attendance/sync-logs" className="text-primary underline">
                            Sync history
                        </Link>
                        .
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
