export function isSecureBrowserContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
}

export function isMobileBrowser(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function insecureContextMessage(): string | null {
    if (isSecureBrowserContext()) {
        return null;
    }

    return 'Camera and location require a secure connection (HTTPS). On mobile, open the app using https:// instead of http://.';
}

export function geolocationErrorMessage(code: number): string {
    const messages: Record<number, string> = {
        1: 'Location permission denied. Allow location for this site in your browser settings, then try again.',
        2: 'Location could not be determined. Move to an open area or enable GPS, then try again.',
        3: 'Location request timed out. Try again outdoors or wait a few seconds for GPS to lock.',
    };

    return messages[code] ?? 'Unable to get location.';
}

export function geolocationDeniedHelp(): string {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return 'iPhone: Settings → Safari → Location → Allow. Or tap “aA” in the address bar → Website Settings → Location → Allow.';
    }

    if (/Android/i.test(navigator.userAgent)) {
        return 'Android: tap the lock icon in the address bar → Permissions → allow Location.';
    }

    return 'Allow location in your browser site settings, reload the page, and try again.';
}

export function cameraErrorMessage(caught: unknown): string {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return 'Camera API is not available in this browser.';
    }

    const insecure = insecureContextMessage();
    if (insecure) {
        return insecure;
    }

    if (!(caught instanceof DOMException)) {
        return 'Could not start camera.';
    }

    return ({
        NotAllowedError: 'Camera access was blocked. Allow camera for this site in your browser settings.',
        NotFoundError: 'No camera was found on this device.',
        NotReadableError: 'Camera is busy or unavailable. Close other apps using the camera and try again.',
        OverconstrainedError: 'This device camera does not support the requested mode. Trying again may help.',
        SecurityError: 'Camera is blocked by browser security policy.',
        AbortError: 'Camera startup was interrupted. Please try again.',
    } as Record<string, string>)[caught.name] ?? `Could not start camera (${caught.name}).`;
}

export function cameraDeniedHelp(): string {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return 'iPhone: Settings → Safari → Camera → Allow. Or tap “aA” in the address bar → Website Settings → Camera → Allow.';
    }

    if (/Android/i.test(navigator.userAgent)) {
        return 'Android: tap the lock icon in the address bar → Permissions → allow Camera.';
    }

    return 'Allow camera in your browser site settings, reload the page, and try again.';
}
