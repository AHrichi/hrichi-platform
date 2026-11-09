import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AhAlert, AhButton, AhMetricCard } from '@ah/ui';
import {
  checkPoleVerticality,
  combineSides,
  type CompassDirection,
  gravityToLean,
  type LeanReading,
  leanToCompass,
  smoothReading,
  summarizeReadings,
} from '@ah/products/lighting/domain';
import { PlumbDiagram } from '../../diagrams/plumb-diagram/plumb-diagram';
import { PlumbGuide } from '../../diagrams/plumb-guide/plumb-guide';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { NumberField } from '../../ui/number-field/number-field';
import { DIRECTIONS } from '../options';

type SensorState = 'off' | 'on' | 'denied' | 'unsupported';

interface MotionPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** Chrome's fused gravity sensor (Generic Sensor API): steadier than raw motion. */
interface GravitySensorLike extends EventTarget {
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
  start(): void;
  stop(): void;
}
type GravitySensorCtor = new (options: {
  frequency: number;
}) => GravitySensorLike;

/** A side is measured over this long; averaging cancels the sensor jitter. */
const CAPTURE_MS = 3000;
/**
 * Spread (standard deviation) of a capture above which the phone moved.
 * Held still, phone sensors jitter by a few tenths of a degree; that much
 * is averaged out, more means the phone was shifting on the pole.
 */
const MAX_SPREAD = 0.6;

/** The compass point the pole leans towards. */
function leanDirection(north: number, east: number): CompassDirection {
  const bearing = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
  return DIRECTIONS[Math.round(bearing / 45) % 8];
}

/**
 * Plumb check (EN 40-3): hold the phone upright against the pole on one
 * side, then on the opposite side, or enter a spirit level's reading. The
 * tolerance is 1°. Certifying writes the tilt to the pole.
 */
@Component({
  selector: 'lp-verticality-screen',
  imports: [
    AhAlert,
    AhButton,
    AhMetricCard,
    NumberField,
    PlumbDiagram,
    PlumbGuide,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verticality-screen.html',
  styleUrl: './verticality-screen.scss',
})
export class VerticalityScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly directions = DIRECTIONS;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** North (+) / south (−) and east (+) / west (−) lean, in degrees. */
  protected readonly pitch = signal(0.4);
  protected readonly roll = signal(-0.3);
  protected readonly poleId = linkedSignal<string>(() => {
    const poles = this.store.activeProject()?.poles ?? [];
    return poles[0]?.id ?? '';
  });
  protected readonly poleHeight = linkedSignal<number>(() => {
    const id = this.poleId();
    const pole = this.store.activeProject()?.poles.find((p) => p.id === id);
    return pole?.heightMeters ?? 8;
  });
  protected readonly boltPitch = signal(300);
  protected readonly sensor = signal<SensorState>('off');
  protected readonly certified = signal<string | null>(null);

  /** Which way the user looks, towards the pole, on side A. */
  protected readonly facing = signal<CompassDirection>('N');
  /** The phone's current reading, smoothed so it doesn't jump. */
  protected readonly live = signal<LeanReading | null>(null);
  protected readonly sideA = signal<LeanReading | null>(null);
  protected readonly sideB = signal<LeanReading | null>(null);
  /** A side being measured, and how far along (0 to 100). */
  protected readonly capture = signal<{
    side: 'A' | 'B';
    progress: number;
  } | null>(null);
  /** The last capture was refused because the phone moved. */
  protected readonly moved = signal(false);
  private samples: LeanReading[] = [];
  private captureStart = 0;
  private gravity: GravitySensorLike | null = null;

  /** The guide step the user is on, lit up in the pictures. */
  protected readonly guideStep = computed(() => {
    if (this.sensor() !== 'on') return 0;
    if (this.capture()) return 3;
    if (this.sideA()) return this.sideB() ? 0 : 4;
    return 2;
  });

  /** Follows the level until the user picks a direction by hand. */
  protected readonly direction = signal<CompassDirection | null>(null);
  protected readonly lean = computed(
    () => this.direction() ?? leanDirection(this.pitch(), this.roll()),
  );

  protected readonly result = computed(() =>
    checkPoleVerticality({
      measuredTiltDegrees: Math.hypot(this.pitch(), this.roll()),
      measuredDirection: this.lean(),
      poleHeightMeters: this.poleHeight(),
      baseplateDiameterMm: this.boltPitch(),
      anchorBoltPitchMm: this.boltPitch(),
    }),
  );

  private readonly onMotion = (event: DeviceMotionEvent) => {
    const g = event.accelerationIncludingGravity;
    if (g?.x == null || g.y == null || g.z == null) return;
    this.onGravity(g.x, g.y, g.z);
  };

  /** One gravity sample, from either sensor. */
  private onGravity(x: number, y: number, z: number): void {
    const reading = gravityToLean(x, y, z);
    if (!reading) {
      this.live.set(null);
      return;
    }
    const live = smoothReading(this.live(), reading);
    this.live.set(live);
    // Before anything is saved, the drawing follows the phone.
    if (!this.sideA()) this.apply(live);

    const capture = this.capture();
    if (!capture) return;
    this.samples.push(reading);
    const elapsed = performance.now() - this.captureStart;
    if (elapsed < CAPTURE_MS) {
      this.capture.set({
        side: capture.side,
        progress: Math.round((elapsed / CAPTURE_MS) * 100),
      });
      return;
    }
    this.finishCapture(capture.side);
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopSensor());
  }

  protected selectPole(id: string): void {
    this.poleId.set(id);
  }

  protected async toggleSensor(): Promise<void> {
    if (this.sensor() === 'on') {
      this.stopSensor();
      this.sensor.set('off');
      return;
    }
    if (!this.isBrowser || !('DeviceMotionEvent' in window)) {
      this.sensor.set('unsupported');
      return;
    }
    // iOS asks for motion access, from a tap.
    const permission = (DeviceMotionEvent as unknown as MotionPermission)
      .requestPermission;
    if (permission) {
      try {
        if ((await permission()) !== 'granted') {
          this.sensor.set('denied');
          return;
        }
      } catch {
        this.sensor.set('denied');
        return;
      }
    }
    this.live.set(null);
    if (!this.startGravitySensor()) {
      window.addEventListener('devicemotion', this.onMotion);
    }
    this.sensor.set('on');
  }

  /** Uses the fused gravity sensor where the browser has one (Chrome). */
  private startGravitySensor(): boolean {
    const Sensor = (window as unknown as { GravitySensor?: GravitySensorCtor })
      .GravitySensor;
    if (!Sensor) return false;
    try {
      const sensor = new Sensor({ frequency: 60 });
      sensor.addEventListener('reading', () => {
        if (sensor.x != null && sensor.y != null && sensor.z != null) {
          this.onGravity(sensor.x, sensor.y, sensor.z);
        }
      });
      // Refused or missing hardware: fall back to the motion events.
      sensor.addEventListener('error', () => {
        sensor.stop();
        this.gravity = null;
        if (this.sensor() === 'on') {
          window.addEventListener('devicemotion', this.onMotion);
        }
      });
      sensor.start();
      this.gravity = sensor;
      return true;
    } catch {
      return false;
    }
  }

  private stopSensor(): void {
    if (this.isBrowser) {
      window.removeEventListener('devicemotion', this.onMotion);
    }
    this.gravity?.stop();
    this.gravity = null;
    this.live.set(null);
    this.capture.set(null);
  }

  /** Measures one side: keep still for three seconds while it averages. */
  protected save(side: 'A' | 'B'): void {
    if (!this.live() || this.capture()) return;
    this.moved.set(false);
    this.samples = [];
    this.captureStart = performance.now();
    this.capture.set({ side, progress: 0 });
  }

  private finishCapture(side: 'A' | 'B'): void {
    this.capture.set(null);
    const { mean, spread } = summarizeReadings(this.samples);
    this.samples = [];
    if (spread > MAX_SPREAD) {
      this.moved.set(true);
      return;
    }
    const rounded = {
      sideways: Math.round(mean.sideways * 100) / 100,
      away: Math.round(mean.away * 100) / 100,
    };
    (side === 'A' ? this.sideA : this.sideB).set(rounded);
    const a = this.sideA();
    const b = this.sideB();
    if (a) this.apply(b ? combineSides(a, b) : a);
  }

  protected restart(): void {
    this.sideA.set(null);
    this.sideB.set(null);
    this.moved.set(false);
    this.samples = [];
  }

  protected setFacing(value: string): void {
    this.facing.set(value as CompassDirection);
    const a = this.sideA();
    const b = this.sideB();
    if (a) this.apply(b ? combineSides(a, b) : a);
  }

  /** Shows a reading (side A's frame) as compass components on the level. */
  private apply(reading: LeanReading): void {
    const facing = DIRECTIONS.indexOf(this.facing()) * 45;
    const { north, east } = leanToCompass(reading, facing);
    this.pitch.set(Math.round(north * 100) / 100);
    this.roll.set(Math.round(east * 100) / 100);
    this.direction.set(null);
  }

  protected async certify(): Promise<void> {
    const pole = this.store
      .activeProject()
      ?.poles.find((p) => p.id === this.poleId());
    if (!pole) return;
    const { tiltDegrees, isCompliant } = this.result();
    const raised =
      pole.status === 'planned' ||
      pole.status === 'excavated' ||
      pole.status === 'poured';
    await this.store.updatePole({
      ...pole,
      heightMeters: this.poleHeight(),
      measuredVerticalTilt: tiltDegrees,
      inspectedDate: new Date().toISOString().slice(0, 10),
      status: isCompliant && raised ? 'erected' : pole.status,
    });
    this.certified.set(pole.code);
    setTimeout(() => this.certified.set(null), 5000);
  }
}
