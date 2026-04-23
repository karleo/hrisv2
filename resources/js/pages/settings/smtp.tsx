import { Head, useForm } from '@inertiajs/react';
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

type Preset = {
    label: string;
    host: string;
    port: number;
    encryption: 'tls' | 'ssl' | null;
    notes: string;
};

type SettingsPayload = {
    mail_enabled: boolean;
    workflow_email_enabled: boolean;
    provider_preset: string;
    host: string;
    port: number;
    encryption: 'tls' | 'ssl' | null;
    username: string | null;
    timeout: number | null;
    from_address: string;
    from_name: string;
    has_password: boolean;
    last_tested_at: string | null;
    last_test_status: string | null;
    last_test_message: string | null;
    source: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SMTP settings',
        href: '/settings/smtp',
    },
];

export default function SmtpSettings({
    settings,
    presets,
    refreshInstructions,
}: {
    settings: SettingsPayload;
    presets: Record<string, Preset>;
    refreshInstructions: string[];
}) {
    const form = useForm({
        mail_enabled: settings.mail_enabled,
        workflow_email_enabled: settings.workflow_email_enabled,
        provider_preset: settings.provider_preset || 'custom',
        host: settings.host || '',
        port: settings.port || 587,
        encryption: settings.encryption || 'tls',
        username: settings.username || '',
        password: '',
        timeout: settings.timeout || 30,
        from_address: settings.from_address || '',
        from_name: settings.from_name || '',
        test_email: '',
    });

    const selectedPreset = presets[form.data.provider_preset] ?? presets.custom;

    const applyPreset = (key: string): void => {
        const preset = presets[key];
        form.setData('provider_preset', key);

        if (!preset) {
            return;
        }

        if (preset.host !== '') {
            form.setData('host', preset.host);
        }

        form.setData('port', preset.port);
        form.setData('encryption', preset.encryption || 'tls');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SMTP settings" />

            <div className="space-y-6 p-4">
                <Heading
                    variant="small"
                    title="SMTP configuration"
                    description="Manage mail delivery settings and run live connection tests"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Connection status</CardTitle>
                        <CardDescription>
                            Current source: {settings.source === 'database' ? 'Database settings' : '.env fallback'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Mail enabled</span>
                            <Badge variant={form.data.mail_enabled ? 'default' : 'destructive'}>
                                {form.data.mail_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Last tested: {settings.last_tested_at ? new Date(settings.last_tested_at).toLocaleString() : 'Never'}
                        </div>
                        {settings.last_test_status && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Last result</span>
                                <Badge variant={settings.last_test_status === 'success' ? 'default' : 'destructive'}>
                                    {settings.last_test_status}
                                </Badge>
                            </div>
                        )}
                        {settings.last_test_message && (
                            <p className="text-sm text-muted-foreground">{settings.last_test_message}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>SMTP setup</CardTitle>
                        <CardDescription>
                            Presets help auto-fill provider defaults. You can still customize values.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="mail_enabled"
                                checked={form.data.mail_enabled}
                                onCheckedChange={(checked) => form.setData('mail_enabled', checked === true)}
                            />
                            <Label htmlFor="mail_enabled">Enable outgoing email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="workflow_email_enabled"
                                checked={form.data.workflow_email_enabled}
                                onCheckedChange={(checked) => form.setData('workflow_email_enabled', checked === true)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="workflow_email_enabled">Enable workflow approval emails</Label>
                                <p className="text-xs text-muted-foreground">
                                    Controls only request workflow emails (Leave, IT, IT Asset, Employee requests).
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="provider_preset">Provider preset</Label>
                            <Select
                                value={form.data.provider_preset}
                                onValueChange={applyPreset}
                            >
                                <SelectTrigger id="provider_preset">
                                    <SelectValue placeholder="Select a provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(presets).map(([key, preset]) => (
                                        <SelectItem key={key} value={key}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedPreset && (
                                <p className="text-sm text-muted-foreground">{selectedPreset.notes}</p>
                            )}
                        </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="host">SMTP host</Label>
                                    <Input
                                        id="host"
                                        value={form.data.host}
                                        onChange={(event) => form.setData('host', event.target.value)}
                                    />
                                    <InputError message={form.errors.host} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="port">Port</Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        value={form.data.port}
                                        onChange={(event) => form.setData('port', Number(event.target.value))}
                                    />
                                    <InputError message={form.errors.port} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="encryption">Encryption</Label>
                                    <Select
                                        value={form.data.encryption}
                                        onValueChange={(value) => form.setData('encryption', value as 'tls' | 'ssl')}
                                    >
                                        <SelectTrigger id="encryption">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">TLS</SelectItem>
                                            <SelectItem value="ssl">SSL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.encryption} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        value={form.data.timeout ?? ''}
                                        onChange={(event) => form.setData('timeout', Number(event.target.value))}
                                    />
                                    <InputError message={form.errors.timeout} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={form.data.username}
                                        onChange={(event) => form.setData('username', event.target.value)}
                                    />
                                    <InputError message={form.errors.username} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        placeholder={settings.has_password ? 'Stored securely (leave blank to keep current)' : 'Enter SMTP password'}
                                    />
                                    <InputError message={form.errors.password} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="from_address">From email address</Label>
                                    <Input
                                        id="from_address"
                                        value={form.data.from_address}
                                        onChange={(event) => form.setData('from_address', event.target.value)}
                                    />
                                    <InputError message={form.errors.from_address} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="from_name">From name</Label>
                                    <Input
                                        id="from_name"
                                        value={form.data.from_name}
                                        onChange={(event) => form.setData('from_name', event.target.value)}
                                    />
                                    <InputError message={form.errors.from_name} />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    disabled={form.processing}
                                    onClick={() => form.put('/settings/smtp')}
                                    type="button"
                                >
                                    Save SMTP settings
                                </Button>
                            </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Send test email</CardTitle>
                        <CardDescription>
                            Uses current form values instantly, even unsaved changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="test_email">Test recipient email</Label>
                            <Input
                                id="test_email"
                                value={form.data.test_email}
                                onChange={(event) => form.setData('test_email', event.target.value)}
                                placeholder="recipient@example.com"
                            />
                            <InputError message={form.errors.test_email} />
                        </div>
                        <Button
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => form.post('/settings/smtp/test')}
                            type="button"
                        >
                            Send test email
                        </Button>
                    </CardContent>
                </Card>

                <Alert>
                    <AlertTitle>Operational notes</AlertTitle>
                    <AlertDescription className="space-y-1">
                        {refreshInstructions.map((item) => (
                            <p key={item}>{item}</p>
                        ))}
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
