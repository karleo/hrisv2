import { Head, useForm } from '@inertiajs/react';
import { Database, HardDrive } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StorageSettingsPayload = {
    driver: 'local' | 's3';
    aws_access_key_id: string | null;
    aws_default_region: string | null;
    aws_bucket: string | null;
    aws_url: string | null;
    aws_use_path_style_endpoint: boolean;
    has_aws_secret: boolean;
    source: 'database' | 'env';
    updated_at: string | null;
};

type StorageStatus = {
    mode: 'local' | 's3';
    default_disk: string;
    public_disk_driver: string;
    symlink: {
        link: string;
        target: string;
        exists: boolean;
        is_link: boolean;
        current_target: string | null;
        healthy: boolean;
    };
    s3: {
        configured: boolean;
        bucket: string | null;
        region: string | null;
        url: string | null;
    };
    instructions: string[];
};

type DatabaseInfo = {
    connection: string;
    driver: string;
    backups: Array<{
        name: string;
        size: number;
        created_at: string;
    }>;
};

type ResultPayload = {
    success: boolean;
    messages: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System maintenance',
        href: '/settings/storage-maintenance',
    },
];

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StorageMaintenanceSettings({
    settings,
    status,
    database,
    maintenanceResult,
    databaseResult,
}: {
    settings: StorageSettingsPayload;
    status: StorageStatus;
    database: DatabaseInfo;
    maintenanceResult: ResultPayload | null;
    databaseResult: ResultPayload | null;
}) {
    const settingsForm = useForm({
        driver: settings.driver,
        aws_access_key_id: settings.aws_access_key_id ?? '',
        aws_secret_access_key: '',
        aws_default_region: settings.aws_default_region ?? 'us-east-1',
        aws_bucket: settings.aws_bucket ?? '',
        aws_url: settings.aws_url ?? '',
        aws_use_path_style_endpoint: settings.aws_use_path_style_endpoint,
    });

    const maintenanceForm = useForm({
        force: false,
    });

    const backupForm = useForm({});

    const restoreStoredForm = useForm({
        backup_name: '',
        confirm_restore: false,
    });

    const restoreForm = useForm<{
        backup_file: File | null;
        confirm_restore: boolean;
    }>({
        backup_file: null,
        confirm_restore: false,
    });

    const canRestoreUpload =
        restoreForm.data.backup_file !== null && restoreForm.data.confirm_restore;

    const submitRestoreUpload = (): void => {
        if (!canRestoreUpload) {
            return;
        }

        restoreForm
            .transform((data) => ({
                backup_file: data.backup_file,
                confirm_restore: data.confirm_restore ? '1' : '0',
            }))
            .post('/settings/storage-maintenance/database/restore', {
                forceFormData: true,
            });
    };

    const submitRestoreStored = (backupName: string): void => {
        if (!restoreStoredForm.data.confirm_restore) {
            return;
        }

        if (!window.confirm(`Restore database from ${backupName}? This will overwrite the current database.`)) {
            return;
        }

        restoreStoredForm
            .transform(() => ({
                backup_name: backupName,
                confirm_restore: '1',
            }))
            .post('/settings/storage-maintenance/database/restore-stored');
    };

    const isLocal = settingsForm.data.driver === 'local';
    const restoreExtension = database.driver === 'sqlite' ? '.sqlite or .db' : '.sql';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System maintenance" />

            <div className="space-y-6 p-4">
                <Heading
                    variant="small"
                    title="System maintenance"
                    description="Configure file storage (local disk or AWS S3), verify uploads, and backup or restore the database"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="size-5" />
                            Storage configuration
                        </CardTitle>
                        <CardDescription>
                            Choose local disk or AWS S3 for uploads. Settings are saved in the database and override .env at runtime.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Active source</span>
                            <Badge variant="outline">
                                {settings.source === 'database' ? 'Saved settings' : '.env fallback'}
                            </Badge>
                            {settings.updated_at && (
                                <span className="text-muted-foreground">
                                    Updated {new Date(settings.updated_at).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="driver">Storage driver</Label>
                            <Select
                                value={settingsForm.data.driver}
                                onValueChange={(value) =>
                                    settingsForm.setData('driver', value as 'local' | 's3')
                                }
                            >
                                <SelectTrigger id="driver">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="local">Local disk</SelectItem>
                                    <SelectItem value="s3">AWS S3 bucket</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={settingsForm.errors.driver} />
                        </div>

                        {!isLocal && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <p className="text-sm font-medium">AWS S3 configuration</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="aws_access_key_id">Access key ID</Label>
                                        <Input
                                            id="aws_access_key_id"
                                            value={settingsForm.data.aws_access_key_id}
                                            onChange={(event) =>
                                                settingsForm.setData('aws_access_key_id', event.target.value)
                                            }
                                        />
                                        <InputError message={settingsForm.errors.aws_access_key_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="aws_secret_access_key">Secret access key</Label>
                                        <Input
                                            id="aws_secret_access_key"
                                            type="password"
                                            value={settingsForm.data.aws_secret_access_key}
                                            onChange={(event) =>
                                                settingsForm.setData('aws_secret_access_key', event.target.value)
                                            }
                                            placeholder={
                                                settings.has_aws_secret
                                                    ? 'Stored securely (leave blank to keep current)'
                                                    : 'Enter secret access key'
                                            }
                                        />
                                        <InputError message={settingsForm.errors.aws_secret_access_key} />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="aws_default_region">Region</Label>
                                        <Input
                                            id="aws_default_region"
                                            value={settingsForm.data.aws_default_region}
                                            onChange={(event) =>
                                                settingsForm.setData('aws_default_region', event.target.value)
                                            }
                                            placeholder="us-east-1"
                                        />
                                        <InputError message={settingsForm.errors.aws_default_region} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="aws_bucket">Bucket name</Label>
                                        <Input
                                            id="aws_bucket"
                                            value={settingsForm.data.aws_bucket}
                                            onChange={(event) =>
                                                settingsForm.setData('aws_bucket', event.target.value)
                                            }
                                        />
                                        <InputError message={settingsForm.errors.aws_bucket} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="aws_url">Public URL base (optional)</Label>
                                    <Input
                                        id="aws_url"
                                        value={settingsForm.data.aws_url}
                                        onChange={(event) =>
                                            settingsForm.setData('aws_url', event.target.value)
                                        }
                                        placeholder="https://your-bucket.s3.amazonaws.com"
                                    />
                                    <InputError message={settingsForm.errors.aws_url} />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="aws_use_path_style_endpoint"
                                        checked={settingsForm.data.aws_use_path_style_endpoint}
                                        onCheckedChange={(checked) =>
                                            settingsForm.setData(
                                                'aws_use_path_style_endpoint',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label htmlFor="aws_use_path_style_endpoint">
                                        Use path-style S3 endpoint (MinIO / compatible services)
                                    </Label>
                                </div>
                            </div>
                        )}

                        <Button
                            disabled={settingsForm.processing}
                            onClick={() => settingsForm.put('/settings/storage-maintenance')}
                            type="button"
                        >
                            Save storage settings
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Current storage status</CardTitle>
                        <CardDescription>
                            Active disk: {status.default_disk} · Public driver: {status.public_disk_driver}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {status.mode === 'local' ? (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground">Symlink</span>
                                    <Badge variant={status.symlink.healthy ? 'default' : 'destructive'}>
                                        {status.symlink.healthy ? 'Healthy' : 'Needs attention'}
                                    </Badge>
                                </div>
                                <p>
                                    <span className="text-muted-foreground">Link:</span>{' '}
                                    <code className="text-xs">{status.symlink.link}</code>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground">S3 credentials</span>
                                    <Badge variant={status.s3.configured ? 'default' : 'destructive'}>
                                        {status.s3.configured ? 'Configured' : 'Incomplete'}
                                    </Badge>
                                </div>
                                <p>
                                    <span className="text-muted-foreground">Bucket:</span>{' '}
                                    {status.s3.bucket ?? 'Not set'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {maintenanceResult && (
                    <Alert variant={maintenanceResult.success ? 'default' : 'destructive'}>
                        <AlertTitle>
                            {maintenanceResult.success ? 'Storage maintenance completed' : 'Storage maintenance failed'}
                        </AlertTitle>
                        <AlertDescription className="space-y-1">
                            {maintenanceResult.messages.map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Run storage maintenance</CardTitle>
                        <CardDescription>
                            Local: create or verify <code className="text-xs">public/storage</code>. S3: test bucket write access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status.mode === 'local' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="force"
                                    checked={maintenanceForm.data.force}
                                    onCheckedChange={(checked) =>
                                        maintenanceForm.setData('force', checked === true)
                                    }
                                />
                                <Label htmlFor="force">Force recreate symlink if it is missing or incorrect</Label>
                            </div>
                        )}
                        <Button
                            disabled={maintenanceForm.processing}
                            onClick={() => maintenanceForm.post('/settings/storage-maintenance/run')}
                            type="button"
                        >
                            Run storage maintenance
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="size-5" />
                            Database backup & restore
                        </CardTitle>
                        <CardDescription>
                            Connection: {database.connection} ({database.driver}). Backups are stored on the server under storage/app/backups/database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Button
                            variant="outline"
                            disabled={backupForm.processing}
                            onClick={() => backupForm.post('/settings/storage-maintenance/database/backup')}
                            type="button"
                        >
                            {backupForm.processing ? 'Creating backup…' : 'Create database backup'}
                        </Button>

                        {database.backups.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Recent backups on server</p>
                                <ul className="space-y-2 text-sm">
                                    {database.backups.map((backup) => (
                                        <li
                                            key={backup.name}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                                        >
                                            <div className="text-muted-foreground">
                                                <p className="font-medium text-foreground">{backup.name}</p>
                                                <p>
                                                    {formatBytes(backup.size)} ·{' '}
                                                    {new Date(backup.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <a
                                                        href={`/settings/storage-maintenance/database/download/${encodeURIComponent(backup.name)}`}
                                                    >
                                                        Download
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={
                                                        restoreStoredForm.processing ||
                                                        !restoreStoredForm.data.confirm_restore
                                                    }
                                                    onClick={() => submitRestoreStored(backup.name)}
                                                    type="button"
                                                >
                                                    Restore
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex items-center space-x-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                            <Checkbox
                                id="confirm_restore_stored"
                                checked={restoreStoredForm.data.confirm_restore}
                                onCheckedChange={(checked) =>
                                    restoreStoredForm.setData('confirm_restore', checked === true)
                                }
                            />
                            <Label htmlFor="confirm_restore_stored">
                                I understand restoring a backup will overwrite the current database
                            </Label>
                        </div>

                        <div className="space-y-4 rounded-lg border border-destructive/30 p-4">
                            <p className="text-sm font-medium text-destructive">Restore database</p>
                            <p className="text-sm text-muted-foreground">
                                Upload a {restoreExtension} backup file. This overwrites the current database. Create a backup first.
                            </p>
                            <div className="grid gap-2">
                                <Label htmlFor="backup_file">Backup file</Label>
                                <Input
                                    id="backup_file"
                                    type="file"
                                    accept={database.driver === 'sqlite' ? '.sqlite,.db' : '.sql'}
                                    onChange={(event) =>
                                        restoreForm.setData(
                                            'backup_file',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <InputError message={restoreForm.errors.backup_file} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="confirm_restore"
                                    checked={restoreForm.data.confirm_restore}
                                    onCheckedChange={(checked) =>
                                        restoreForm.setData('confirm_restore', checked === true)
                                    }
                                />
                                <Label htmlFor="confirm_restore">
                                    I understand this will overwrite the current database
                                </Label>
                            </div>
                            <InputError message={restoreForm.errors.confirm_restore} />
                            <Button
                                variant="destructive"
                                disabled={restoreForm.processing || !canRestoreUpload}
                                onClick={submitRestoreUpload}
                                type="button"
                            >
                                {restoreForm.processing ? 'Restoring…' : 'Restore uploaded backup'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {databaseResult && (
                    <Alert variant={databaseResult.success ? 'default' : 'destructive'}>
                        <AlertTitle>
                            {databaseResult.success ? 'Database operation completed' : 'Database operation failed'}
                        </AlertTitle>
                        <AlertDescription className="space-y-1">
                            {databaseResult.messages.map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                <Alert>
                    <AlertTitle>Storage instructions</AlertTitle>
                    <AlertDescription className="space-y-1">
                        {status.instructions.map((item) => (
                            <p key={item}>{item}</p>
                        ))}
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
