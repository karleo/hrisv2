import { Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LOGIN_BRAND, LOGIN_CUSTOM_MARK_PATH } from '@/config/login-theme';
import { home } from '@/routes';

type Props = {
    /** Shown under the mark; omit when the page provides its own title. */
    appName?: string;
};

export default function LoginBrandHeader({ appName }: Props) {
    const [customMarkFailed, setCustomMarkFailed] = useState(false);
    const showCustomMark = LOGIN_CUSTOM_MARK_PATH !== null && !customMarkFailed;

    return (
        <Link
            href={home()}
            aria-label="Go to home page"
            className="group -ml-1 mb-1 flex w-fit flex-col gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3CA99B]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[#5ec4b6]/50 dark:focus-visible:ring-offset-[#0b0d0c]"
        >
            {showCustomMark ? (
                <img
                    src={LOGIN_CUSTOM_MARK_PATH}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-2xl object-cover shadow-md ring-1 ring-black/5 transition group-hover:shadow-lg dark:ring-white/10 md:size-16"
                    loading="eager"
                    decoding="async"
                    onError={() => setCustomMarkFailed(true)}
                />
            ) : (
                <div
                    className="flex size-14 items-center justify-center rounded-2xl shadow-md ring-1 ring-black/5 transition group-hover:shadow-lg group-hover:ring-[#3CA99B]/30 dark:ring-white/10 md:size-16"
                    style={{ backgroundColor: LOGIN_BRAND }}
                >
                    <AppLogoIcon className="size-8 fill-white transition group-hover:scale-105 md:size-9" />
                </div>
            )}
            {appName ? (
                <span
                    className="mt-2 text-lg font-semibold tracking-tight md:text-xl"
                    style={{ color: LOGIN_BRAND }}
                >
                    {appName}
                </span>
            ) : null}
        </Link>
    );
}
