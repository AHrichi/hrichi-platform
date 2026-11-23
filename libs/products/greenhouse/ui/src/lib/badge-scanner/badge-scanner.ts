import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GhButton } from '../button/button';

/** The Shape Detection API, where the browser has it (Chrome on Android). */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

function detectorClass(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  return typeof ctor === 'function' ? ctor : null;
}

/** Whether this device can scan QR codes with the camera. */
export function canScanBadges(): boolean {
  return (
    detectorClass() !== null &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

const SCAN_EVERY_MS = 250;

/**
 * Reads a badge's QR code with the back camera. It emits the code once and
 * stops; the camera is released when it stops or the view goes away. Where
 * scanning isn't possible it emits `unavailable`, and the badge is typed.
 */
@Component({
  selector: 'gh-badge-scanner',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-scanner.html',
  styleUrl: './badge-scanner.scss',
})
export class GhBadgeScanner {
  readonly scanLabel = input.required<string>();
  readonly stopLabel = input.required<string>();
  readonly hint = input.required<string>();
  readonly scanned = output<string>();
  readonly unavailable = output<void>();

  protected readonly active = signal(false);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected async start(): Promise<void> {
    const Detector = detectorClass();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      this.unavailable.emit();
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch {
      // Refused or no camera.
      this.unavailable.emit();
      return;
    }
    this.active.set(true);
    // The <video> renders once `active` is true.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const video = this.video()?.nativeElement;
    if (!video) {
      this.stop();
      return;
    }
    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    const detector = new Detector({ formats: ['qr_code'] });
    const tick = async () => {
      if (!this.active()) return;
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue) {
          this.stop();
          this.scanned.emit(code.rawValue);
          return;
        }
      } catch {
        // A frame that couldn't be read; try the next one.
      }
      this.timer = setTimeout(tick, SCAN_EVERY_MS);
    };
    void tick();
  }

  protected stop(): void {
    this.active.set(false);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
  }
}
