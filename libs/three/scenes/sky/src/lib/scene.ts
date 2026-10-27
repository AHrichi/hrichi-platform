import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  PerspectiveCamera,
  Points,
  Raycaster,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import { lightTheme } from '@ah/design-system/tokens';
import {
  createStage,
  disposeObject,
  type SceneController,
  type SceneInit,
  type SceneModule,
} from '@ah/three/engine';
import { horizonAltitude } from './horizon';
import { LabelLayer, type LabelKind } from './labels';
import { landMask } from './land';
import { OrbitControls } from './orbit-controls';
import {
  atmosphereFragment,
  earthFragment,
  earthVertex,
  highlightFragment,
  highlightVertex,
} from './shaders';
import { createSkyLayer, equatorial, RADIUS, toDirection } from './sky-layer';
import type { SkyFrame, SkySceneParams } from './types';

const DEG = Math.PI / 180;
const colour = (token: keyof typeof lightTheme) =>
  new Color(lightTheme[token] as string);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/** Earth-fixed position of a latitude and longitude (radians) on the unit sphere, three.js axes. */
function surface(lat: number, lon: number): Vector3 {
  return new Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon),
  );
}

const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * The Sky lab's scene (ADR-0016). It opens on a dot-matrix Earth with the
 * real day and night; "Look up" flies down to the observer's spot and fades
 * into the sky over it: stars, constellations, the Sun, Moon and planets,
 * the Milky Way and meteors. Drag to look around, scroll or pinch to zoom.
 */
export async function createScene({
  canvas,
  tier,
  params: initial,
  events,
}: SceneInit<SkySceneParams>): Promise<SceneController<SkySceneParams>> {
  let params = initial;
  const stage = createStage({ canvas, tier, fov: 38 });
  const host = canvas.parentElement as HTMLElement;

  // ---- The globe ----------------------------------------------------------
  const controls = new OrbitControls(stage.camera, canvas);
  controls.enableDamping = !params.reducedMotion;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 9;
  controls.rotateSpeed = 0.5;
  controls.addEventListener('change', () => stage.requestRender());
  stage.track(controls);

  const sunUniform = { value: new Vector3(1, 0, 0) };
  const earth = new Mesh(
    new SphereGeometry(
      1,
      tier === 'high' ? 128 : 72,
      tier === 'high' ? 96 : 48,
    ),
    new ShaderMaterial({
      uniforms: {
        uLand: { value: landMask(canvas.ownerDocument) },
        uSun: sunUniform,
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
  stage.scene.add(
    new Mesh(
      new SphereGeometry(1.035, 64, 48),
      new ShaderMaterial({
        uniforms: {
          uColour: { value: colour('color-data-4') },
          uSun: sunUniform,
        },
        vertexShader: earthVertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    ),
  );

  // The observer's spot: a ringed marker that turns with the Earth.
  const markerGeometry = new BufferGeometry();
  markerGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(3), 3),
  );
  const marker = new Points(
    markerGeometry,
    new ShaderMaterial({
      uniforms: {
        uColour: { value: colour('color-data-2') },
        uSize: { value: 22 },
        uRing: { value: 1 },
        uPixelRatio: { value: stage.renderer.getPixelRatio() },
      },
      vertexShader: highlightVertex,
      fragmentShader: highlightFragment,
      transparent: true,
      depthWrite: false,
    }),
  );
  marker.frustumCulled = false;
  earth.add(marker);

  function placeMarker(): void {
    const { lat, lon } = params.spot;
    (markerGeometry.getAttribute('position') as BufferAttribute).set(
      surface(lat * DEG, lon * DEG)
        .multiplyScalar(1.004)
        .toArray(),
    );
    markerGeometry.getAttribute('position').needsUpdate = true;
  }
  placeMarker();

  /** Puts the camera over the spot, looking at the Earth's centre. */
  function faceSpot(distance: number): void {
    earth.updateMatrixWorld();
    const spot = surface(params.spot.lat * DEG, params.spot.lon * DEG)
      .applyMatrix4(earth.matrixWorld)
      .normalize();
    // A little south of overhead, so the spot sits in the upper half.
    stage.camera.position
      .copy(spot)
      .add(new Vector3(0, -0.35, 0))
      .normalize()
      .multiplyScalar(distance);
    stage.camera.lookAt(0, 0, 0);
    controls.update();
  }

  // ---- The sky ------------------------------------------------------------
  const sky = createSkyLayer(stage.renderer.getPixelRatio());
  const skyCamera = new PerspectiveCamera(60, 1, 0.1, 100);
  const labels = new LabelLayer(host);
  stage.onDegrade(() => sky.setPixelRatio(stage.renderer.getPixelRatio()));
  stage.track({ dispose: () => disposeObject(sky.scene) });

  let yaw = params.facing;
  let targetYaw = params.facing;
  let pitch = 25;
  let fov = 62;

  let frame: SkyFrame = params.skyAt(params.clock());
  let frameWall = 0;

  // ---- The dive -----------------------------------------------------------
  let dive = params.view === 'sky' ? 1 : 0;
  let diveFrom: Vector3 | null = null;
  earth.rotation.y = params.earthAt(params.clock()).gmst;
  faceSpot(3.4);

  stage.setRender(() => {
    const renderer = stage.renderer;
    renderer.autoClear = false;
    renderer.clear();
    if (dive < 1) {
      renderer.render(stage.scene, stage.camera);
    }
    if (dive > 0) {
      renderer.render(sky.scene, skyCamera);
    }
  });

  const spotWorld = new Vector3();
  const lookAt = new Vector3();
  const projected = new Vector3();
  let lastTime = 0;

  stage.onFrame(({ time, delta }) => {
    const now = params.clock();
    const earthFrame = params.earthAt(now);
    earth.rotation.y = earthFrame.gmst;
    sunUniform.value.set(
      earthFrame.sun[0],
      earthFrame.sun[2],
      -earthFrame.sun[1],
    );

    // Move the dive towards the requested view.
    const target = params.view === 'sky' ? 1 : 0;
    const step = delta * (params.reducedMotion ? 2.5 : 1 / 1.6);
    const before = dive;
    dive = target > dive ? Math.min(dive + step, 1) : Math.max(dive - step, 0);
    if (before === 0 && dive > 0) {
      diveFrom = stage.camera.position.clone();
    }
    if (dive === 0 && before > 0) {
      diveFrom = null;
      faceSpot(3.4);
    }
    controls.enabled = dive === 0;
    canvas.style.touchAction = dive === 1 ? 'none' : '';

    earth.updateMatrixWorld();
    spotWorld
      .copy(surface(params.spot.lat * DEG, params.spot.lon * DEG))
      .applyMatrix4(earth.matrixWorld);
    if (dive === 0) {
      controls.update();
    } else if (!params.reducedMotion && dive < 1) {
      // Fly from where the camera was to just above the spot.
      const from =
        diveFrom ?? spotWorld.clone().normalize().multiplyScalar(3.4);
      const t = ease(clamp(dive / 0.7, 0, 1));
      stage.camera.position.lerpVectors(
        from,
        spotWorld.clone().multiplyScalar(1.06),
        t,
      );
      stage.camera.lookAt(spotWorld);
    }

    // The sky's state, recomputed when time moved (at most ~30 times a second).
    if (
      dive > 0 &&
      (Math.abs(now - frame.time) >= 1000 || time - frameWall > 0.5) &&
      time - frameWall > 0.033
    ) {
      frame = params.skyAt(now);
      frameWall = time;
    }

    // Turn towards the requested compass direction along the short way.
    const turn = ((targetYaw - yaw + 540) % 360) - 180;
    yaw =
      params.reducedMotion || Math.abs(turn) < 0.1
        ? targetYaw
        : yaw + turn * Math.min(1, delta * 4);

    const tilt = params.reducedMotion
      ? pitch
      : -6 + (pitch + 6) * ease(clamp((dive - 0.6) / 0.4, 0, 1));
    skyCamera.fov = fov;
    skyCamera.aspect = stage.width / Math.max(stage.height, 1);
    skyCamera.updateProjectionMatrix();
    skyCamera.position.set(0, 0, 0);
    lookAt.copy(toDirection(tilt * DEG, yaw * DEG));
    skyCamera.lookAt(lookAt);

    const animated = !params.reducedMotion;
    const flicker = animated
      ? 0.78 +
        0.12 * Math.sin(time * 9.1) +
        0.07 * Math.sin(time * 23.7 + 1.3) +
        0.03 * Math.sin(time * 41.3)
      : 1;
    const selectedFigure =
      params.selected?.startsWith('constellation:') === true
        ? sky.figureIds.indexOf(params.selected.slice('constellation:'.length))
        : -1;
    sky.update(
      {
        frame,
        fade: clamp((dive - 0.45) / 0.4, 0, 1),
        time,
        zoom: 60 / fov,
        twinkle: animated && tier === 'high',
        meteors: animated,
        flicker,
        milkyWay: params.layers.milkyWay,
        constellations: params.layers.constellations,
        selectedFigure,
      },
      time - lastTime > 0 ? Math.min(time - lastTime, 0.1) : 0,
    );
    lastTime = time;

    updateLabels();
    stage.setAnimating(
      animated || params.playing || (dive > 0 && dive < 1) || dive !== target,
    );
  });

  // ---- Labels ---------------------------------------------------------------
  const placed = new Set<string>();
  function screen(direction: Vector3): { x: number; y: number } | null {
    projected.copy(direction).multiplyScalar(RADIUS).project(skyCamera);
    if (
      projected.z > 1 ||
      Math.abs(projected.x) > 1.05 ||
      Math.abs(projected.y) > 1.05
    ) {
      return null;
    }
    return {
      x: ((projected.x + 1) / 2) * stage.width,
      y: ((1 - projected.y) / 2) * stage.height,
    };
  }
  function aboveSkyline(direction: Vector3, margin = 0.5): boolean {
    const azimuth = Math.atan2(direction.x, -direction.z);
    return (
      Math.asin(clamp(direction.y, -1, 1)) >
      horizonAltitude(azimuth) + margin * DEG
    );
  }
  function label(
    id: string,
    text: string,
    kind: LabelKind,
    direction: Vector3,
    margin = 0.5,
  ): void {
    if (kind !== 'cardinal' && !aboveSkyline(direction, margin)) {
      return;
    }
    const point = screen(direction);
    if (point) {
      labels.place(id, text, kind, point.x, point.y, params.selected === id);
      placed.add(id);
    }
  }

  function updateLabels(): void {
    const visible = dive > 0.9;
    labels.setVisible(visible);
    if (!visible) {
      return;
    }
    placed.clear();
    cardinals.forEach((name, i) => {
      const azimuth = i * 45 * DEG;
      label(
        `cardinal:${name}`,
        name,
        'cardinal',
        toDirection(horizonAltitude(azimuth) + 2.5 * DEG, azimuth),
      );
    });
    if (params.layers.labels) {
      const night = frame.sun.altitude < -6;
      for (const item of params.labels) {
        const isConstellation = item.id.startsWith('constellation:');
        if (
          isConstellation ? !params.layers.constellations || !night : !night
        ) {
          continue;
        }
        const direction = equatorial(item.ra, item.dec).applyMatrix3(
          sky.equatorialToLocal,
        );
        label(
          item.id,
          item.text,
          isConstellation ? 'constellation' : 'star',
          direction,
        );
      }
      for (const planet of frame.planets) {
        label(
          `planet:${planet.name}`,
          planet.name,
          'body',
          new Vector3(...planet.direction),
        );
      }
      label('moon', 'Moon', 'body', new Vector3(...frame.moon.direction), -1);
      label('sun', 'Sun', 'body', new Vector3(...frame.sun.direction), -1);
      if (frame.sun.altitude < -12) {
        for (const shower of frame.showers) {
          label(
            `shower:${shower.name}`,
            `${shower.name} radiant`,
            'shower',
            new Vector3(...shower.radiant),
          );
        }
      }
    }
    labels.sweep(placed);
  }

  // ---- Input -------------------------------------------------------------------
  const pointers = new Map<number, { x: number; y: number }>();
  let downAt: { x: number; y: number } | null = null;
  let pinch = 0;

  const onDown = (event: PointerEvent) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    downAt =
      pointers.size === 1 ? { x: event.clientX, y: event.clientY } : null;
    if (dive === 1) {
      canvas.setPointerCapture(event.pointerId);
    }
  };
  const onMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous || dive !== 1) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0) {
        fov = clamp(fov * (pinch / distance), 20, 100);
      }
      pinch = distance;
    } else {
      const perPixel = fov / Math.max(stage.height, 1);
      targetYaw = yaw =
        (yaw - (event.clientX - previous.x) * perPixel + 360) % 360;
      pitch = clamp(pitch + (event.clientY - previous.y) * perPixel, -10, 89);
    }
    stage.requestRender();
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinch = 0;
    }
    const start = downAt;
    downAt = null;
    if (
      !start ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5
    ) {
      return; // a drag, not a click
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (dive === 0) {
      pickSpot(x, y);
    } else if (dive === 1) {
      events.select(pickSky(x, y));
    }
  };
  const onWheel = (event: WheelEvent) => {
    if (dive !== 1) {
      return;
    }
    event.preventDefault();
    fov = clamp(fov * Math.exp(event.deltaY * 0.001), 20, 100);
    stage.requestRender();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  const raycaster = new Raycaster();
  function pickSpot(x: number, y: number): void {
    raycaster.setFromCamera(
      new Vector2((x / stage.width) * 2 - 1, -(y / stage.height) * 2 + 1),
      stage.camera,
    );
    const hit = raycaster.intersectObject(earth, false)[0];
    if (!hit) {
      return;
    }
    const local = earth.worldToLocal(hit.point.clone()).normalize();
    const lat = Math.asin(local.y) / DEG;
    const lon = Math.atan2(-local.z, local.x) / DEG;
    events.select(`spot:${lat.toFixed(3)},${lon.toFixed(3)}`);
  }

  function pickSky(x: number, y: number): string | null {
    const near = (direction: Vector3, radius: number) => {
      if (!aboveSkyline(direction, -1)) {
        return Infinity;
      }
      const point = screen(direction);
      const distance = point ? Math.hypot(point.x - x, point.y - y) : Infinity;
      return distance <= radius ? distance : Infinity;
    };
    const bodies: [string, Vector3][] = [
      ['moon', new Vector3(...frame.moon.direction)],
      ['sun', new Vector3(...frame.sun.direction)],
      ...frame.planets.map(
        (planet) =>
          [`planet:${planet.name}`, new Vector3(...planet.direction)] as [
            string,
            Vector3,
          ],
      ),
    ];
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const [id, direction] of bodies) {
      const distance = near(direction, 24);
      if (distance < bestDistance) {
        best = id;
        bestDistance = distance;
      }
    }
    if (best) {
      return best;
    }
    const { directions, magnitudes } = sky.stars;
    const direction = new Vector3();
    for (let i = 0; i < magnitudes.length && magnitudes[i] <= 5; i++) {
      direction
        .fromArray(directions, i * 3)
        .applyMatrix3(sky.equatorialToLocal);
      const distance = near(direction, 12);
      if (distance < bestDistance) {
        best = `star:${i}`;
        bestDistance = distance;
      }
    }
    if (best || !params.layers.constellations) {
      return best;
    }
    for (const item of params.labels) {
      if (!item.id.startsWith('constellation:')) {
        continue;
      }
      const distance = near(
        equatorial(item.ra, item.dec).applyMatrix3(sky.equatorialToLocal),
        48,
      );
      if (distance < bestDistance) {
        best = item.id;
        bestDistance = distance;
      }
    }
    return best;
  }

  await stage.renderer.compileAsync(stage.scene, stage.camera);
  await stage.renderer.compileAsync(sky.scene, skyCamera);
  stage.renderNow();
  stage.setAnimating(true);

  return {
    update(next) {
      const previous = params;
      params = next;
      if (
        next.spot.lat !== previous.spot.lat ||
        next.spot.lon !== previous.spot.lon
      ) {
        placeMarker();
        if (dive === 0) {
          faceSpot(stage.camera.position.length());
        }
      }
      if (next.skyAt !== previous.skyAt || next.clock !== previous.clock) {
        frame = next.skyAt(next.clock());
      }
      if (next.facing !== previous.facing) {
        targetYaw = next.facing;
      }
      controls.enableDamping = !next.reducedMotion;
      stage.setAnimating(true);
      stage.requestRender();
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      labels.dispose();
      stage.dispose();
    },
  };
}

/** Lets hosts type-check the lazy import: `import('@ah/three/scenes/sky')`. */
export const skyScene: SceneModule<SkySceneParams> = { createScene };
