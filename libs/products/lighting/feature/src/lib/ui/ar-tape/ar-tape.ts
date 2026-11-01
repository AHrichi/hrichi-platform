import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AhButton } from '@ah/ui';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { HowTo } from '../how-to/how-to';

/** The few WebXR shapes used here (lib.dom has no WebXR types). */
interface XrHitResult {
  getPose(space: unknown): { transform: { matrix: Float32Array } } | undefined;
}
interface XrFrame {
  getHitTestResults(source: unknown): XrHitResult[];
}
interface XrSession extends EventTarget {
  requestReferenceSpace(type: 'viewer' | 'local'): Promise<unknown>;
  requestHitTestSource?(options: { space: unknown }): Promise<{
    cancel(): void;
  }>;
  end(): Promise<void>;
}
interface XrSystem {
  isSessionSupported(mode: 'immersive-ar'): Promise<boolean>;
  requestSession(
    mode: 'immersive-ar',
    options: Record<string, unknown>,
  ): Promise<XrSession>;
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Straight-line distance between two points in metres. */
export function distance(a: Point3, b: Point3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

type Support = 'checking' | 'yes' | 'no';

/**
 * A tape measure in augmented reality (WebXR hit-test, so ARCore on Android
 * Chrome): drop points on the ground, read the distances. Runs entirely in
 * the browser. Where WebXR AR isn't available (iPhone, desktop) it says so
 * and the angle method stays the way to measure.
 */
@Component({
  selector: 'lp-ar-tape',
  imports: [AhButton, HowTo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ar-tape.html',
  styleUrl: './ar-tape.scss',
})
export class ArTape {
  /** The last segment's length, when the user picks it as the distance. */
  readonly distance = output<number>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly support = signal<Support>('checking');
  protected readonly active = signal(false);
  protected readonly tracking = signal(false);
  protected readonly failed = signal(false);
  protected readonly points = signal<Point3[]>([]);
  protected readonly segments = computed(() => {
    const p = this.points();
    return p.slice(1).map((point, i) => distance(p[i], point));
  });
  protected readonly total = computed(() =>
    this.segments().reduce((sum, d) => sum + d, 0),
  );
  protected readonly last = computed(() => this.segments().at(-1) ?? null);
  protected readonly prompt = computed(() =>
    !this.tracking()
      ? this.t().ar.scanning
      : this.points().length === 0
        ? this.t().ar.aim
        : this.t().ar.next,
  );

  private readonly overlay =
    viewChild.required<ElementRef<HTMLElement>>('overlay');
  private session: XrSession | null = null;
  private stopScene: (() => void) | null = null;
  private addAtReticle: (() => Point3 | null) | null = null;
  private redraw: ((points: Point3[]) => void) | null = null;

  constructor() {
    afterNextRender(() => {
      const xr = (navigator as Navigator & { xr?: XrSystem }).xr;
      if (!xr) {
        this.support.set('no');
        return;
      }
      xr.isSessionSupported('immersive-ar').then(
        (ok) => this.support.set(ok ? 'yes' : 'no'),
        () => this.support.set('no'),
      );
    });
    inject(DestroyRef).onDestroy(() => void this.session?.end());
  }

  protected async start(): Promise<void> {
    const xr = (navigator as Navigator & { xr?: XrSystem }).xr;
    if (!xr) return;
    this.failed.set(false);
    const root = this.overlay().nativeElement;
    // The overlay must be showable when the session starts.
    root.classList.add('is-live');
    try {
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root },
      });
      this.session = session;
      await this.startScene(session);
      this.active.set(true);
    } catch {
      root.classList.remove('is-live');
      this.failed.set(true);
      await this.session?.end().catch(() => undefined);
    }
  }

  /** Renders the reticle, the points and the lines with three.js. */
  private async startScene(session: XrSession): Promise<void> {
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(
      session as unknown as Parameters<typeof renderer.xr.setSession>[0],
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.05, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const markers = new THREE.Group();
    scene.add(markers);
    const line = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffd400 }),
    );
    scene.add(line);
    const dot = new THREE.SphereGeometry(0.015, 16, 12);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffd400 });

    const viewer = await session.requestReferenceSpace('viewer');
    const hitSource = await session.requestHitTestSource?.({ space: viewer });
    const position = new THREE.Vector3();

    renderer.setAnimationLoop((_time: number, frame?: unknown) => {
      if (frame && hitSource) {
        const space = renderer.xr.getReferenceSpace();
        const hit = (frame as XrFrame).getHitTestResults(hitSource)[0];
        const pose = hit?.getPose(space);
        reticle.visible = !!pose;
        if (pose) reticle.matrix.fromArray(pose.transform.matrix);
        if (this.tracking() !== !!pose) this.tracking.set(!!pose);
      }
      renderer.render(scene, camera);
    });

    this.addAtReticle = () => {
      if (!reticle.visible) return null;
      position.setFromMatrixPosition(reticle.matrix);
      return { x: position.x, y: position.y, z: position.z };
    };
    this.redraw = (points) => {
      markers.clear();
      for (const p of points) {
        const marker = new THREE.Mesh(dot, dotMaterial);
        marker.position.set(p.x, p.y, p.z);
        markers.add(marker);
      }
      line.geometry.setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      );
    };

    // A tap anywhere on the camera view adds a point; taps on the
    // overlay's buttons don't (beforexrselect).
    const select = () => this.add();
    session.addEventListener('select', select);
    session.addEventListener('end', () => this.ended(), { once: true });
    this.stopScene = () => {
      session.removeEventListener('select', select);
      hitSource?.cancel();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      dot.dispose();
      dotMaterial.dispose();
    };
  }

  protected add(): void {
    const point = this.addAtReticle?.();
    if (!point) return;
    this.points.update((list) => [...list, point]);
    this.redraw?.(this.points());
  }

  protected undo(): void {
    this.points.update((list) => list.slice(0, -1));
    this.redraw?.(this.points());
  }

  protected clear(): void {
    this.points.set([]);
    this.redraw?.([]);
  }

  protected useLast(): void {
    const last = this.last();
    if (last !== null) {
      this.distance.emit(Math.round(last * 100) / 100);
      void this.session?.end();
    }
  }

  protected close(): void {
    void this.session?.end();
  }

  /** Stops overlay taps from also dropping a point in the scene. */
  protected keepTap(event: Event): void {
    event.preventDefault();
  }

  private ended(): void {
    this.stopScene?.();
    this.stopScene = null;
    this.addAtReticle = null;
    this.redraw = null;
    this.session = null;
    this.active.set(false);
    this.tracking.set(false);
    this.overlay().nativeElement.classList.remove('is-live');
  }
}
