import { Form, Head, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import LoginBrandHeader from '@/components/auth/login-brand-header';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLoginSplitLayout from '@/layouts/auth/auth-login-split-layout';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { store } from '@/routes/login';
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
    const { name } = usePage<{ name: string }>().props;

    return (
        <AuthLoginSplitLayout>
            <Head title="Log in" />

            <main
                className="mx-auto flex w-full max-w-md flex-col px-7 py-12 sm:px-10 sm:py-14 lg:max-w-none lg:px-12 lg:py-16"
                aria-labelledby="login-heading"
            >
                <LoginBrandHeader />

                <div className="mb-9 mt-2">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#3CA99B] dark:text-[#5ec4b6]">
                        Secure access
                    </p>
                    <h1
                        id="login-heading"
                        className="mt-2 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
                    >
                        Welcome back
                    </h1>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Sign in to{' '}
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">{name}</span>
                    </p>
                </div>

                {status && (
                    <div
                        className="mb-6 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/45 dark:text-emerald-100"
                        role="status"
                    >
                        {status}
                    </div>
                )}

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-10"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-5">
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

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                    >
                                        Password
                                    </Label>
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
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className={cn(fieldInput, 'pr-2')}
                                            aria-invalid={errors.password ? true : undefined}
                                            aria-describedby={
                                                errors.password
                                                    ? 'login-password-error'
                                                    : undefined
                                            }
                                        />
                                        <div className="flex shrink-0 items-center pr-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                className="flex size-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                                tabIndex={-1}
                                                aria-label={
                                                    showPassword ? 'Hide password' : 'Show password'
                                                }
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
                                    <InputError
                                        id="login-password-error"
                                        message={errors.password}
                                    />
                                </div>

                                <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
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
                                        'h-[3.25rem] w-full rounded-2xl border-0 text-base font-semibold text-white',
                                        'bg-gradient-to-r from-[#3CA99B] to-[#2a8f84] shadow-lg shadow-[#3CA99B]/25',
                                        'transition hover:from-[#36968a] hover:to-[#267a72] hover:shadow-xl hover:shadow-[#3CA99B]/30',
                                        'focus-visible:ring-[3px] focus-visible:ring-[#3CA99B]/45',
                                        'disabled:pointer-events-none disabled:opacity-60 dark:shadow-[#3CA99B]/12',
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
                                <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
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
                        </>
                    )}
                </Form>
            </main>
        </AuthLoginSplitLayout>
    );
}
