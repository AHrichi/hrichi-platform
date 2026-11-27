import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BarqI18n } from '../i18n/barq-i18n';

/** The part of the Barcode Detection API used here (not in TypeScript's DOM types). */
interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type DetectorClass = new (options: { formats: string[] }) => Detector;

function detectorClass(): DetectorClass | null {
  const found = (globalThis as { BarcodeDetector?: DetectorClass })
    .BarcodeDetector;
  return typeof found === 'function' ? found : null;
}

let nextId = 0;

/**
 * A text field that a camera can fill: staff scan a badge or a gear sticker
 * where the browser reads QR codes (Chrome on Android, Safari on recent
 * iPhones and Macs), and type everywhere else. Typing always works, so the
 * camera is never the only way (WCAG 2.5.6).
 */
@Component({
  selector: 'lt-scan-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-field.html',
  styleUrl: './scan-field.scss',
})
export class ScanField {
  protected readonly i18n = inject(BarqI18n);
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly value = model('');
  /** A complete scan or Enter in the field. */
  readonly submitted = output<string>();

  protected readonly id = `lt-scan-${nextId++}`;
  protected readonly canScan = detectorClass() !== null;
  protected readonly scanning = signal(false);
  protected readonly cameraProblem = signal<'denied' | 'unsupported' | null>(
    null,
  );
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  protected onEnter(event: Event): void {
    event.preventDefault();
    const text = this.value().trim();
    if (text) this.submitted.emit(text);
  }

  protected async start(): Promise<void> {
    const Found = detectorClass();
    if (!Found || !navigator.mediaDevices?.getUserMedia) {
      this.cameraProblem.set('unsupported');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch {
      this.cameraProblem.set('denied');
      return;
    }
    this.cameraProblem.set(null);
    this.scanning.set(true);
    // The video element exists once the template shows it.
    await Promise.resolve();
    const video = this.video()?.nativeElement;
    if (!video) {
      this.stop();
      return;
    }
    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    const detector = new Found({ formats: ['qr_code'] });
    const tick = async () => {
      if (!this.scanning()) return;
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue) {
          this.value.set(code.rawValue);
          this.stop();
          this.submitted.emit(code.rawValue);
          return;
        }
      } catch {
        // A frame that can't be read: try the next one.
      }
      this.timer = setTimeout(tick, 250);
    };
    void tick();
  }

  protected stop(): void {
    this.scanning.set(false);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
  }
}
