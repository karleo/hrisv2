import { Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    LOGIN_BRAND,
    LOGIN_CUSTOM_MARK_PATH,
} from '@/config/login-theme';
import { home } from '@/routes';

type Props = {
    appName: string;
};

export default function LoginBrandHeader({ appName }: Props) {
    const [customMarkFailed, setCustomMarkFailed] = useState(false);
    const showCustomMark =
        LOGIN_CUSTOM_MARK_PATH !== null && !customMarkFailed;

    return (
        <Link
            href={home()}
            className="mb-10 flex flex-col items-center gap-3 md:mb-12"
        >
            {showCustomMark ? (
                <img
                    src={LOGIN_CUSTOM_MARK_PATH}
                    alt=""
                    width={64}
                    height={64}
                    className="size-14 rounded-full object-cover md:size-16"
                    loading="eager"
                    decoding="async"
                    onError={() => setCustomMarkFailed(true)}
                />
            ) : (
                <div
                    className="flex size-14 items-center justify-center rounded-full md:size-16"
                    style={{ backgroundColor: LOGIN_BRAND }}
                >
                    <AppLogoIcon className="size-8 fill-white md:size-9" />
                </div>
            )}
            <span
                className="text-xl font-medium tracking-tight lowercase md:text-2xl"
                style={{ color: LOGIN_BRAND }}
            >
                {appName}
            </span>
        </Link>
    );
}
