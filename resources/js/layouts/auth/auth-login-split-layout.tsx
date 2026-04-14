import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

const LOGIN_ILLUSTRATION = '/images/login-illustration-dubai.png';
const LOGIN_FORM_PATTERN = '/images/login-form-pattern.png';

export default function AuthLoginSplitLayout({ children }: PropsWithChildren) {
    return (
        <div
            className={cn(
                'relative flex min-h-dvh items-center justify-center overflow-hidden p-3 sm:p-5 md:p-8',
                'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
                'bg-[#e8f4f2] text-neutral-900 dark:bg-zinc-950',
            )}
        >
            {/* Light: soft mint wash · Dark: deep teal atmosphere */}
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-25%,rgba(60,169,155,0.35),transparent_58%)] dark:bg-[radial-gradient(ellipse_88%_58%_at_50%_-30%,rgba(45,150,140,0.28),transparent_58%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(60,169,155,0.22),transparent_48%)] opacity-90 dark:bg-[radial-gradient(circle_at_0%_100%,rgba(38,126,164,0.22),transparent_50%)] dark:opacity-100"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.7),transparent_42%)] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(96,128,255,0.14),transparent_46%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/[0.03] dark:from-[#040914]/15 dark:to-[#02050d]/75"
                aria-hidden
            />

            <div
                className={cn(
                    'relative z-10 w-full max-w-[1040px]',
                    'rounded-[1.75rem] p-px',
                    'bg-gradient-to-b from-white/80 via-white/40 to-zinc-300/30 shadow-[0_28px_64px_-18px_rgba(15,60,52,0.22)]',
                    'dark:from-white/14 dark:via-white/[0.06] dark:to-transparent dark:shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)]',
                )}
            >
                <div
                    className={cn(
                        'flex min-h-[min(600px,calc(100dvh-1.5rem))] overflow-hidden rounded-[1.7rem]',
                        'bg-white',
                        'dark:bg-[#0b0d0c]',
                    )}
                >
                    <div
                        className={cn(
                            'relative flex w-full flex-1 flex-col justify-center',
                            'lg:w-[min(100%,26rem)] lg:max-w-[52%] lg:shrink-0',
                            'border-zinc-200/90 lg:border-r dark:border-zinc-800/90',
                        )}
                    >
                        <div
                            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45 dark:opacity-20"
                            style={{ backgroundImage: `url(${LOGIN_FORM_PATTERN})` }}
                            aria-hidden
                        />
                        <div
                            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/45 to-white/70 dark:from-[#0b0d0c]/85 dark:via-[#0b0d0c]/78 dark:to-[#0b0d0c]/88"
                            aria-hidden
                        />
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>

                    <div
                        className={cn(
                            'relative hidden min-h-0 flex-1 overflow-hidden lg:flex',
                            'bg-gradient-to-br from-[#e8f7f4] via-[#d4efe9] to-[#b8e4da]',
                            'dark:from-zinc-900 dark:via-[#0f1917] dark:to-black',
                        )}
                        aria-hidden
                    >
                        <div
                            className={cn(
                                'absolute inset-0 opacity-75',
                                'bg-[radial-gradient(ellipse_at_30%_20%,rgba(60,169,155,0.38),transparent_50%)]',
                                'dark:bg-[radial-gradient(ellipse_at_30%_20%,rgba(60,169,155,0.14),transparent_55%)] dark:opacity-100',
                            )}
                        />
                        <img
                            src={LOGIN_ILLUSTRATION}
                            alt=""
                            className={cn(
                                'relative h-full min-h-[320px] w-full object-cover object-center',
                                'opacity-100',
                                'dark:min-h-0 dark:opacity-90 dark:mix-blend-normal',
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
