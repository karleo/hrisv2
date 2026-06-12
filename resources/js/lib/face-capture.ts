const MAX_CAPTURE_WIDTH = 960;
const MAX_BYTES = 180 * 1024;

/**
 * Wait until the video element has drawable dimensions (metadata / first frames).
 */
export function waitForVideoDimensions(
    video: HTMLVideoElement,
    timeoutMs = 4000,
): Promise<boolean> {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        let settled = false;
        let rafId = 0;

        const done = (ok: boolean): void => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timer);
            if (rafId !== 0) {
                window.cancelAnimationFrame(rafId);
            }
            video.removeEventListener('loadedmetadata', onMeta);
            video.removeEventListener('loadeddata', onMeta);
            video.removeEventListener('playing', onMeta);
            video.removeEventListener('canplay', onMeta);
            video.removeEventListener('resize', onMeta);
            resolve(ok);
        };

        const onMeta = (): void => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                done(true);
            }
        };

        const timer = window.setTimeout(() => done(false), timeoutMs);
        const poll = (): void => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                done(true);
                return;
            }

            rafId = window.requestAnimationFrame(poll);
        };

        video.addEventListener('loadedmetadata', onMeta);
        video.addEventListener('loadeddata', onMeta);
        video.addEventListener('playing', onMeta);
        video.addEventListener('canplay', onMeta);
        video.addEventListener('resize', onMeta);
        poll();
    });
}

export async function canvasToJpegFile(canvas: HTMLCanvasElement): Promise<File | null> {
    const toBlob = (quality: number) =>
        new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });

    let quality = 0.82;
    let blob = await toBlob(quality);
    while (blob && blob.size > MAX_BYTES && quality > 0.45) {
        quality -= 0.07;
        blob = await toBlob(quality);
    }
    if (!blob) {
        return null;
    }
    return new File([blob], 'face_capture.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
}

/**
 * Draw the current video frame to a JPEG file (for login scan-at-submit).
 */
export async function grabJpegFromVideoElement(
    video: HTMLVideoElement,
): Promise<File | null> {
    const ready = await waitForVideoDimensions(video);
    if (!ready || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
    }

    const scale = Math.min(1, MAX_CAPTURE_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }
    ctx.drawImage(video, 0, 0, w, h);

    return canvasToJpegFile(canvas);
}

function dataUrlToJpegFile(dataUrl: string, filename: string): File | null {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) {
        return null;
    }
    const base64 = dataUrl.slice(comma + 1);
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Same frame encoding as {@link grabJpegFromVideoElement} but synchronous (no toBlob).
 * Used at sign-in so the JPEG is ready before the request is sent.
 */
export function grabJpegFromVideoElementSync(video: HTMLVideoElement): File | null {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
    }

    const scale = Math.min(1, MAX_CAPTURE_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }
    ctx.drawImage(video, 0, 0, w, h);

    let quality = 0.82;
    for (let i = 0; i < 18; i++) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const approxBytes = Math.round((base64Len * 3) / 4);
        if (approxBytes <= MAX_BYTES || quality <= 0.45) {
            return dataUrlToJpegFile(dataUrl, 'face_capture.jpg');
        }
        quality -= 0.05;
    }

    return dataUrlToJpegFile(canvas.toDataURL('image/jpeg', 0.45), 'face_capture.jpg');
}
