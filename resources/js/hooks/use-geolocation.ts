import { useCallback, useState } from 'react';
import { geolocationErrorMessage, insecureContextMessage } from '@/lib/device-permissions';

export type GeolocationState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'acquired'; latitude: number; longitude: number }
    | { status: 'error'; message: string };

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({ status: 'idle' });

    const acquire = useCallback(() => {
        const insecure = insecureContextMessage();
        if (insecure) {
            setState({ status: 'error', message: insecure });
            return;
        }

        if (!navigator.geolocation) {
            setState({
                status: 'error',
                message: 'Geolocation is not supported by your browser.',
            });
            return;
        }

        setState({ status: 'loading' });

        const requestPosition = (enableHighAccuracy: boolean): void => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setState({
                        status: 'acquired',
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    if (enableHighAccuracy && (error.code === 2 || error.code === 3)) {
                        requestPosition(false);
                        return;
                    }

                    const message = geolocationErrorMessage(error.code);
                    setState({
                        status: 'error',
                        message,
                    });
                },
                {
                    enableHighAccuracy,
                    timeout: enableHighAccuracy ? 30000 : 20000,
                    maximumAge: enableHighAccuracy ? 0 : 120000,
                },
            );
        };

        requestPosition(true);
    }, []);

    const reset = useCallback(() => {
        setState({ status: 'idle' });
    }, []);

    return { state, acquire, reset };
}
