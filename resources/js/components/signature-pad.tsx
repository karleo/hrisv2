import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type SignaturePadProps = {
    label: string;
    signatureUrl: string | null;
    submitUrl: string;
    onSuccess?: () => void;
    fieldName: 'employee_signature' | 'approved_by_signature';
};

export function SignaturePad({
    label,
    signatureUrl,
    submitUrl,
    onSuccess,
    fieldName,
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getContext = () => canvasRef.current?.getContext('2d');

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const ctx = getContext();
        if (!ctx) return;
        const { offsetX, offsetY } = 'touches' in e ? { offsetX: e.touches[0].clientX - (e.currentTarget.getBoundingClientRect?.()?.left ?? 0), offsetY: e.touches[0].clientY - (e.currentTarget.getBoundingClientRect?.()?.top ?? 0) } : e.nativeEvent;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getContext();
        if (!ctx) return;
        const { offsetX, offsetY } = 'touches' in e ? { offsetX: e.touches[0].clientX - (e.currentTarget.getBoundingClientRect?.()?.left ?? 0), offsetY: e.touches[0].clientY - (e.currentTarget.getBoundingClientRect?.()?.top ?? 0) } : e.nativeEvent;
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getContext();
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const formData = new FormData();
                formData.append(fieldName, blob, 'signature.png');
                const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
                if (token) formData.append('_token', token);
                setIsSubmitting(true);
                router.post(submitUrl, formData, {
                    forceFormData: true,
                    onFinish: () => setIsSubmitting(false),
                    onSuccess: () => {
                        clear();
                        onSuccess?.();
                    },
                });
            },
            'image/png',
            0.9,
        );
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {signatureUrl ? (
                <div className="flex min-w-0 max-w-[12rem] flex-shrink-0 flex-col gap-1">
                    <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-muted">
                        <img
                            src={signatureUrl}
                            alt="Signature"
                            className="absolute inset-0 h-full w-full object-contain object-left-top"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">On file. Draw below to replace.</p>
                </div>
            ) : null}
            <div className="inline-block min-w-0 max-w-[12rem] border border-input rounded-md bg-muted/30 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={192}
                    height={48}
                    className="block w-full cursor-crosshair touch-none border-b border-input bg-white dark:bg-background"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <div className="flex gap-2 p-2">
                    <Button type="button" variant="outline" size="sm" onClick={clear}>
                        Clear
                    </Button>
                    <Button type="button" size="sm" onClick={save} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save signature'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
