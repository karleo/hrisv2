/**
 * Short, subtle chime when header chat unread count increases.
 * Uses Web Audio (no asset); may be blocked by browser autoplay until user gesture.
 */
export function playEmployeeMessageUnreadChime(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const ctor =
            window.AudioContext ??
            (
                window as unknown as {
                    webkitAudioContext?: typeof AudioContext;
                }
            ).webkitAudioContext;

        if (!ctor) {
            return;
        }

        const ctx = new ctor();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.000_1, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);

        window.setTimeout(() => {
            void ctx.close().catch(() => {});
        }, 400);
    } catch {
        // Autoplay policy, missing AudioContext, etc.
    }
}
