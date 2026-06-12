import { useCallback, useState } from 'react';

// Geolocation result states
export type GeolocationState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'acquired'; latitude: number; longitude: number }
    | { status: 'error'; message: string };

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({ status: 'idle' });

    // Request the current position from the browser's Geolocation API
    const acquire = useCallback(() => {
        if (!navigator.geolocation) {
            setState({
                status: 'error',
                message: 'Geolocation is not supported by your browser.',
            });
            return;
        }

        setState({ status: 'loading' });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    status: 'acquired',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                const messages: Record<number, string> = {
                    1: 'Location permission denied. Please allow access and try again.',
                    2: 'Location could not be determined. Please try again.',
                    3: 'Location request timed out. Please try again.',
                };
                setState({
                    status: 'error',
                    message: messages[error.code] ?? 'Unable to get location.',
                });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }, []);

    const reset = useCallback(() => {
        setState({ status: 'idle' });
    }, []);

    return { state, acquire, reset };
}
