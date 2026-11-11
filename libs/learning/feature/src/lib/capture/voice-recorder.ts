import { Injectable, signal } from '@angular/core';

export type RecorderState =
  'idle' | 'starting' | 'recording' | 'unsupported' | 'denied';

export interface RecordedAudio {
  bytes: ArrayBuffer;
  mimeType: string;
  seconds: number;
}

/** Voice notes stop on their own after this (design §6.2: ≤ 2 min). */
export const MAX_SECONDS = 120;
/** Shorter than this was probably a slip of the finger. */
const MIN_SECONDS = 1;

/** Opus in WebM where the browser has it (Chrome, Firefox), else MP4 (Safari). */
function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';
}

/**
 * Records a voice note with MediaRecorder. The page needs the microphone
 * permission (`Permissions-Policy: microphone=(self)` on its origin).
 */
@Injectable({ providedIn: 'root' })
export class VoiceRecorder {
  readonly state = signal<RecorderState>('idle');
  readonly seconds = signal(0);

  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private ticker: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private stopped: Promise<RecordedAudio | null> | null = null;
  private resolveStop: ((audio: RecordedAudio | null) => void) | null = null;
  private discard = false;

  get supported(): boolean {
    return (
      typeof MediaRecorder !== 'undefined' &&
      !!globalThis.navigator?.mediaDevices?.getUserMedia
    );
  }

  async start(): Promise<void> {
    if (!this.supported) {
      this.state.set('unsupported');
      return;
    }
    if (this.state() === 'recording' || this.state() === 'starting') return;
    this.state.set('starting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.state.set('denied');
      return;
    }
    const mimeType = pickMimeType();
    this.recorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    this.chunks = [];
    this.discard = false;
    this.recorder.ondataavailable = (event) => {
      if (event.data.size) this.chunks.push(event.data);
    };
    this.stopped = new Promise((resolve) => (this.resolveStop = resolve));
    this.recorder.onstop = () => void this.finish();
    this.recorder.start();
    this.startedAt = Date.now();
    this.seconds.set(0);
    this.ticker = setInterval(() => {
      const seconds = Math.floor((Date.now() - this.startedAt) / 1000);
      this.seconds.set(seconds);
      if (seconds >= MAX_SECONDS) void this.stop();
    }, 250);
    this.state.set('recording');
  }

  /** The recording, or null when it was too short or cancelled. */
  async stop(): Promise<RecordedAudio | null> {
    if (!this.recorder || this.recorder.state === 'inactive') {
      return this.stopped ?? null;
    }
    this.recorder.stop();
    return this.stopped ?? null;
  }

  cancel(): void {
    this.discard = true;
    void this.stop();
  }

  private async finish(): Promise<void> {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const seconds = (Date.now() - this.startedAt) / 1000;
    const mimeType = this.recorder?.mimeType || 'audio/webm';
    this.recorder = null;
    this.state.set('idle');
    this.seconds.set(0);
    let audio: RecordedAudio | null = null;
    if (!this.discard && seconds >= MIN_SECONDS && this.chunks.length) {
      const blob = new Blob(this.chunks, { type: mimeType });
      audio = { bytes: await blob.arrayBuffer(), mimeType, seconds };
    }
    this.chunks = [];
    this.resolveStop?.(audio);
    this.resolveStop = null;
  }
}
