import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

type ThemeToggleSwitchProps = {
    resolvedAppearance: 'light' | 'dark';
    onToggle: () => void;
    className?: string;
};

function Star({ className, style }: { className?: string; style?: CSSProperties }) {
    return (
        <svg
            className={cn('pointer-events-none absolute text-white/90', className)}
            style={style}
            width="9"
            height="9"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden
        >
            <path d="M6 0l1.2 3.8H11L8.2 6.2 9.4 10 6 7.8 2.6 10l1.2-3.8L1 3.8h3.8L6 0z" />
        </svg>
    );
}

const STARS: Array<{ t: string; l: string; scale: number }> = [
    { t: '18%', l: '12%', scale: 0.65 },
    { t: '38%', l: '8%', scale: 0.5 },
    { t: '26%', l: '22%', scale: 0.55 },
    { t: '52%', l: '6%', scale: 0.45 },
];

function SunKnob() {
    return (
        <span
            className={cn(
                'relative z-10 flex h-[30px] w-[30px] shrink-0 rounded-full',
                'bg-[#c4e830]',
                'shadow-[0_2px_8px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.35)]',
            )}
            aria-hidden
        />
    );
}

function MoonKnob() {
    return (
        <span
            className={cn(
                'relative z-10 flex h-[30px] w-[30px] shrink-0 overflow-hidden rounded-full',
                'bg-gradient-to-br from-[#e2e6ea] to-[#9aa3ab]',
                'shadow-[0_2px_8px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.45)]',
            )}
            aria-hidden
        >
            <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7a8288]/45" />
            <span className="absolute left-3 top-3.5 h-1 w-1 rounded-full bg-[#7a8288]/42" />
            <span className="absolute right-2 top-2.5 h-1.5 w-1.5 rounded-full bg-[#7a8288]/40" />
        </span>
    );
}

export function ThemeToggleSwitch({
    resolvedAppearance,
    onToggle,
    className,
}: ThemeToggleSwitchProps) {
    const isDark = resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'relative inline-flex h-10 w-[104px] shrink-0 cursor-pointer rounded-full p-[3px]',
                'border border-neutral-300/90 bg-neutral-200/95',
                'shadow-[inset_0_1px_2px_rgba(255,255,255,0.75),0_1px_2px_rgba(15,23,42,0.06)]',
                'transition-shadow hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(15,23,42,0.08)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'dark:border-neutral-600 dark:bg-neutral-800/90',
                'dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.25)]',
                className,
            )}
        >
            {/* Track: one smooth gradient per mode — no stacked ellipses */}
            <span className="relative block h-full w-full overflow-hidden rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)]">
                <span
                    className={cn(
                        'absolute inset-0 transition-opacity duration-300 ease-out',
                        isDark ? 'opacity-0' : 'opacity-100',
                    )}
                    style={{
                        background:
                            'linear-gradient(105deg, #7ec8f0 0%, #3d7eb8 42%, #1a3352 88%, #0f1f30 100%)',
                    }}
                    aria-hidden
                />
                <span
                    className={cn(
                        'absolute inset-0 transition-opacity duration-300 ease-out',
                        isDark ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{
                        background:
                            'linear-gradient(255deg, #8b93a4 0%, #4a5160 35%, #1e222c 72%, #0a0c10 100%)',
                    }}
                    aria-hidden
                />

                {/* Soft “empty half” — low-contrast overlay only (not a second pill fighting the gradient) */}
                <span
                    className={cn(
                        'pointer-events-none absolute inset-y-[5px] z-[1] w-[46%] rounded-full transition-opacity duration-300',
                        'bg-white/22 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]',
                        isDark ? 'left-[5px] opacity-100' : 'right-[5px] opacity-100',
                    )}
                    aria-hidden
                />

                {/* Night stars */}
                <span
                    className={cn(
                        'pointer-events-none absolute inset-0 z-[2] transition-opacity duration-300',
                        isDark ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                >
                    {STARS.map((s, i) => (
                        <Star
                            key={i}
                            style={{
                                top: s.t,
                                left: s.l,
                                transform: `scale(${s.scale})`,
                            }}
                        />
                    ))}
                </span>

                {/* Day: minimal cloud hint (single shape) */}
                <span
                    className={cn(
                        'pointer-events-none absolute inset-0 z-[2] transition-opacity duration-300',
                        isDark ? 'opacity-0' : 'opacity-100',
                    )}
                    aria-hidden
                >
                    <span className="absolute bottom-[14%] left-[10%] h-2.5 w-[42%] rounded-full bg-white/35 blur-[0.5px]" />
                </span>

                <span
                    className={cn(
                        'absolute top-1/2 z-[5] -translate-y-1/2 transition-[left,right] duration-300 ease-out',
                        isDark ? 'right-[6px] left-auto' : 'left-[6px] right-auto',
                    )}
                >
                    {isDark ? <MoonKnob /> : <SunKnob />}
                </span>
            </span>
        </button>
    );
}
