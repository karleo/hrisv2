/**
 * Chime for each incoming employee message.
 * Browsers require a user gesture before audio; we re-resume on interaction.
 */

let audioContext: AudioContext | null = null;
let unlockInstalled = false;
let lastPlayedMessageId: number | null = null;
let lastPlayedAt = 0;

function getAudioContextCtor(): typeof AudioContext | undefined {
    return (
        window.AudioContext ??
        (
            window as unknown as {
                webkitAudioContext?: typeof AudioContext;
            }
        ).webkitAudioContext
    );
}

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const ctor = getAudioContextCtor();

    if (!ctor) {
        return null;
    }

    if (audioContext?.state === 'closed') {
        audioContext = null;
    }

    audioContext ??= new ctor();

    return audioContext;
}

function resumeAudioContext(ctx: AudioContext): Promise<void> {
    if (ctx.state === 'running') {
        return Promise.resolve();
    }

    return ctx.resume().catch(() => undefined);
}

function scheduleChime(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, startAt);
    osc.frequency.exponentialRampToValueAtTime(620, startAt + 0.14);

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.2, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.000_1, startAt + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.24);
}

async function playWebAudioChime(): Promise<void> {
    const ctor = getAudioContextCtor();

    if (!ctor) {
        return;
    }

    const ctx = getAudioContext();

    if (!ctx) {
        return;
    }

    await resumeAudioContext(ctx);
    scheduleChime(ctx);
}

export function installMessageSoundUnlock(): void {
    if (unlockInstalled || typeof window === 'undefined') {
        return;
    }

    unlockInstalled = true;

    const unlock = (): void => {
        const ctx = getAudioContext();

        if (ctx) {
            void resumeAudioContext(ctx);
        }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
}

/**
 * @param messageId When provided, skips duplicate plays for the same message.
 */
export function playEmployeeMessageUnreadChime(messageId?: number): void {
    if (typeof window === 'undefined') {
        return;
    }

    const now = Date.now();

    if (
        messageId !== undefined &&
        messageId > 0 &&
        messageId === lastPlayedMessageId
    ) {
        return;
    }

    if (messageId === undefined && now - lastPlayedAt < 400) {
        return;
    }

    if (messageId !== undefined && messageId > 0) {
        lastPlayedMessageId = messageId;
    }

    lastPlayedAt = now;

    void playWebAudioChime();
}
