import { Camera, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AttendancePermissionHelp } from '@/components/attendance-permission-help';
import { Button } from '@/components/ui/button';
import { grabJpegFromVideoElement, grabJpegFromVideoElementSync, waitForVideoDimensions } from '@/lib/face-capture';
import { cameraErrorMessage, insecureContextMessage, isMobileBrowser } from '@/lib/device-permissions';
import { cn } from '@/lib/utils';

type Props = {
    onCapture: (file: File | null) => void;
    required?: boolean;
    error?: string;
    label?: string;
};

type CaptureState = 'idle' | 'previewing' | 'captured';

const CAMERA_CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: 'environment' }, audio: false },
    { video: true, audio: false },
];

export function AttendancePhotoCapture({ onCapture, required = false, error, label }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [captureState, setCaptureState] = useState<CaptureState>('idle');
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const isMobile = isMobileBrowser();

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        const insecure = insecureContextMessage();
        if (insecure) {
            setCameraError(insecure);
            return;
        }

        const video = videoRef.current;
        if (!video) {
            setCameraError('Could not initialize camera preview.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError('Camera API is not available in this browser.');
            return;
        }

        setCameraError(null);
        setVideoReady(false);
        setCapturing(false);
        setCameraStarting(true);
        stopCamera();
        setCaptureState('previewing');

        let lastError: string | null = null;

        for (const constraints of CAMERA_CONSTRAINT_ATTEMPTS) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                video.srcObject = stream;
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
                await video.play();

                const ready = await waitForVideoDimensions(video, isMobile ? 12000 : 7000);
                if (ready) {
                    streamRef.current = stream;
                    setVideoReady(true);
                    setCameraStarting(false);
                    return;
                }

                stream.getTracks().forEach((track) => track.stop());
                video.srcObject = null;
                lastError = 'Camera preview did not become ready. Please try again.';
            } catch (caught) {
                lastError = cameraErrorMessage(caught);
            }
        }

        setCameraError(lastError ?? 'Could not start camera.');
        setCaptureState('idle');
        setCameraStarting(false);
        stopCamera();
    }, [isMobile, stopCamera]);

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

        const url = URL.createObjectURL(file);
        setCapturedUrl(url);
        stopCamera();
        setCaptureState('captured');
        onCapture(file);
        setCapturing(false);
    }, [onCapture, stopCamera, videoReady]);

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

    useEffect(() => {
        return () => {
            stopCamera();
            if (capturedUrl) {
                URL.revokeObjectURL(capturedUrl);
            }
        };
    }, [stopCamera, capturedUrl]);

    const showPreview = captureState === 'previewing';
    const showPermissionHelp =
        cameraError !== null
        && (cameraError.toLowerCase().includes('denied')
            || cameraError.toLowerCase().includes('blocked')
            || cameraError.toLowerCase().includes('permission'));

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <p className="text-sm font-medium">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </p>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                    'rounded-md object-cover',
                    showPreview
                        ? 'aspect-[4/3] max-h-[min(50dvh,320px)] w-full'
                        : 'pointer-events-none fixed -left-[9999px] h-px w-px opacity-0',
                )}
                aria-hidden={!showPreview}
                aria-label={showPreview ? 'Camera preview' : undefined}
            />

            {captureState === 'idle' && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void startCamera()}
                    className="min-h-11 w-full touch-manipulation gap-2 sm:w-auto"
                    disabled={cameraStarting}
                >
                    <Camera className="size-4" />
                    {cameraStarting
                        ? 'Opening camera...'
                        : required
                            ? 'Allow camera & take photo'
                            : 'Allow camera & take photo (optional)'}
                </Button>
            )}

            {showPreview && (
                <div className="flex flex-col gap-2">
                    {!videoReady && (
                        <div className="bg-muted flex min-h-40 items-center justify-center rounded-md px-4 py-8 text-center text-sm text-muted-foreground">
                            {cameraStarting ? 'Opening camera… allow access when your browser asks.' : 'Loading camera preview…'}
                        </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            onClick={() => void capture()}
                            className="min-h-11 flex-1 touch-manipulation gap-2"
                            disabled={capturing || !videoReady}
                        >
                            <Camera className="size-4" />
                            {capturing ? 'Capturing…' : 'Capture photo'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11 touch-manipulation self-end sm:self-auto"
                            onClick={retake}
                            aria-label="Cancel"
                            disabled={capturing}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {captureState === 'captured' && capturedUrl && (
                <div className="flex flex-col gap-2">
                    <div className="relative overflow-hidden rounded-md">
                        <img
                            src={capturedUrl}
                            alt="Captured attendance photo"
                            className="max-h-[min(50dvh,320px)] w-full rounded-md object-cover"
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
                        className="min-h-11 touch-manipulation gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Retake
                    </Button>
                </div>
            )}

            {cameraError && (
                <div className="flex flex-col gap-2">
                    {showPermissionHelp ? (
                        <AttendancePermissionHelp type="camera" message={cameraError} />
                    ) : (
                        <p className="text-destructive text-sm">{cameraError}</p>
                    )}
                    {captureState === 'idle' && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11 touch-manipulation"
                            onClick={() => void startCamera()}
                        >
                            Try camera again
                        </Button>
                    )}
                </div>
            )}

            {error && !cameraError && <p className="text-destructive text-sm">{error}</p>}
        </div>
    );
}
