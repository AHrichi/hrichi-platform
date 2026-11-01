import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AhAlert, AhButton, AhMetricCard } from '@ah/ui';
import { measurePoleHeight } from '@ah/products/lighting/domain';
import { CameraGuide } from '../../diagrams/camera-guide/camera-guide';
import {
  READING_LIMITS,
  RangefinderDiagram,
} from '../../diagrams/rangefinder-diagram/rangefinder-diagram';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { ArTape } from '../../ui/ar-tape/ar-tape';
import { NumberField } from '../../ui/number-field/number-field';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';

const EYE_KEY = 'luxpath_eye_height';
/** Pixels per degree in the illustrated viewfinder. */
const SCENE_PX_PER_DEG = 6;

type SensorState = 'off' | 'on' | 'denied' | 'unsupported';

interface OrientationPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * The camera rangefinder: sight a pole's foot, then its top, and the phone's
 * tilt gives its distance and height. Every reading stays editable before (and
 * after) saving, with the diagram showing what each value means.
 */
@Component({
  selector: 'lp-camera-screen',
  imports: [
    AhAlert,
    AhButton,
    AhMetricCard,
    ArTape,
    CameraGuide,
    RangefinderDiagram,
    NumberField,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './camera-screen.html',
  styleUrl: './camera-screen.scss',
})
export class CameraScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = READING_LIMITS;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  /** Live sight angle: positive above the horizon, negative below. */
  protected readonly sight = signal(-9.4);
  protected readonly sensor = signal<SensorState>('off');
  protected readonly cameraOn = signal(false);
  protected readonly cameraError = signal<'denied' | 'missing' | null>(null);

  // The readings, editable at any time.
  protected readonly eyeHeight = signal(this.storedEyeHeight());
  protected readonly baseAngle = signal(9.4);
  protected readonly topAngle = signal(34.6);
  protected readonly baseLocked = signal(false);
  protected readonly topLocked = signal(false);

  protected readonly step = computed(() =>
    !this.baseLocked() ? 2 : !this.topLocked() ? 3 : 0,
  );
  protected readonly measured = computed(() =>
    measurePoleHeight(this.eyeHeight(), this.baseAngle(), this.topAngle()),
  );
  /** Example readings are shown until both sightings are taken. */
  protected readonly isExample = computed(
    () => !(this.baseLocked() && this.topLocked()) && !this.editingId(),
  );
  /** The illustrated viewfinder scrolls with the sight angle. */
  protected readonly sceneOffset = computed(
    () => this.sight() * SCENE_PX_PER_DEG,
  );

  // Saving and editing
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingLabel = signal<string | null>(null);
  protected readonly poleId = signal<string>('');
  protected readonly applyToPole = signal(true);
  protected readonly suggestedLabel = computed(() => {
    const pole = this.store
      .activeProject()
      ?.poles.find((p) => p.id === this.poleId());
    return `${pole ? pole.code + ' · ' : ''}H ${this.i18n.num(this.measured().heightMeters)} m · D ${this.i18n.num(this.measured().distanceMeters)} m`;
  });

  private stream: MediaStream | null = null;
  private readonly onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null) return;
    // Upright portrait reads beta = 90°; tilting the camera up raises it.
    const angle = event.beta - 90;
    this.sight.set(Math.round((this.sight() * 0.7 + angle * 0.3) * 10) / 10);
  };

  private readonly query = toSignal(this.route.queryParamMap);

  constructor() {
    effect(() => {
      const editId = this.query()?.get('edit') ?? null;
      const saved = this.store.measurements().find((m) => m.id === editId);
      untracked(() => {
        if (saved && saved.id !== this.editingId()) {
          this.editingId.set(saved.id);
          this.editingLabel.set(saved.label);
          this.eyeHeight.set(saved.eyeHeightMeters);
          this.baseAngle.set(saved.baseDepressionDegrees);
          this.topAngle.set(saved.topElevationDegrees);
          this.baseLocked.set(true);
          this.topLocked.set(true);
          this.poleId.set(saved.poleId ?? '');
        }
      });
    });

    effect(() => {
      const element = this.video()?.nativeElement;
      if (element && this.cameraOn() && this.stream) {
        element.srcObject = this.stream;
      }
    });

    effect(() => {
      const eye = this.eyeHeight();
      if (this.isBrowser) {
        try {
          localStorage.setItem(EYE_KEY, String(eye));
        } catch {
          // Storage can be blocked; the default eye height still works.
        }
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.stopCamera();
      this.stopSensor();
    });
  }

  private storedEyeHeight(): number {
    if (!this.isBrowser) return 1.65;
    try {
      const value = Number(localStorage.getItem(EYE_KEY));
      return value >= 1 && value <= 2.2 ? value : 1.65;
    } catch {
      return 1.65;
    }
  }

  protected async toggleCamera(): Promise<void> {
    if (this.cameraOn()) {
      this.stopCamera();
      return;
    }
    this.cameraError.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set('missing');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.cameraOn.set(true);
      await this.startSensor();
    } catch (error) {
      const name = (error as DOMException)?.name;
      this.cameraError.set(
        name === 'NotFoundError' || name === 'OverconstrainedError'
          ? 'missing'
          : 'denied',
      );
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.cameraOn.set(false);
  }

  /** iOS asks for motion access, and only from a tap. */
  protected async startSensor(): Promise<void> {
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

  /**
   * A distance measured with the AR tape (eye to pole foot, along the ground)
   * sets the foot's angle, so the top's angle alone then gives the height.
   */
  protected useArDistance(meters: number): void {
    if (meters <= 0) return;
    const angle = (Math.atan(this.eyeHeight() / meters) * 180) / Math.PI;
    this.baseAngle.set(Math.round(angle * 10) / 10);
    this.baseLocked.set(true);
  }

  protected lockBase(): void {
    const { min, max } = READING_LIMITS.base;
    this.baseAngle.set(Math.min(max, Math.max(min, Math.abs(this.sight()))));
    this.baseLocked.set(true);
  }

  protected lockTop(): void {
    const { min, max } = READING_LIMITS.top;
    this.topAngle.set(Math.min(max, Math.max(min, Math.abs(this.sight()))));
    this.topLocked.set(true);
  }

  protected restart(): void {
    this.baseLocked.set(false);
    this.topLocked.set(false);
  }

  protected async save(request: SaveRequest): Promise<void> {
    const { distanceMeters, heightMeters } = this.measured();
    const poleId = this.poleId() || undefined;
    const id = await this.store.saveMeasurement({
      id: request.replace ? (this.editingId() ?? undefined) : undefined,
      label: request.label,
      eyeHeightMeters: this.eyeHeight(),
      baseDepressionDegrees: this.baseAngle(),
      topElevationDegrees: this.topAngle(),
      distanceMeters,
      heightMeters,
      poleId,
    });
    const pole = this.store.activeProject()?.poles.find((p) => p.id === poleId);
    if (pole && this.applyToPole()) {
      await this.store.updatePole({ ...pole, heightMeters });
    }
    this.editingId.set(id);
    this.editingLabel.set(request.label);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: id },
      replaceUrl: true,
    });
  }

  protected stopEditing(): void {
    this.editingId.set(null);
    this.editingLabel.set(null);
    this.restart();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }
}
