import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

const LOGIN_VIDEO = '/clips/3D_prime.mp4';
const LOGIN_FORM_PATTERN = '/images/login-form-pattern.png';

export default function AuthLoginSplitLayout({ children }: PropsWithChildren) {
    return (
        <div
            dir="ltr"
            className={cn(
                'login-shell-bg relative flex min-h-dvh w-full max-w-[100vw] items-center justify-center overflow-hidden p-3 sm:p-5 md:p-8',
                'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
                'text-neutral-900',
            )}
        >
            {/* Cool slate–navy (balanced RGB) — avoids periwinkle / violet cast */}
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_92%_58%_at_50%_-18%,rgba(30,58,95,0.09),transparent_58%)] dark:bg-[radial-gradient(ellipse_88%_58%_at_50%_-26%,rgba(59,91,140,0.28),transparent_58%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(15,23,42,0.07),transparent_50%)] opacity-95 dark:bg-[radial-gradient(circle_at_0%_100%,rgba(15,23,42,0.5),transparent_52%)] dark:opacity-100"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.75),transparent_44%)] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(71,85,105,0.18),transparent_48%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/[0.045] dark:from-transparent dark:to-black/40"
                aria-hidden
            />

            <div
                className={cn(
                    'relative z-10 w-full max-w-[1040px]',
                    'rounded-[1.75rem] p-px',
                    'bg-gradient-to-b from-white/80 via-white/40 to-zinc-300/30 shadow-[0_28px_64px_-18px_rgba(15,23,42,0.14)]',
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
                            'bg-gradient-to-br from-[#f0f3f8] via-[#e6eaf1] to-[#d9dfe8]',
                            'dark:from-[#1a2332] dark:via-[#141c28] dark:to-[#0c1018]',
                        )}
                        aria-hidden
                    >
                        <div
                            className={cn(
                                'absolute inset-0 opacity-80',
                                'bg-[radial-gradient(ellipse_at_30%_22%,rgba(30,58,95,0.14),transparent_52%)]',
                                'dark:bg-[radial-gradient(ellipse_at_30%_22%,rgba(59,91,140,0.2),transparent_55%)] dark:opacity-100',
                            )}
                        />
                        <video
                            src={LOGIN_VIDEO}
                            autoPlay
                            loop
                            muted
                            playsInline
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
