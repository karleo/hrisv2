import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, UserRound } from 'lucide-react';
import {
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { auth } = usePage().props as {
        auth?: {
            has_my_profile_access?: boolean;
        };
    };

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            {auth?.has_my_profile_access ? (
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href="/my-profile"
                        prefetch
                        onClick={cleanup}
                        data-test="profile-button"
                    >
                        <UserRound className="mr-2" />
                        Profile
                    </Link>
                </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
