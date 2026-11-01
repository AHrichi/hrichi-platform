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
  type CompassDirection,
} from '@ah/products/lighting/domain';
import { PlumbDiagram } from '../../diagrams/plumb-diagram/plumb-diagram';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { NumberField } from '../../ui/number-field/number-field';
import { DIRECTIONS } from '../options';

type SensorState = 'off' | 'on' | 'denied' | 'unsupported';

interface OrientationPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** The compass point the pole leans towards, facing north. */
function leanDirection(pitch: number, roll: number): CompassDirection {
  const bearing = ((Math.atan2(roll, pitch) * 180) / Math.PI + 360) % 360;
  return DIRECTIONS[Math.round(bearing / 45) % 8];
}

/**
 * Plumb check (EN 40-3): hold the phone flat against the pole, or enter the
 * level's reading; the tolerance is 1°. Certifying writes the tilt to the pole.
 */
@Component({
  selector: 'lp-verticality-screen',
  imports: [AhAlert, AhButton, AhMetricCard, NumberField, PlumbDiagram],
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

  protected readonly pitch = signal(0.4);
  protected readonly roll = signal(-0.3);
  protected readonly poleHeight = signal(8);
  protected readonly boltPitch = signal(300);
  protected readonly poleId = signal('');
  protected readonly sensor = signal<SensorState>('off');
  protected readonly certified = signal<string | null>(null);

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

  private readonly onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    // Phone flat against the pole, screen out: beta 90° when plumb.
    this.pitch.set(Math.round((event.beta - 90) * 20) / 20);
    this.roll.set(Math.round(event.gamma * 20) / 20);
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
    if (!this.isBrowser || !('DeviceOrientationEvent' in window)) {
      this.sensor.set('unsupported');
      return;
    }
    const permission = (
      DeviceOrientationEvent as unknown as OrientationPermission
    ).requestPermission;
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
    window.addEventListener('deviceorientation', this.onOrientation, true);
    this.sensor.set('on');
  }

  private stopSensor(): void {
    if (this.isBrowser) {
      window.removeEventListener('deviceorientation', this.onOrientation, true);
    }
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
