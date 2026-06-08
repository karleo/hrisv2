function fallbackRandomUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0;
        const value = char === 'x' ? random : (random & 0x3) | 0x8;

        return value.toString(16);
    });
}

export function randomUuid(): string {
    try {
        if (typeof globalThis.crypto?.randomUUID === 'function') {
            return globalThis.crypto.randomUUID();
        }
    } catch {
        // Unavailable outside secure contexts (non-HTTPS).
    }

    return fallbackRandomUuid();
}

export function ensureRandomUuidSupport(): void {
    try {
        if (typeof globalThis.crypto?.randomUUID === 'function') {
            return;
        }
    } catch {
        // Unavailable outside secure contexts (non-HTTPS).
    }

    const implementation = fallbackRandomUuid as Crypto['randomUUID'];

    if (typeof globalThis.crypto === 'undefined') {
        Object.defineProperty(globalThis, 'crypto', {
            value: { randomUUID: implementation },
            configurable: true,
        });

        return;
    }

    globalThis.crypto.randomUUID = implementation;
}
