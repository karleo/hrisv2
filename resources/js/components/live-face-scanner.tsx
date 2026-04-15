import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Camera } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import {
    grabJpegFromVideoElement,
    grabJpegFromVideoElementSync,
    waitForVideoDimensions,
} from '@/lib/face-capture';
import { cn } from '@/lib/utils';

export type LiveFaceScannerHandle = {
    /** Current frame from the live preview, or null if the camera is not ready. */
    grabSnapshot: () => Promise<File | null>;
};

type Props = {
    disabled?: boolean;
    error?: string;
    helperText?: string;
    /** Compact rendering for short login layouts. */
    compact?: boolean;
    /** When false, hides the small “Face scan” label row (e.g. nested in another labeled block). */
    showScannerHeading?: boolean;
    /** Dimmed vignette with a clear oval so users center their face in the frame. */
    showCircularFaceGuide?: boolean;
    /** Accessible name for the live video element (context-specific). */
    videoAriaLabel?: string;
    /**
     * When true, samples JPEG frames from the live preview on a timer so parents
     * can store the latest frame without waiting for submit (still only sent when you submit).
     */
    captureWhilePreviewing?: boolean;
    /** Called with each automatically sampled frame while {@link captureWhilePreviewing} is on. */
    onPreviewCapture?: (file: File) => void;
    /** If true, automatic sampling waits until the face is centered in the oval guide. */
    requireFaceAlignmentForSampling?: boolean;
    /** Required face pose for readiness checks. */
    requiredPose?: 'frontal' | 'left' | 'right' | 'any';
    /** Delay before the first automatic sample (ms). */
    previewCaptureInitialDelayMs?: number;
    /** How often to refresh the automatic sample (ms). */
    previewCaptureIntervalMs?: number;
};

type LandmarkPoint = { x: number; y: number };
type FaceQuality = {
    ready: boolean;
    hint: string;
};

const FACE_MESH_WASM_URL =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const FACE_MESH_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const FACE_OUTLINE = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400,
    377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67,
    109,
];
const LEFT_EYE = [33, 160, 158, 133, 153, 144, 33];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380, 362];
const MOUTH = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94];

function drawPolyline(
    context: CanvasRenderingContext2D,
    landmarks: LandmarkPoint[],
    indices: number[],
    width: number,
    height: number,
): void {
    if (indices.length < 2) {
        return;
    }

    context.beginPath();
    for (let i = 0; i < indices.length; i += 1) {
        const point = landmarks[indices[i]];
        if (!point) {
            continue;
        }
        const x = point.x * width;
        const y = point.y * height;
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }
    context.stroke();
}

function isFaceCentered(landmarks: LandmarkPoint[]): boolean {
    if (landmarks.length === 0) {
        return false;
    }

    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (const point of landmarks) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    const centered = Math.abs(centerX - 0.5) < 0.24 && Math.abs(centerY - 0.5) < 0.26;
    const sizeOk = width > 0.16 && height > 0.22 && width < 0.98 && height < 0.99;

    return centered && sizeOk;
}

function distance(a: LandmarkPoint | undefined, b: LandmarkPoint | undefined): number {
    if (!a || !b) {
        return 0;
    }

    return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(
    landmarks: LandmarkPoint[],
    upperIndex: number,
    lowerIndex: number,
    leftIndex: number,
    rightIndex: number,
): number {
    const vertical = distance(landmarks[upperIndex], landmarks[lowerIndex]);
    const horizontal = distance(landmarks[leftIndex], landmarks[rightIndex]);
    if (horizontal <= 0) {
        return 0;
    }

    return vertical / horizontal;
}

function evaluateFaceQualityForPose(
    landmarks: LandmarkPoint[],
    requiredPose: Props['requiredPose'],
): FaceQuality {
    if (!isFaceCentered(landmarks)) {
        return { ready: false, hint: 'Center your face inside the oval guide.' };
    }

    const leftEyeEar = eyeAspectRatio(landmarks, 159, 145, 33, 133);
    const rightEyeEar = eyeAspectRatio(landmarks, 386, 374, 362, 263);
    if (leftEyeEar < 0.08 || rightEyeEar < 0.08) {
        return { ready: false, hint: 'Keep both eyes open and look at the camera.' };
    }

    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    if (!nose || !leftCheek || !rightCheek || !leftEyeOuter || !rightEyeOuter) {
        return { ready: false, hint: 'Hold still while we detect your face landmarks.' };
    }

    const leftNoseDistance = Math.abs(nose.x - leftCheek.x);
    const rightNoseDistance = Math.abs(rightCheek.x - nose.x);
    const yawSkew =
        (leftNoseDistance - rightNoseDistance) /
        Math.max(leftNoseDistance + rightNoseDistance, 0.0001);

    const eyeLineY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const pitchOffset = nose.y - eyeLineY;
    if (pitchOffset < 0.03 || pitchOffset > 0.3) {
        return { ready: false, hint: 'Keep your head level (not too high or too low).' };
    }

    if (requiredPose === 'left' && yawSkew > -0.12) {
        return { ready: false, hint: 'Turn your face slightly to your left.' };
    }

    if (requiredPose === 'right' && yawSkew < 0.12) {
        return { ready: false, hint: 'Turn your face slightly to your right.' };
    }

    if (requiredPose === 'frontal' && Math.abs(yawSkew) > 0.35) {
        return { ready: false, hint: 'Turn your face slightly to look straight ahead.' };
    }

    if (requiredPose === 'any') {
        return { ready: true, hint: 'Face detected and aligned.' };
    }

    if (requiredPose === 'left') {
        return { ready: true, hint: 'Left-angle face detected.' };
    }

    if (requiredPose === 'right') {
        return { ready: true, hint: 'Right-angle face detected.' };
    }

    return { ready: true, hint: 'Face detected, eyes clear, and pose aligned.' };
}

const LiveFaceScanner = forwardRef<LiveFaceScannerHandle, Props>(function LiveFaceScanner(
    {
        disabled = false,
        error,
        helperText,
        compact = false,
        showScannerHeading = true,
        showCircularFaceGuide = false,
        videoAriaLabel = 'Live camera preview for face sign-in',
        captureWhilePreviewing = false,
        onPreviewCapture,
        requireFaceAlignmentForSampling = false,
        requiredPose = 'frontal',
        previewCaptureInitialDelayMs = 1800,
        previewCaptureIntervalMs = 2200,
    },
    ref,
) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const meshCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const renderFrameRef = useRef<number | null>(null);
    const isFaceReadyRef = useRef(false);
    const consecutiveReadyFramesRef = useRef(0);
    const hintRef = useRef('Align your face inside the oval guide.');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [starting, setStarting] = useState(true);
    const [meshReady, setMeshReady] = useState(false);
    const [meshError, setMeshError] = useState<string | null>(null);
    const [faceAligned, setFaceAligned] = useState(false);
    const [scanHint, setScanHint] = useState('Align your face inside the oval guide.');

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function start(): Promise<void> {
            setStarting(true);
            setCameraError(null);
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError(
                    'Camera is not supported in this browser. Use HTTPS and a modern browser.',
                );
                setStarting(false);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'user' },
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 960, min: 480 },
                        frameRate: { ideal: 24, max: 30 },
                    },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch {
                setCameraError(
                    'Could not access the camera. Allow permission and ensure you are on HTTPS.',
                );
            } finally {
                if (!cancelled) {
                    setStarting(false);
                }
            }
        }

        void start();

        return () => {
            cancelled = true;
            stopStream();
        };
    }, [stopStream]);

    useEffect(() => {
        let active = true;

        async function setupFaceMesh(): Promise<void> {
            if (!showCircularFaceGuide) {
                setMeshReady(false);
                setMeshError(null);
                return;
            }

            setMeshReady(false);
            setMeshError(null);

            try {
                const resolver = await FilesetResolver.forVisionTasks(FACE_MESH_WASM_URL);
                if (!active) {
                    return;
                }
                const landmarker = await FaceLandmarker.createFromOptions(resolver, {
                    baseOptions: {
                        modelAssetPath: FACE_MESH_MODEL_URL,
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                });
                if (!active) {
                    landmarker.close();
                    return;
                }
                landmarkerRef.current = landmarker;
                setMeshReady(true);
            } catch {
                setMeshError('Face landmarks could not start. Camera preview still works.');
            }
        }

        void setupFaceMesh();

        return () => {
            active = false;
            if (renderFrameRef.current !== null) {
                window.cancelAnimationFrame(renderFrameRef.current);
                renderFrameRef.current = null;
            }
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
            isFaceReadyRef.current = false;
            setFaceAligned(false);
        };
    }, [showCircularFaceGuide]);

    useEffect(() => {
        if (!showCircularFaceGuide || !meshReady || starting || cameraError) {
            isFaceReadyRef.current = false;
                consecutiveReadyFramesRef.current = 0;
            setFaceAligned(false);
                if (hintRef.current !== 'Align your face inside the oval guide.') {
                    hintRef.current = 'Align your face inside the oval guide.';
                    setScanHint(hintRef.current);
                }
            const canvas = meshCanvasRef.current;
            const context = canvas?.getContext('2d');
            if (canvas && context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        let active = true;
        const video = videoRef.current;
        const canvas = meshCanvasRef.current;
        const context = canvas?.getContext('2d');
        const landmarker = landmarkerRef.current;
        if (!video || !canvas || !context || !landmarker) {
            return;
        }

        const drawFrame = (): void => {
            if (!active) {
                return;
            }

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                renderFrameRef.current = window.requestAnimationFrame(drawFrame);
                return;
            }

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);

            const result = landmarker.detectForVideo(video, performance.now());
            const landmarks = result.faceLandmarks?.[0] as LandmarkPoint[] | undefined;
            if (!landmarks || landmarks.length === 0) {
                isFaceReadyRef.current = false;
                consecutiveReadyFramesRef.current = 0;
                setFaceAligned((prev) => (prev ? false : prev));
                if (hintRef.current !== 'No face detected. Move into the oval guide.') {
                    hintRef.current = 'No face detected. Move into the oval guide.';
                    setScanHint(hintRef.current);
                }
                renderFrameRef.current = window.requestAnimationFrame(drawFrame);
                return;
            }

            context.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            context.lineWidth = 1.25;
            drawPolyline(context, landmarks, FACE_OUTLINE, canvas.width, canvas.height);
            drawPolyline(context, landmarks, LEFT_EYE, canvas.width, canvas.height);
            drawPolyline(context, landmarks, RIGHT_EYE, canvas.width, canvas.height);
            drawPolyline(context, landmarks, MOUTH, canvas.width, canvas.height);
            drawPolyline(context, landmarks, NOSE_BRIDGE, canvas.width, canvas.height);

            context.fillStyle = 'rgba(255, 255, 255, 0.78)';
            for (const point of landmarks) {
                context.beginPath();
                context.arc(point.x * canvas.width, point.y * canvas.height, 0.9, 0, Math.PI * 2);
                context.fill();
            }

            const quality = evaluateFaceQualityForPose(landmarks, requiredPose);
            if (quality.ready) {
                consecutiveReadyFramesRef.current += 1;
            } else {
                consecutiveReadyFramesRef.current = 0;
            }

            const aligned = consecutiveReadyFramesRef.current >= 2;
            isFaceReadyRef.current = aligned;
            setFaceAligned((prev) => (prev === aligned ? prev : aligned));
            if (quality.hint !== hintRef.current) {
                hintRef.current = quality.hint;
                setScanHint(quality.hint);
            }

            renderFrameRef.current = window.requestAnimationFrame(drawFrame);
        };

        renderFrameRef.current = window.requestAnimationFrame(drawFrame);

        return () => {
            active = false;
            if (renderFrameRef.current !== null) {
                window.cancelAnimationFrame(renderFrameRef.current);
                renderFrameRef.current = null;
            }
        };
    }, [cameraError, meshReady, requiredPose, showCircularFaceGuide, starting]);

    const grabFrame = useCallback(async (dimensionWaitMs: number): Promise<File | null> => {
        const video = videoRef.current;
        if (!video) {
            return null;
        }

        const ready = await waitForVideoDimensions(video, dimensionWaitMs);
        if (!ready || video.videoWidth === 0 || video.videoHeight === 0) {
            return null;
        }

        const sync = grabJpegFromVideoElementSync(video);
        if (sync) {
            return sync;
        }

        return grabJpegFromVideoElement(video);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            grabSnapshot: async () => grabFrame(12_000),
        }),
        [grabFrame],
    );

    useEffect(() => {
        if (!captureWhilePreviewing || !onPreviewCapture || disabled || starting || cameraError) {
            return;
        }

        let intervalId: ReturnType<typeof setInterval> | undefined;
        const initialId = window.setTimeout(() => {
            void (async () => {
                if (requireFaceAlignmentForSampling && !isFaceReadyRef.current) {
                    return;
                }
                const first = await grabFrame(10_000);
                if (first) {
                    onPreviewCapture(first);
                }
            })();

            intervalId = setInterval(() => {
                void (async () => {
                    if (disabled) {
                        return;
                    }
                    if (requireFaceAlignmentForSampling && !isFaceReadyRef.current) {
                        return;
                    }
                    const next = await grabFrame(1500);
                    if (next) {
                        onPreviewCapture(next);
                    }
                })();
            }, previewCaptureIntervalMs);
        }, previewCaptureInitialDelayMs);

        return () => {
            window.clearTimeout(initialId);
            if (intervalId !== undefined) {
                clearInterval(intervalId);
            }
        };
    }, [
        captureWhilePreviewing,
        cameraError,
        disabled,
        grabFrame,
        onPreviewCapture,
        previewCaptureInitialDelayMs,
        previewCaptureIntervalMs,
        requireFaceAlignmentForSampling,
        starting,
    ]);

    return (
        <div className="grid gap-3">
            {showScannerHeading ? (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Camera className="size-3.5" aria-hidden />
                    Face scan
                </div>
            ) : null}
            <div
                className={cn(
                    'relative mx-auto w-full overflow-hidden border border-zinc-200 bg-zinc-950/5 transition-opacity dark:border-zinc-700 dark:bg-zinc-950/40',
                    compact
                        ? 'aspect-[16/11] max-w-[280px] rounded-xl sm:max-w-[300px]'
                        : 'aspect-[4/3] max-w-sm rounded-2xl sm:max-w-md',
                    error && 'border-red-400 ring-2 ring-red-100 dark:border-red-500 dark:ring-red-950/50',
                    disabled && 'opacity-60',
                )}
            >
                <video
                    ref={videoRef}
                    className="h-full w-full object-cover object-center"
                    muted
                    playsInline
                    aria-label={videoAriaLabel}
                />
                {showCircularFaceGuide ? (
                    <canvas
                        ref={meshCanvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        aria-hidden
                    />
                ) : null}
                {!starting && !cameraError ? (
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-0 overflow-hidden',
                            'rounded-2xl',
                        )}
                        aria-hidden
                    >
                        {showCircularFaceGuide ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="h-[76%] w-[68%] rounded-[999px] border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)] dark:border-white/20 dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.62)]"
                                />
                            </div>
                        ) : null}
                        <div
                            className={cn(
                                'login-face-scanline absolute h-0.5 rounded-full bg-[#3CA99B]/75 shadow-[0_0_14px_rgba(60,169,155,0.55)] motion-reduce:hidden dark:bg-[#5ec4b6]/70',
                                showCircularFaceGuide ? 'left-[18%] right-[18%]' : 'left-[10%] right-[10%]',
                            )}
                        />
                    </div>
                ) : null}
            </div>
            {starting ? (
                <p className="text-xs text-muted-foreground">Starting camera…</p>
            ) : null}
            {cameraError ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {cameraError}
                </p>
            ) : null}
            {meshError ? (
                <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
                    {meshError}
                </p>
            ) : null}
            {showCircularFaceGuide && !starting && !cameraError && !meshError ? (
                <p
                    className={cn(
                        'text-xs font-medium',
                        faceAligned
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-amber-700 dark:text-amber-300',
                    )}
                    role="status"
                >
                    {faceAligned ? 'Face detected and centered.' : scanHint}
                </p>
            ) : null}
            {helperText ? (
                <p className="text-xs text-muted-foreground leading-relaxed">{helperText}</p>
            ) : null}
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        </div>
    );
});

export default LiveFaceScanner;
