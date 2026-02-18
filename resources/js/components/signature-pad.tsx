import React, { useEffect, useRef, useState } from 'react';

type SignaturePadProps = {
    label: string;
    initialImageUrl?: string | null;
    onChange: (dataUrl: string | null) => void;
    height?: number;
};

export function SignaturePad({ label, initialImageUrl = null, onChange, height = 120 }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState<boolean>(Boolean(initialImageUrl));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !initialImageUrl) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const image = new Image();
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
            const width = image.width * ratio;
            const heightScaled = image.height * ratio;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - heightScaled) / 2;
            ctx.drawImage(image, x, y, width, heightScaled);
        };
        image.src = initialImageUrl;
    }, [initialImageUrl]);

    const getCanvas = () => canvasRef.current;

    const getEventPosition = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = getCanvas();
        if (!canvas) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();

        if ('touches' in event) {
            const touch = event.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
            };
        }

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const canvas = getCanvas();
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const position = getEventPosition(event);
        if (!ctx || !position) {
            return;
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }

        event.preventDefault();
        const canvas = getCanvas();
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const position = getEventPosition(event);
        if (!ctx || !position) {
            return;
        }

        ctx.lineTo(position.x, position.y);
        ctx.stroke();
    };

    const endDrawing = () => {
        if (!isDrawing) {
            return;
        }

        const canvas = getCanvas();
        if (!canvas) {
            setIsDrawing(false);
            return;
        }

        const hasContent = !isCanvasBlank(canvas);
        setHasSignature(hasContent);
        setIsDrawing(false);

        if (hasContent) {
            const dataUrl = canvas.toDataURL('image/png');
            onChange(dataUrl);
        } else {
            onChange(null);
        }
    };

    const clear = () => {
        const canvas = getCanvas();
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange(null);
    };

    const isCanvasBlank = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return true;
        }
        const pixelBuffer = new Uint32Array(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer,
        );

        return !pixelBuffer.some((color) => color !== 0);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium leading-none">{label}</span>
                <button
                    type="button"
                    onClick={clear}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    Clear
                </button>
            </div>
            <div className="rounded-md border bg-background">
                <canvas
                    ref={canvasRef}
                    className="h-[120px] w-full touch-none"
                    style={{ height, width: '100%' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                />
            </div>
            {!hasSignature && (
                <p className="text-xs text-muted-foreground">
                    Sign above using your mouse or touch screen.
                </p>
            )}
        </div>
    );
}

