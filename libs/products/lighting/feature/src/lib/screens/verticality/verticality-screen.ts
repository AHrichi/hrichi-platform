import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
  untracked,
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

/** About a second of samples at the usual 60 Hz. */
const WINDOW = 60;
/** Spread below which the phone counts as still, in degrees. */
const STEADY_SPREAD = 0.06;

/** The compass point the pole leans towards. */
function leanDirection(north: number, east: number): CompassDirection {
  const bearing = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
  return DIRECTIONS[Math.round(bearing / 45) % 8];
}

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;
const spread = (values: number[]) => {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
};

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
  protected readonly poleHeight = signal(8);
  protected readonly boltPitch = signal(300);
  protected readonly poleId = signal('');
  protected readonly sensor = signal<SensorState>('off');
  protected readonly certified = signal<string | null>(null);

  /** Which way the user looks, towards the pole, on side A. */
  protected readonly facing = signal<CompassDirection>('N');
  /** The phone's current reading, averaged over the last second. */
  protected readonly live = signal<(LeanReading & { steady: boolean }) | null>(
    null,
  );
  protected readonly sideA = signal<LeanReading | null>(null);
  protected readonly sideB = signal<LeanReading | null>(null);
  private samples: LeanReading[] = [];

  /** The guide step the user is on, lit up in the pictures. */
  protected readonly guideStep = computed(() => {
    if (this.sensor() !== 'on') return 0;
    if (this.sideA()) return this.sideB() ? 0 : 4;
    return this.live()?.steady ? 3 : 2;
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
    const reading = gravityToLean(g.x, g.y, g.z);
    if (!reading) {
      this.samples = [];
      this.live.set(null);
      return;
    }
    this.samples.push(reading);
    if (this.samples.length > WINDOW) this.samples.shift();
    const sideways = this.samples.map((s) => s.sideways);
    const away = this.samples.map((s) => s.away);
    this.live.set({
      sideways: mean(sideways),
      away: mean(away),
      steady:
        this.samples.length >= WINDOW / 2 &&
        spread(sideways) < STEADY_SPREAD &&
        spread(away) < STEADY_SPREAD,
    });
    // Before anything is saved, the drawing follows the phone.
    if (!this.sideA()) this.apply(this.live() as LeanReading);
  };

  constructor() {
    // Start from the first pole of the project, with its height.
    effect(() => {
      const poles = this.store.activeProject()?.poles ?? [];
      untracked(() => {
        if (!poles.some((p) => p.id === this.poleId()) && poles[0]) {
          this.selectPole(poles[0].id);
        }
      });
    });
    inject(DestroyRef).onDestroy(() => this.stopSensor());
  }

  protected selectPole(id: string): void {
    this.poleId.set(id);
    const pole = this.store.activeProject()?.poles.find((p) => p.id === id);
    if (pole) {
      this.poleHeight.set(pole.heightMeters);
    }
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
    this.samples = [];
    window.addEventListener('devicemotion', this.onMotion);
    this.sensor.set('on');
  }

  private stopSensor(): void {
    if (this.isBrowser) {
      window.removeEventListener('devicemotion', this.onMotion);
    }
    this.live.set(null);
  }

  protected save(side: 'A' | 'B'): void {
    const reading = this.live();
    if (!reading?.steady) return;
    const { sideways, away } = reading;
    (side === 'A' ? this.sideA : this.sideB).set({ sideways, away });
    const a = this.sideA();
    const b = this.sideB();
    if (a) this.apply(b ? combineSides(a, b) : a);
  }

  protected restart(): void {
    this.sideA.set(null);
    this.sideB.set(null);
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
