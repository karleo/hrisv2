import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, ScanFace } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import LoginBrandHeader from '@/components/auth/login-brand-header';
import InputError from '@/components/input-error';
import LiveFaceScanner, { type LiveFaceScannerHandle } from '@/components/live-face-scanner';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLoginSplitLayout from '@/layouts/auth/auth-login-split-layout';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const fieldShell = cn(
    'relative flex items-stretch rounded-2xl border transition-[border-color,box-shadow,background-color] duration-200',
    'border-zinc-200/95 bg-zinc-50/90 shadow-sm',
    'focus-within:border-[#3CA99B] focus-within:ring-[3px] focus-within:ring-[#3CA99B]/18 focus-within:outline-none',
    'dark:border-zinc-700/90 dark:bg-zinc-900/55 dark:focus-within:border-[#5ec4b6] dark:focus-within:ring-[#5ec4b6]/15',
);

const fieldInput = cn(
    'h-12 min-w-0 flex-1 border-0 bg-transparent px-0 text-base shadow-none sm:text-[0.9375rem]',
    'text-zinc-900 placeholder:text-zinc-400',
    'focus-visible:ring-0 dark:text-zinc-50 dark:placeholder:text-zinc-500',
);

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [useFaceLogin, setUseFaceLogin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [faceSampleVersion, setFaceSampleVersion] = useState(0);
    const { errors: pageErrors } = usePage<{
        errors?: Record<string, string>;
    }>().props;
    const faceScannerRef = useRef<LiveFaceScannerHandle>(null);
    const latestFaceRef = useRef<File | null>(null);
    const loginInFlightRef = useRef(false);
    const lastAutoSignInSampleVersionRef = useRef(-1);
    const [hasFaceSample, setHasFaceSample] = useState(false);

    const onPreviewFaceCapture = useCallback((file: File) => {
        latestFaceRef.current = file;
        setHasFaceSample(true);
        setFaceSampleVersion((v) => v + 1);
    }, []);

    const { data, setData, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const errors = pageErrors ?? {};
    const hasEmailIdentifier = data.email.trim().length > 0;

    const performLogin = useCallback(async (): Promise<void> => {
        if (loginInFlightRef.current) {
            return;
        }

        const snapshot =
            latestFaceRef.current ??
            (await faceScannerRef.current?.grabSnapshot());

        loginInFlightRef.current = true;
        setSubmitting(true);

        const payload: Record<string, string | File> = {
            email: data.email.trim(),
            password: data.password || 'face-only-login',
        };
        if (data.remember) {
            payload.remember = 'on';
        }
        if (snapshot) {
            payload.face_capture = snapshot;
        }

        router.post('/login', payload, {
            forceFormData: true,
            preserveScroll: true,
            onError: (formErrors) => {
                if (formErrors.face_capture) {
                    setHasFaceSample(false);
                }
            },
            onFinish: () => {
                latestFaceRef.current = null;
                loginInFlightRef.current = false;
                setSubmitting(false);
            },
            onSuccess: () => {
                setHasFaceSample(false);
                reset('password');
            },
        });
    }, [data.email, data.password, data.remember, reset]);

    async function handleSubmit(e: FormEvent): Promise<void> {
        e.preventDefault();
        await performLogin();
    }

    const processing = submitting;
    const faceCaptureErrorMessage =
        typeof errors.face_capture === 'string' ? errors.face_capture : '';
    const isFaceRateLimited =
        faceCaptureErrorMessage.toLowerCase().includes('too many face verification attempts');
    const hasFaceVerificationError = Boolean(errors.face_capture);
    const readyToAutoSignIn =
        useFaceLogin && hasEmailIdentifier && hasFaceSample && !processing && !isFaceRateLimited;

    useEffect(() => {
        if (!useFaceLogin || loginInFlightRef.current || isFaceRateLimited) {
            return;
        }

        if (!hasEmailIdentifier) {
            return;
        }

        if (!hasFaceSample) {
            return;
        }

        if (faceSampleVersion <= lastAutoSignInSampleVersionRef.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            lastAutoSignInSampleVersionRef.current = faceSampleVersion;
            void performLogin();
        }, 200);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        data.email,
        faceSampleVersion,
        hasEmailIdentifier,
        hasFaceSample,
        isFaceRateLimited,
        performLogin,
        useFaceLogin,
    ]);

    return (
        <AuthLoginSplitLayout>
            <Head title="Log in" />

            <main
                className="mx-auto flex w-full max-w-md flex-col px-6 py-8 sm:px-8 sm:py-9 lg:max-w-none lg:px-10 lg:py-10"
                aria-labelledby="login-heading"
            >
                <LoginBrandHeader />

                <div className="mb-4 mt-1">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#3CA99B] dark:text-[#5ec4b6]">
                        Secure access
                    </p>
                    <h1
                        id="login-heading"
                        className="mt-2 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
                    >
                        Prime HRMS
                    </h1>
                </div>

                {status && (
                    <div
                        className="mb-6 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/45 dark:text-emerald-100"
                        role="status"
                    >
                        {status}
                    </div>
                )}

                <form
                    className="flex flex-col gap-3"
                    noValidate
                    onSubmit={(e) => void handleSubmit(e)}
                >
                    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/40 sm:p-5">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                Email
                            </Label>
                            <div
                                className={cn(
                                    fieldShell,
                                    errors.email &&
                                        'border-red-400 ring-2 ring-red-100 dark:border-red-500 dark:ring-red-950/50',
                                )}
                            >
                                <div className="flex w-12 shrink-0 items-center justify-center border-r border-zinc-200/80 dark:border-zinc-700/80">
                                    <Mail
                                        className="size-[1.125rem] text-zinc-400 dark:text-zinc-500"
                                        aria-hidden
                                    />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="you@company.com"
                                    className={cn(fieldInput, 'pr-3.5')}
                                    aria-invalid={errors.email ? true : undefined}
                                    aria-describedby={
                                        errors.email ? 'login-email-error' : undefined
                                    }
                                />
                            </div>
                            <InputError id="login-email-error" message={errors.email} />
                        </div>

                        <details className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2 dark:border-zinc-700/80 dark:bg-zinc-900/30">
                            <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Use password instead
                            </summary>
                            <div className="mt-2 grid gap-2">
                                <div
                                    className={cn(
                                        fieldShell,
                                        errors.password &&
                                            'border-red-400 ring-2 ring-red-100 dark:border-red-500 dark:ring-red-950/50',
                                    )}
                                >
                                    <div className="flex w-12 shrink-0 items-center justify-center border-r border-zinc-200/80 dark:border-zinc-700/80">
                                        <Lock
                                            className="size-[1.125rem] text-zinc-400 dark:text-zinc-500"
                                            aria-hidden
                                        />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Optional backup password"
                                        className={cn(fieldInput, 'pr-2')}
                                        aria-invalid={errors.password ? true : undefined}
                                        aria-describedby={
                                            errors.password ? 'login-password-error' : undefined
                                        }
                                    />
                                    <div className="flex shrink-0 items-center pr-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            className="flex size-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-[1.125rem]" aria-hidden />
                                            ) : (
                                                <Eye className="size-[1.125rem]" aria-hidden />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <InputError id="login-password-error" message={errors.password} />
                            </div>
                        </details>

                        <div className="grid gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2 dark:border-zinc-700/80 dark:bg-zinc-900/30">
                            <div className="flex items-center justify-between gap-2">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    <ScanFace className="size-3.5" aria-hidden />
                                    Face login
                                </p>
                                <Button
                                    type="button"
                                    variant={useFaceLogin ? 'secondary' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        'text-zinc-700',
                                        'hover:text-zinc-900',
                                        'dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-white',
                                    )}
                                    onClick={() => {
                                        setUseFaceLogin((value) => {
                                            const next = !value;
                                            if (!next) {
                                                latestFaceRef.current = null;
                                                setHasFaceSample(false);
                                            }

                                            return next;
                                        });
                                    }}
                                    disabled={processing}
                                >
                                    {useFaceLogin ? 'Hide camera' : 'Use face login'}
                                </Button>
                            </div>
                            {useFaceLogin ? (
                                <>
                                    <LiveFaceScanner
                                        ref={faceScannerRef}
                                        disabled={processing}
                                        compact
                                        showCircularFaceGuide
                                        captureWhilePreviewing
                                        requireFaceAlignmentForSampling
                                        previewCaptureInitialDelayMs={900}
                                        previewCaptureIntervalMs={1800}
                                        onPreviewCapture={onPreviewFaceCapture}
                                        error={errors.face_capture}
                                        helperText="Enter your email, then keep your face inside the oval guide."
                                    />
                                    <div
                                        className={cn(
                                            'rounded-xl border px-3 py-2 text-xs',
                                            readyToAutoSignIn
                                                ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300/90'
                                                : 'border-zinc-200/80 bg-zinc-50/70 text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-900/30 dark:text-zinc-300',
                                        )}
                                        role="status"
                                    >
                                        <p className="inline-flex items-center gap-1.5 font-medium">
                                            <CheckCircle2 className="size-3.5" aria-hidden />
                                            {readyToAutoSignIn
                                                ? 'Face verified. Attempting sign-in...'
                                                : isFaceRateLimited
                                                  ? 'Face login paused due rate limit. Please wait and try again.'
                                                  : !hasEmailIdentifier
                                                    ? 'Enter your email to continue face login.'
                                                  : hasFaceVerificationError
                                                    ? faceCaptureErrorMessage
                                                    : hasFaceSample
                                                  ? 'Face sample captured. Waiting for server verification.'
                                                  : 'Waiting for a valid face sample.'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                                    Use email + password, or enable face login to open camera scan.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-1">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onCheckedChange={(v) => setData('remember', v === true)}
                                        tabIndex={3}
                                        className="size-5 shrink-0 rounded-md border-zinc-300 data-[state=checked]:border-[#3CA99B] data-[state=checked]:bg-[#3CA99B] dark:border-zinc-600 dark:data-[state=checked]:border-[#5ec4b6] dark:data-[state=checked]:bg-[#5ec4b6]"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-300"
                                    >
                                        Remember this device
                                    </Label>
                                </div>
                            </div>
                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-[#2d8f84] dark:text-zinc-300 dark:hover:text-[#5ec4b6] sm:text-right"
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            aria-busy={processing}
                            className={cn(
                                'mt-0.5 h-12 w-full rounded-xl border-0 text-base font-semibold text-white',
                                'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] shadow-lg shadow-[#2563eb]/25',
                                'transition hover:from-[#1d4ed8] hover:to-[#1e40af] hover:shadow-xl hover:shadow-[#2563eb]/30',
                                'focus-visible:ring-[3px] focus-visible:ring-[#2563eb]/45',
                                'disabled:pointer-events-none disabled:opacity-60 dark:shadow-[#2563eb]/12',
                            )}
                        >
                            {processing ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Spinner />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </div>

                    {canRegister && (
                        <div className="pb-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            New here?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="font-semibold text-[#3CA99B] underline-offset-4 hover:text-[#2a8f84] dark:text-[#5ec4b6] dark:hover:text-[#7ad4c7]"
                            >
                                Create an account
                            </TextLink>
                        </div>
                    )}
                </form>
            </main>
        </AuthLoginSplitLayout>
    );
}
