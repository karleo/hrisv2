import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { getEcho } from '@/lib/echo';
import {
    installMessageSoundUnlock,
    playEmployeeMessageUnreadChime,
} from '@/lib/play-employee-message-unread-chime';
import type { Auth } from '@/types/auth';

function resolveEmployeeId(
    auth: Auth | undefined,
    viewerEmployeeId: unknown,
): number | null {
    const fromViewer = Number(viewerEmployeeId);
    const fromAuth = Number(auth?.employee_id);

    if (Number.isInteger(fromViewer) && fromViewer > 0) {
        return fromViewer;
    }

    if (Number.isInteger(fromAuth) && fromAuth > 0) {
        return fromAuth;
    }

    return null;
}

/**
 * Plays a chime when a new message arrives via Reverb/Echo (any page).
 */
export function useEmployeeMessageLiveSound(): void {
    const page = usePage();
    const { auth, viewerEmployeeId } = page.props as {
        auth?: Auth;
        viewerEmployeeId?: unknown;
    };

    const employeeId = resolveEmployeeId(auth, viewerEmployeeId);

    useEffect(() => {
        installMessageSoundUnlock();
    }, []);

    useEffect(() => {
        if (employeeId === null) {
            return;
        }

        const echo = getEcho();

        if (!echo) {
            return;
        }

        const channel = echo.private(`employee.${employeeId}`);

        const onMessageSent = (payload: {
            message?: { id?: number };
        }): void => {
            playEmployeeMessageUnreadChime(payload.message?.id);
        };

        channel.listen('.employee.message.sent', onMessageSent);

        return () => {
            channel.stopListening('.employee.message.sent');
        };
    }, [employeeId]);
}
