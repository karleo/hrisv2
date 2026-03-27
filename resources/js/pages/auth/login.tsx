import { Form, Head, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import LoginBrandHeader from '@/components/auth/login-brand-header';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LOGIN_PASSWORD_FIELD_BG } from '@/config/login-theme';
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

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { name } = usePage<{ name: string }>().props;

    const underlineInputClass =
        'h-12 rounded-none border-0 border-b border-neutral-300 bg-transparent px-0 shadow-none focus-visible:border-b-2 focus-visible:border-[#3CA99B] focus-visible:ring-0 placeholder:text-neutral-400 md:text-base';

    const passwordInputClass = cn(
        'h-12 rounded-t-md border-0 border-b border-neutral-300 px-3 shadow-none focus-visible:border-b-2 focus-visible:border-[#3CA99B] focus-visible:ring-0 md:text-base',
        'placeholder:text-neutral-400',
    );

    return (
        <AuthLoginSplitLayout>
            <Head title="Log in" />

            <div className="mx-auto flex w-full max-w-sm flex-col px-8 py-10 md:py-14">
                <LoginBrandHeader appName={name} />

                {status && (
                    <div className="mb-6 text-center text-sm font-medium text-green-600">
                        {status}
                    </div>
                )}

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="sr-only">
                                        Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className={underlineInputClass}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="sr-only">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className={cn(passwordInputClass, 'pr-10')}
                                            style={{
                                                backgroundColor: LOGIN_PASSWORD_FIELD_BG,
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            className="absolute right-3 bottom-3 text-neutral-400 hover:text-neutral-600"
                                            tabIndex={-1}
                                            aria-label={
                                                showPassword ? 'Hide password' : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />

                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="w-fit text-sm font-normal text-neutral-500 no-underline decoration-transparent hover:text-neutral-700 hover:underline"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" name="remember" tabIndex={3} />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm font-normal text-neutral-500"
                                    >
                                        Remember me
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                    className="h-12 w-full rounded-full border-0 bg-[#3CA99B] text-base font-semibold text-white shadow-none hover:bg-[#36968a] focus-visible:ring-[#3CA99B]/40"
                                >
                                    {processing && <Spinner />}
                                    Login
                                </Button>
                            </div>

                            {canRegister && (
                                <div className="text-center text-sm text-neutral-500">
                                    Don&apos;t have an account?{' '}
                                    <TextLink
                                        href={register()}
                                        tabIndex={5}
                                        className="font-medium text-[#3CA99B] no-underline decoration-[#3CA99B]/30 hover:underline hover:decoration-[#3CA99B]"
                                    >
                                        Sign up
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </AuthLoginSplitLayout>
    );
}
