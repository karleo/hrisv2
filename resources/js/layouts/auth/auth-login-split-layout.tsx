import type { PropsWithChildren } from 'react';

import { LOGIN_BRAND } from '@/config/login-theme';

const LOGIN_ILLUSTRATION = '/images/login-illustration.png';

export default function AuthLoginSplitLayout({ children }: PropsWithChildren) {
    return (
        <div
            className="flex min-h-dvh items-center justify-center p-4 md:p-8"
            style={{ backgroundColor: LOGIN_BRAND }}
        >
            <div className="flex min-h-[min(640px,calc(100dvh-4rem))] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl">
                <div className="flex w-full flex-1 flex-col justify-center bg-white lg:w-1/2">
                    {children}
                </div>
                <div
                    className="relative hidden min-h-[min(280px,40vw)] w-1/2 lg:flex lg:min-h-0"
                    aria-hidden
                >
                    <img
                        src={LOGIN_ILLUSTRATION}
                        alt=""
                        className="h-full min-h-[320px] w-full object-cover object-left-top lg:min-h-0"
                    />
                </div>
            </div>
        </div>
    );
}
