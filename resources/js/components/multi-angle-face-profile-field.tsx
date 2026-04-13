import { Camera, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import LiveFaceScanner, { type LiveFaceScannerHandle } from '@/components/live-face-scanner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FACE_PROFILE_ANGLES = ['front', 'left', 'right'] as const;

export type FaceProfileAngleKey = (typeof FACE_PROFILE_ANGLES)[number];

export type FaceProfileFiles = Record<FaceProfileAngleKey, File | null>;

const ANGLE_COPY: Record<
    FaceProfileAngleKey,
    { title: string; instruction: string; videoAria: string }
> = {
    front: {
        title: 'Front — straight on',
        instruction: 'Look straight at the camera with even lighting.',
        videoAria: 'Live preview for front face enrollment',
    },
    left: {
        title: 'Left angle',
        instruction: 'Turn your head slowly to your left. Keep your eyes generally toward the screen.',
        videoAria: 'Live preview for left face enrollment',
    },
    right: {
        title: 'Right angle',
        instruction: 'Turn your head slowly to your right. Keep your eyes generally toward the screen.',
        videoAria: 'Live preview for right face enrollment',
    },
};

const REQUIRED_POSE_BY_ANGLE: Record<
    FaceProfileAngleKey,
    'frontal' | 'left' | 'right'
> = {
    front: 'frontal',
    left: 'left',
    right: 'right',
};

function firstOpenAngle(value: FaceProfileFiles): FaceProfileAngleKey | null {
    for (const a of FACE_PROFILE_ANGLES) {
        if (!value[a]) {
            return a;
        }
    }
    return null;
}

type Props = {
    value: FaceProfileFiles;
    onChange: (next: FaceProfileFiles) => void;
    disabled?: boolean;
    errors?: Partial<Record<string, string | undefined>>;
};

export default function MultiAngleFaceProfileField({
    value,
    onChange,
    disabled = false,
    errors,
}: Props) {
    const scannerRef = useRef<LiveFaceScannerHandle>(null);
    const latestRef = useRef<File | null>(null);
    const valueRef = useRef(value);
    valueRef.current = value;
    const lockingRef = useRef(false);
    const previewSamplesForAngle = useRef(0);
    const autoLockAttemptedRef = useRef(false);
    const [stepError, setStepError] = useState<string | null>(null);
    const active = firstOpenAngle(value);

    useEffect(() => {
        previewSamplesForAngle.current = 0;
        autoLockAttemptedRef.current = false;
    }, [active]);

    const combinedError =
        errors?.face_capture_front ??
        errors?.face_capture_left ??
        errors?.face_capture_right ??
        stepError ??
        undefined;

    const lockAngle = useCallback(
        async (angle: FaceProfileAngleKey): Promise<boolean> => {
            if (disabled || lockingRef.current) {
                return false;
            }
            const current = valueRef.current;
            if (current[angle]) {
                return true;
            }
            lockingRef.current = true;
            try {
                const snap =
                    latestRef.current ?? (await scannerRef.current?.grabSnapshot());
                if (!snap) {
                    setStepError(
                        'Could not read this angle. Wait for the preview, adjust your pose, then try again.',
                    );
                    return false;
                }
                setStepError(null);
                onChange({ ...current, [angle]: snap });
                latestRef.current = null;
                return true;
            } finally {
                lockingRef.current = false;
            }
        },
        [disabled, onChange],
    );

    const lockActiveAngle = useCallback(async () => {
        if (!active || disabled) {
            return;
        }
        await lockAngle(active);
    }, [active, disabled, lockAngle]);

    const onPreviewCapture = useCallback(
        (file: File) => {
            latestRef.current = file;
            if (disabled || !active) {
                return;
            }
            previewSamplesForAngle.current += 1;
            if (previewSamplesForAngle.current < 2 || autoLockAttemptedRef.current) {
                return;
            }
            autoLockAttemptedRef.current = true;
            const angle = active;
            void (async () => {
                const ok = await lockAngle(angle);
                if (!ok) {
                    autoLockAttemptedRef.current = false;
                }
            })();
        },
        [active, disabled, lockAngle],
    );

    const allDone = FACE_PROFILE_ANGLES.every((a) => value[a] !== null);

    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Camera className="size-3.5" aria-hidden />
                Multi-angle face profile
            </div>

            <ol className="flex flex-wrap gap-2 text-xs">
                {FACE_PROFILE_ANGLES.map((a) => (
                    <li
                        key={a}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                            value[a]
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
                                : active === a
                                  ? 'border-[#3CA99B]/50 bg-[#3CA99B]/8 text-zinc-800 dark:border-[#5ec4b6]/40 dark:bg-[#5ec4b6]/10 dark:text-zinc-100'
                                  : 'border-zinc-200 text-muted-foreground dark:border-zinc-700',
                        )}
                    >
                        {value[a] ? (
                            <Check className="size-3.5 shrink-0" aria-hidden />
                        ) : null}
                        <span className="capitalize">{a}</span>
                    </li>
                ))}
            </ol>

            {!allDone && active ? (
                <div className="grid gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-4 dark:border-zinc-700 dark:bg-zinc-900/25">
                    <div>
                        <p className="text-sm font-medium text-foreground">{ANGLE_COPY[active].title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                            {ANGLE_COPY[active].instruction}
                        </p>
                    </div>
                    <LiveFaceScanner
                        key={active}
                        ref={scannerRef}
                        disabled={disabled}
                        showScannerHeading={false}
                        showCircularFaceGuide
                        captureWhilePreviewing
                        requireFaceAlignmentForSampling
                        requiredPose={REQUIRED_POSE_BY_ANGLE[active]}
                        previewCaptureInitialDelayMs={1200}
                        previewCaptureIntervalMs={1700}
                        onPreviewCapture={onPreviewCapture}
                        videoAriaLabel={ANGLE_COPY[active].videoAria}
                        error={combinedError}
                        helperText="Center your face in the oval guide with eyes open. After a short aligned scan (two preview samples), this angle saves automatically for login. You can also lock immediately with the button below."
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => {
                            void lockActiveAngle();
                        }}
                        className="w-full sm:w-auto"
                    >
                        Save this angle now
                    </Button>
                </div>
            ) : null}

            {allDone ? (
                <p
                    className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100"
                    role="status"
                >
                    All three angles are saved for this enrollment. You can redo the sequence if needed.
                </p>
            ) : null}

            {allDone ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                        onChange({ front: null, left: null, right: null });
                        setStepError(null);
                        latestRef.current = null;
                    }}
                >
                    Redo all angles
                </Button>
            ) : null}
        </div>
    );
}
