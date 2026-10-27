import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { OrbitControls } from './orbit-controls';
import { lightTheme } from '@ah/design-system/tokens';
import {
  createStage,
  type SceneController,
  type SceneInit,
  type SceneModule,
} from '@ah/three/engine';
import { landMask } from './land';
import {
  atmosphereFragment,
  earthFragment,
  earthVertex,
  highlightFragment,
  highlightVertex,
  satelliteFragment,
  satelliteVertex,
} from './shaders';
import type { OrbitFeed, OrbitFrame, OrbitGlobeParams } from './types';

/** Earth's rotation rate, rad/s, to turn it between frames. */
const EARTH_RATE = 7.2921159e-5;
const colour = (token: keyof typeof lightTheme) =>
  new Color(lightTheme[token] as string);

/**
 * The Orbit lab's globe (ADR-0014): a dot-matrix Earth lit by the real Sun,
 * an atmosphere, and the whole catalog as one point cloud coloured by orbit
 * class. Drag to orbit, scroll to zoom, click a satellite to select it.
 */
export async function createScene({
  canvas,
  tier,
  params: initial,
  events,
}: SceneInit<OrbitGlobeParams>): Promise<SceneController<OrbitGlobeParams>> {
  let params = initial;
  const stage = createStage({ canvas, tier, fov: 38 });
  stage.camera.position.set(0, 1.2, 4.4);

  const controls = new OrbitControls(stage.camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.4;
  controls.maxDistance = 14;
  controls.rotateSpeed = 0.5;
  controls.autoRotateSpeed = 0.35;
  controls.autoRotate = !params.reducedMotion;
  // Any interaction stops the slow turn for good.
  controls.addEventListener('start', () => (controls.autoRotate = false));
  stage.track(controls);

  const sun = { value: new Vector3(1, 0, 0) };
  const earth = new Mesh(
    new SphereGeometry(
      1,
      tier === 'high' ? 128 : 72,
      tier === 'high' ? 96 : 48,
    ),
    new ShaderMaterial({
      uniforms: {
        uLand: { value: landMask(canvas.ownerDocument) },
        uSun: sun,
        uOcean: {
          value: colour('color-stage-bg').lerp(colour('color-data-4'), 0.08),
        },
        uLandDay: { value: colour('color-stage-text').multiplyScalar(0.8) },
        uLandNight: { value: colour('color-stage-muted').multiplyScalar(0.35) },
        uRows: { value: tier === 'high' ? 180 : 120 },
      },
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
    }),
  );
  stage.scene.add(earth);

  const atmosphere = new Mesh(
    new SphereGeometry(1.035, 64, 48),
    new ShaderMaterial({
      uniforms: { uColour: { value: colour('color-data-4') }, uSun: sun },
      vertexShader: earthVertex,
      fragmentShader: atmosphereFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  stage.scene.add(atmosphere);

  // Satellites: `position` holds the previous frame, `aNext` the next one.
  const satelliteUniforms = {
    uMix: { value: 0 },
    uDim: { value: 1 },
    uPixelRatio: { value: stage.renderer.getPixelRatio() },
    uGroupMask: { value: params.groupMask },
    uColours: {
      value: [
        colour('color-data-4'),
        colour('color-data-3'),
        colour('color-data-2'),
        colour('color-data-5'),
      ],
    },
  };
  const satellites = new Points(
    new BufferGeometry(),
    new ShaderMaterial({
      uniforms: satelliteUniforms,
      vertexShader: satelliteVertex,
      fragmentShader: satelliteFragment,
      transparent: true,
      depthWrite: false,
    }),
  );
  satellites.frustumCulled = false;
  stage.scene.add(satellites);

  const highlight = (size: number, ring: number) =>
    new ShaderMaterial({
      uniforms: {
        uColour: { value: colour('color-data-1') },
        uSize: { value: size },
        uRing: { value: ring },
        uPixelRatio: { value: stage.renderer.getPixelRatio() },
      },
      vertexShader: highlightVertex,
      fragmentShader: highlightFragment,
      transparent: true,
      depthWrite: false,
    });
  const markerGeometry = new BufferGeometry();
  markerGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(3), 3),
  );
  const marker = new Points(markerGeometry, highlight(18, 1));
  marker.visible = false;
  marker.frustumCulled = false;
  stage.scene.add(marker);

  const path = new Points(new BufferGeometry(), highlight(3, 0));
  path.visible = false;
  path.frustumCulled = false;
  stage.scene.add(path);

  // Frames from the feed: interpolate between the last two.
  let previous: OrbitFrame | null = null;
  let next: OrbitFrame | null = null;
  let feed: OrbitFeed | null = null;
  let unsubscribe: (() => void) | null = null;

  function attach(source: OrbitFeed | null): void {
    unsubscribe?.();
    unsubscribe = null;
    feed = source;
    previous = next = null;
    satellites.geometry.dispose();
    satellites.geometry = new BufferGeometry();
    if (!source) {
      return;
    }
    const empty = new Float32Array(source.count * 3);
    satellites.geometry.setAttribute('position', new BufferAttribute(empty, 3));
    satellites.geometry.setAttribute(
      'aNext',
      new BufferAttribute(empty.slice(), 3),
    );
    satellites.geometry.setAttribute(
      'aClass',
      new BufferAttribute(Float32Array.from(source.classes), 1),
    );
    satellites.geometry.setAttribute(
      'aGroup',
      new BufferAttribute(Float32Array.from(source.groups), 1),
    );
    unsubscribe = source.subscribe((frame) => {
      if (frame.positions.length !== source.count * 3) {
        return;
      }
      previous = next ?? frame;
      next = frame;
      (satellites.geometry.getAttribute('position') as BufferAttribute).set(
        previous.positions,
      );
      (satellites.geometry.getAttribute('aNext') as BufferAttribute).set(
        next.positions,
      );
      satellites.geometry.getAttribute('position').needsUpdate = true;
      satellites.geometry.getAttribute('aNext').needsUpdate = true;
    });
  }

  function showPath(points: Float32Array | null): void {
    path.geometry.dispose();
    path.geometry = new BufferGeometry();
    path.visible = points !== null && points.length >= 6;
    if (points) {
      path.geometry.setAttribute('position', new BufferAttribute(points, 3));
    }
  }

  attach(params.feed);
  showPath(params.path);

  const position = new Vector3();
  const other = new Vector3();
  /** Interpolated position of satellite i, in scene units. */
  function satelliteAt(i: number, mix: number, target: Vector3): Vector3 {
    if (!previous || !next) {
      return target.set(0, 0, 0);
    }
    target.fromArray(previous.positions, i * 3);
    other.fromArray(next.positions, i * 3);
    return target.lerp(other, mix);
  }

  let mix = 0;
  stage.onFrame(({ delta }) => {
    controls.update();
    const dimTarget = params.selected === null ? 1 : 0.3;
    satelliteUniforms.uDim.value +=
      (dimTarget - satelliteUniforms.uDim.value) * Math.min(1, delta * 4);
    const now = params.clock();
    if (previous && next) {
      const span = next.time - previous.time;
      mix =
        span > 0 ? Math.min(Math.max((now - previous.time) / span, 0), 1) : 1;
    }
    satelliteUniforms.uMix.value = mix;
    const latest = next ?? previous;
    if (latest) {
      earth.rotation.y =
        latest.gmst + EARTH_RATE * ((now - latest.time) / 1000);
      sun.value.fromArray(latest.sun);
    }
    const selected = params.selected;
    marker.visible =
      selected !== null && feed !== null && selected < feed.count;
    if (marker.visible && selected !== null) {
      satelliteAt(selected, mix, position);
      marker.visible = position.lengthSq() > 0.25;
      (markerGeometry.getAttribute('position') as BufferAttribute).set(
        position.toArray(),
      );
      markerGeometry.getAttribute('position').needsUpdate = true;
    }
  });

  // Click (or tap) picks the nearest visible satellite on screen.
  let down: { x: number; y: number } | null = null;
  const onDown = (event: PointerEvent) =>
    (down = { x: event.clientX, y: event.clientY });
  const onUp = (event: PointerEvent) => {
    if (
      !down ||
      Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
    ) {
      down = null;
      return; // a drag, not a click
    }
    down = null;
    const rect = canvas.getBoundingClientRect();
    const index = pick(event.clientX - rect.left, event.clientY - rect.top);
    events.select(index === null ? null : String(index));
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  const projected = new Vector3();
  function pick(x: number, y: number): number | null {
    if (!feed || !previous || !next) {
      return null;
    }
    const camera = stage.camera.position;
    let best: number | null = null;
    let bestDistance = 14;
    for (let i = 0; i < feed.count; i++) {
      if (!((params.groupMask >> feed.groups[i]) & 1)) {
        continue;
      }
      satelliteAt(i, mix, position);
      if (position.lengthSq() < 0.25 || hiddenByEarth(camera, position)) {
        continue;
      }
      projected.copy(position).project(stage.camera);
      if (projected.z > 1) {
        continue;
      }
      const sx = ((projected.x + 1) / 2) * stage.width;
      const sy = ((1 - projected.y) / 2) * stage.height;
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    }
    return best;
  }

  await stage.renderer.compileAsync(stage.scene, stage.camera);
  stage.renderNow();
  stage.setAnimating(true);

  return {
    update(nextParams) {
      const previousParams = params;
      params = nextParams;
      if (nextParams.feed !== previousParams.feed) {
        attach(nextParams.feed);
      }
      if (nextParams.path !== previousParams.path) {
        showPath(nextParams.path);
      }
      satelliteUniforms.uGroupMask.value = nextParams.groupMask;
      if (nextParams.reducedMotion) {
        controls.autoRotate = false;
      }
    },
    dispose() {
      unsubscribe?.();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stage.dispose();
    },
  };
}

/** Whether the unit sphere sits between the camera and a point. */
function hiddenByEarth(camera: Vector3, point: Vector3): boolean {
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;
  const a = dx * dx + dy * dy + dz * dz;
  const b = 2 * (camera.x * dx + camera.y * dy + camera.z * dz);
  const c = camera.lengthSq() - 1;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return false;
  }
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t > 0 && t < 1;
}

/** Lets hosts type-check the lazy import: `import('@ah/three/scenes/orbit-globe')`. */
export const orbitGlobeScene: SceneModule<OrbitGlobeParams> = { createScene };
