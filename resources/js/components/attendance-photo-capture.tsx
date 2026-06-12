import { Camera, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { grabJpegFromVideoElement, grabJpegFromVideoElementSync, waitForVideoDimensions } from '@/lib/face-capture';
import { cn } from '@/lib/utils';

type Props = {
    // Called with the captured JPEG File (or null to clear)
    onCapture: (file: File | null) => void;
    // Whether a photo is required (field modes)
    required?: boolean;
    // Error message to display
    error?: string;
    // Label shown above the capture area
    label?: string;
};

type CaptureState = 'idle' | 'previewing' | 'captured';

const CAMERA_CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 960 }, height: { ideal: 720 } } },
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 960 }, height: { ideal: 720 } } },
    { video: true },
];

function cameraErrorMessage(caught: unknown): string {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return 'Camera API is not available in this browser/context.';
    }

    if (window.isSecureContext === false) {
        return 'Camera requires a secure context (HTTPS or localhost).';
    }

    if (!(caught instanceof DOMException)) {
        return 'Could not start camera.';
    }

    return ({
        NotAllowedError:
            'Camera access was blocked by browser/system permission.',
        NotFoundError:
            'No camera device was found.',
        NotReadableError:
            'Camera is busy or unavailable (possibly used by another app). Close other camera apps and try again.',
        OverconstrainedError:
            'Camera constraints were not supported on this device.',
        SecurityError:
            'Camera is blocked by browser security policy.',
        AbortError:
            'Camera startup was interrupted. Please try again.',
    } as Record<string, string>)[caught.name] ?? `Could not start camera (${caught.name}).`;
}

export function AttendancePhotoCapture({ onCapture, required = false, error, label }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [captureState, setCaptureState] = useState<CaptureState>('idle');
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    // Stop the camera stream and clean up preview URL
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // User clicked "Take photo" — mount the <video> first, then open the camera in useEffect
    const startCamera = useCallback(() => {
        setCameraError(null);
        setVideoReady(false);
        setCapturing(false);
        setCameraStarting(true);
        stopCamera();
        setCaptureState('previewing');
    }, [stopCamera]);

    // Open camera after the preview <video> element is in the DOM
    useEffect(() => {
        if (captureState !== 'previewing' || !cameraStarting) {
            return;
        }

        let cancelled = false;

        const waitForVideoElement = async (): Promise<HTMLVideoElement | null> => {
            for (let attempt = 0; attempt < 30; attempt += 1) {
                if (cancelled) {
                    return null;
                }

                if (videoRef.current) {
                    return videoRef.current;
                }

                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => resolve());
                });
            }

            return videoRef.current;
        };

        const openCamera = async (): Promise<void> => {
            if (!navigator.mediaDevices?.getUserMedia) {
                if (!cancelled) {
                    setCameraError('Camera API is not available in this browser/context.');
                    setCaptureState('idle');
                    setCameraStarting(false);
                }

                return;
            }

            const video = await waitForVideoElement();
            if (!video || cancelled) {
                if (!cancelled) {
                    setCameraError('Could not initialize camera preview.');
                    setCaptureState('idle');
                    setCameraStarting(false);
                }

                return;
            }

            let lastError: string | null = null;

            for (const constraints of CAMERA_CONSTRAINT_ATTEMPTS) {
                if (cancelled) {
                    return;
                }

                try {
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (cancelled) {
                        stream.getTracks().forEach((t) => t.stop());
                        return;
                    }

                    video.srcObject = stream;
                    await video.play();
                    const ready = await waitForVideoDimensions(video, 7000);

                    if (ready && !cancelled) {
                        streamRef.current = stream;
                        setVideoReady(true);
                        setCameraStarting(false);
                        return;
                    }

                    stream.getTracks().forEach((t) => t.stop());
                    video.srcObject = null;
                    lastError = 'Camera preview did not become ready. Please try again.';
                } catch (caught) {
                    lastError = cameraErrorMessage(caught);
                }
            }

            if (!cancelled) {
                setCameraError(lastError ?? 'Could not start camera.');
                setCaptureState('idle');
                setCameraStarting(false);
                stopCamera();
            }
        };

        void openCamera();

        return () => {
            cancelled = true;
        };
    }, [captureState, cameraStarting, stopCamera]);

    // Capture the current frame
    const capture = useCallback(async () => {
        if (!videoRef.current) {
            return;
        }
        if (!videoReady) {
            setCameraError('Camera is still loading. Please wait a moment, then capture again.');
            return;
        }

        setCameraError(null);
        setCapturing(true);
        const file = (await grabJpegFromVideoElement(videoRef.current))
            ?? grabJpegFromVideoElementSync(videoRef.current);

        if (!file) {
            setCameraError('Could not capture image. Please try again.');
            setCapturing(false);
            return;
        }

        // Create a preview URL and stop the live stream
        const url = URL.createObjectURL(file);
        setCapturedUrl(url);
        stopCamera();
        setCaptureState('captured');
        onCapture(file);
        setCapturing(false);
    }, [onCapture, stopCamera, videoReady]);

    // Retake — clear captured photo and restart camera
    const retake = useCallback(() => {
        setCameraStarting(false);
        setCapturing(false);
        setVideoReady(false);
        stopCamera();
        if (capturedUrl) {
            URL.revokeObjectURL(capturedUrl);
            setCapturedUrl(null);
        }
        onCapture(null);
        setCaptureState('idle');
        setCameraError(null);
    }, [capturedUrl, onCapture, stopCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (capturedUrl) {
                URL.revokeObjectURL(capturedUrl);
            }
        };
    }, [stopCamera, capturedUrl]);

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <p className="text-sm font-medium">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </p>
            )}

            {captureState === 'idle' && (
                <Button type="button" variant="outline" onClick={startCamera} className="gap-2" disabled={cameraStarting}>
                    <Camera className="size-4" />
                    {cameraStarting
                        ? 'Opening camera...'
                        : required
                            ? 'Take photo (required)'
                            : 'Take photo (optional)'}
                </Button>
            )}

            {captureState === 'previewing' && (
                <div className="flex flex-col gap-2">
                    <div className="bg-muted relative overflow-hidden rounded-md">
                        {/* Live camera preview — must stay mounted before getUserMedia attaches */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="aspect-[4/3] w-full rounded-md object-cover"
                            aria-label="Camera preview"
                        />
                        {!videoReady && (
                            <div className="bg-muted/90 absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                                {cameraStarting ? 'Opening camera...' : 'Loading camera preview...'}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" onClick={capture} className="flex-1 gap-2" disabled={capturing || !videoReady}>
                            <Camera className="size-4" />
                            {capturing ? 'Capturing…' : 'Capture'}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={retake} aria-label="Cancel" disabled={capturing}>
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {captureState === 'captured' && capturedUrl && (
                <div className="flex flex-col gap-2">
                    <div className="relative overflow-hidden rounded-md">
                        {/* Show the captured still */}
                        <img
                            src={capturedUrl}
                            alt="Check-in photo"
                            className="w-full rounded-md object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                            <CheckCircle className="size-3" />
                            Captured
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={retake}
                        className="gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Retake
                    </Button>
                </div>
            )}

            {(cameraError || error) && (
                <div className="flex flex-col gap-2">
                    <p className={cn('text-destructive text-sm')}>{cameraError ?? error}</p>
                    {captureState === 'idle' && cameraError && (
                        <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                            Try camera again
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
