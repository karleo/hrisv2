import { router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type AutoSubmitSignaturePadProps = {
    label: string;
    signatureUrl: string | null;
    submitUrl: string;
    onSuccess?: () => void;
    fieldName:
        | 'employee_signature'
        | 'approved_by_signature'
        | 'issued_by_signature'
        | 'dept_head_signature'
        | 'ceo_signature';
    /** Appended to the multipart POST (e.g. `issued_by_employee_id` on IT asset requests). */
    extraFormData?: Record<string, string>;
    visitOptions?: {
        preserveScroll?: boolean;
        preserveState?: boolean;
        only?: string[];
    };
};

type ControlledSignaturePadProps = {
    label: string;
    initialImageUrl?: string | null;
    onChange: (dataUrl: string | null) => void;
    onSave?: (dataUrl: string | null) => void;
};

type SignaturePadProps = AutoSubmitSignaturePadProps | ControlledSignaturePadProps;

export function SignaturePad(props: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isAutoSubmitMode = 'submitUrl' in props && 'fieldName' in props && typeof props.submitUrl === 'string' && props.submitUrl.length > 0;

    const page = usePage();
    const { errors, csrf_token: csrfFromPage } = page.props as {
        errors?: Partial<
            Record<
                'employee_signature' | 'approved_by_signature' | 'issued_by_signature' | 'dept_head_signature' | 'ceo_signature',
                string
            >
        >;
        csrf_token?: string;
    };
    const fieldError = isAutoSubmitMode ? errors?.[props.fieldName] : undefined;

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
        if (!isAutoSubmitMode) {
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            props.onChange(dataUrl);
            props.onSave?.(dataUrl);
            return;
        }

        canvas.toBlob((blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append(props.fieldName, blob, 'signature.png');
            if (props.extraFormData) {
                for (const [key, value] of Object.entries(props.extraFormData)) {
                    if (value !== '') {
                        formData.append(key, value);
                    }
                }
            }
            const token =
                (typeof csrfFromPage === 'string' && csrfFromPage.length > 0
                    ? csrfFromPage
                    : undefined) ??
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            if (token) {
                formData.append('_token', token);
            }
            setIsSubmitting(true);
            const visit = isAutoSubmitMode ? props.visitOptions : undefined;
            router.post(props.submitUrl, formData, {
                forceFormData: true,
                headers: token ? { 'X-CSRF-TOKEN': token } : {},
                preserveScroll: visit?.preserveScroll ?? true,
                preserveState: visit?.preserveState ?? true,
                ...(visit?.only?.length ? { only: visit.only } : {}),
                onFinish: () => setIsSubmitting(false),
                onSuccess: () => {
                    clear();
                    props.onSuccess?.();
                },
            });
        }, 'image/png', 0.9);
    };

    const displaySignatureUrl = isAutoSubmitMode ? props.signatureUrl : null;

    return (
        <div className="space-y-2">
            <Label>{props.label}</Label>
            {fieldError ? <p className="text-destructive text-sm">{fieldError}</p> : null}
            {displaySignatureUrl ? (
                <div className="flex min-w-0 max-w-[12rem] flex-shrink-0 flex-col gap-1">
                    <div className="relative h-12 w-48 overflow-hidden rounded border border-input bg-muted">
                        <img
                            src={displaySignatureUrl}
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            clear();
                            if (!isAutoSubmitMode) {
                                props.onChange(null);
                            }
                        }}
                    >
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
