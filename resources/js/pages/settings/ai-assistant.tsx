import { Head, useForm, usePage } from '@inertiajs/react';
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

type SettingsPayload = {
    enabled: boolean;
    provider: string;
    model: string;
    base_url: string;
    max_history: number;
    rate_limit: number;
    has_api_key: boolean;
    last_tested_at: string | null;
    last_test_status: string | null;
    last_test_message: string | null;
    source: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee assistant',
        href: '/settings/ai-assistant',
    },
];

export default function AiAssistantSettings({
    settings,
    modelOptions,
    refreshInstructions,
}: {
    settings: SettingsPayload;
    modelOptions: string[];
    refreshInstructions: string[];
}) {
    const page = usePage<{ flash?: { success?: string } }>();
    const form = useForm({
        enabled: settings.enabled,
        provider: settings.provider || 'openai',
        model: settings.model || 'gpt-4o-mini',
        api_key: '',
        base_url: settings.base_url || 'https://api.openai.com/v1',
        max_history: settings.max_history || 20,
        rate_limit: settings.rate_limit || 20,
        test_message: 'Reply with exactly: OK',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee assistant settings" />

            <div className="space-y-6 p-4">
                <Heading
                    variant="small"
                    title="Employee assistant configuration"
                    description="Manage OpenAI settings for the employee AI assistant"
                />

                {page.props.flash?.success ? (
                    <Alert>
                        <AlertTitle>Saved</AlertTitle>
                        <AlertDescription>{page.props.flash.success}</AlertDescription>
                    </Alert>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Connection status</CardTitle>
                        <CardDescription>
                            Current source:{' '}
                            {settings.source === 'database'
                                ? 'Database settings'
                                : '.env fallback'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Assistant enabled
                            </span>
                            <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                                {settings.enabled ? 'Yes' : 'No'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                API key stored
                            </span>
                            <Badge variant={settings.has_api_key ? 'default' : 'destructive'}>
                                {settings.has_api_key ? 'Configured' : 'Missing'}
                            </Badge>
                        </div>
                        {settings.last_tested_at ? (
                            <div className="text-sm text-muted-foreground">
                                Last test: {new Date(settings.last_tested_at).toLocaleString()}{' '}
                                ({settings.last_test_status})
                                {settings.last_test_message
                                    ? ` — ${settings.last_test_message}`
                                    : ''}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>OpenAI settings</CardTitle>
                        <CardDescription>
                            Settings are stored in the database and override .env values when valid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="enabled"
                                checked={form.data.enabled}
                                onCheckedChange={(checked) =>
                                    form.setData('enabled', checked === true)
                                }
                            />
                            <Label htmlFor="enabled">Enable employee assistant</Label>
                        </div>
                        <InputError message={form.errors.enabled} />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="model">Model</Label>
                                <Select
                                    value={form.data.model}
                                    onValueChange={(value) => form.setData('model', value)}
                                >
                                    <SelectTrigger id="model">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.map((model) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.model} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="base_url">API base URL</Label>
                                <Input
                                    id="base_url"
                                    value={form.data.base_url}
                                    onChange={(event) =>
                                        form.setData('base_url', event.target.value)
                                    }
                                    placeholder="https://api.openai.com/v1"
                                />
                                <InputError message={form.errors.base_url} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="api_key">OpenAI API key</Label>
                            <Input
                                id="api_key"
                                type="password"
                                value={form.data.api_key}
                                onChange={(event) =>
                                    form.setData('api_key', event.target.value)
                                }
                                placeholder={
                                    settings.has_api_key
                                        ? 'Leave blank to keep the stored key'
                                        : 'sk-...'
                                }
                                autoComplete="off"
                            />
                            <InputError message={form.errors.api_key} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="max_history">Max history messages</Label>
                                <Input
                                    id="max_history"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={form.data.max_history}
                                    onChange={(event) =>
                                        form.setData(
                                            'max_history',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                                <InputError message={form.errors.max_history} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="rate_limit">Rate limit (per minute)</Label>
                                <Input
                                    id="rate_limit"
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={form.data.rate_limit}
                                    onChange={(event) =>
                                        form.setData(
                                            'rate_limit',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                                <InputError message={form.errors.rate_limit} />
                            </div>
                        </div>

                        <Button
                            disabled={form.processing}
                            onClick={() => form.put('/settings/ai-assistant')}
                            type="button"
                        >
                            Save assistant settings
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Test OpenAI connection</CardTitle>
                        <CardDescription>
                            Uses current form values instantly, even unsaved changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="test_message">Test prompt</Label>
                            <Input
                                id="test_message"
                                value={form.data.test_message}
                                onChange={(event) =>
                                    form.setData('test_message', event.target.value)
                                }
                            />
                            <InputError message={form.errors.test_message} />
                        </div>
                        <Button
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => form.post('/settings/ai-assistant/test')}
                            type="button"
                        >
                            Run connection test
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
