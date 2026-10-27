import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  LineSegments,
  Matrix3,
  Mesh,
  type Object3D,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import linesData from '../generated/lines.json';
import starsData from '../generated/stars.json';
import { campfire, horizonAltitude } from './horizon';
import {
  domeFragment,
  domeVertex,
  figureFragment,
  figureVertex,
  glowFragment,
  glowVertex,
  groundFragment,
  groundVertex,
  meteorFragment,
  meteorVertex,
  moonFragment,
  moonVertex,
  starFragment,
  starVertex,
} from './sky-shaders';
import { starColour } from './star-colour';
import type { SkyFrame, Vec3 } from './types';

/** Radius of the sphere everything is drawn on, scene units. */
export const RADIUS = 40;
const DEG = Math.PI / 180;

/** J2000 equatorial → galactic (Hipparcos), row-major. */
// prettier-ignore
const GALACTIC = new Matrix3().set(
  -0.0548755604, -0.8734370902, -0.4838350155,
  0.4941094279, -0.44482963, 0.7469822445,
  -0.867666149, -0.1980763734, 0.4559837762,
);

/** The direction of an altitude and azimuth, radians, azimuth east of north. */
export function toDirection(altitude: number, azimuth: number): Vector3 {
  return new Vector3(
    Math.cos(altitude) * Math.sin(azimuth),
    Math.sin(altitude),
    -Math.cos(altitude) * Math.cos(azimuth),
  );
}

/** J2000 right ascension and declination (degrees) as a unit vector. */
export function equatorial(ra: number, dec: number): Vector3 {
  return new Vector3(
    Math.cos(dec * DEG) * Math.cos(ra * DEG),
    Math.cos(dec * DEG) * Math.sin(ra * DEG),
    Math.sin(dec * DEG),
  );
}

/**
 * The faintest magnitude visible: about 6.2 under a dark sky, washed out
 * through twilight and by a bright Moon.
 */
export function limitingMagnitude(
  sunAltitude: number,
  moonAltitude: number,
  moonIllumination: number,
): number {
  const stops: [number, number][] = [
    [-18, 6.2],
    [-12, 4.5],
    [-6, 2],
    [0, -1],
    [10, -3],
  ];
  let limit = stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [a0, m0] = stops[i - 1];
    const [a1, m1] = stops[i];
    if (sunAltitude > a0) {
      limit = m0 + ((Math.min(sunAltitude, a1) - a0) / (a1 - a0)) * (m1 - m0);
    }
  }
  if (moonAltitude > 0) {
    limit -= 1.8 * moonIllumination * Math.sqrt(Math.sin(moonAltitude * DEG));
  }
  return limit;
}

const planetColours: Record<string, Color> = {
  Mercury: new Color('#d6c3a5'),
  Venus: new Color('#fff3d6'),
  Mars: new Color('#ff8f66'),
  Jupiter: new Color('#f2dfba'),
  Saturn: new Color('#ead6a0'),
};

export interface SkyLayerState {
  frame: SkyFrame;
  /** 0 hidden, 1 fully shown (the crossfade from the globe). */
  fade: number;
  /** Seconds, for twinkling and flicker. */
  time: number;
  /** 60° divided by the field of view. */
  zoom: number;
  twinkle: boolean;
  meteors: boolean;
  flicker: number;
  milkyWay: boolean;
  constellations: boolean;
  /** Index into `figureIds`, or −1. */
  selectedFigure: number;
}

export interface SkyLayer {
  scene: Scene;
  /** Constellation ids in figure order. */
  figureIds: string[];
  /** J2000 unit vectors and magnitudes, brightest first, for picking. */
  stars: { directions: Float32Array; magnitudes: Float32Array };
  /** The latest equatorial → local rotation. */
  equatorialToLocal: Matrix3;
  update(state: SkyLayerState, delta: number): void;
  setPixelRatio(ratio: number): void;
}

interface Meteor {
  from: Vector3;
  to: Vector3;
  age: number;
  life: number;
}

export function createSkyLayer(pixelRatio: number): SkyLayer {
  const scene = new Scene();
  const equatorialToLocal = new Matrix3();
  const ordered = (object: Object3D, order: number) => {
    object.renderOrder = order;
    object.frustumCulled = false;
    scene.add(object);
  };
  const flat = { depthTest: false, depthWrite: false, transparent: true };

  // The sky itself.
  const domeUniforms = {
    uSun: { value: new Vector3(0, -1, 0) },
    uMoon: { value: new Vector3(0, -1, 0) },
    uMoonLight: { value: 0 },
    uLocalToGalactic: { value: new Matrix3() },
    uMilkyWay: { value: 1 },
    uFade: { value: 0 },
  };
  ordered(
    new Mesh(
      new SphereGeometry(RADIUS * 1.1, 64, 32),
      new ShaderMaterial({
        ...flat,
        uniforms: domeUniforms,
        vertexShader: domeVertex,
        fragmentShader: domeFragment,
        side: DoubleSide,
      }),
    ),
    0,
  );

  // Stars, brightest first.
  const count = starsData.count;
  const directions = new Float32Array(count * 3);
  const magnitudes = new Float32Array(count);
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [ra, dec, mag, bv] = starsData.stars.slice(i * 4, i * 4 + 4);
    equatorial(ra, dec).toArray(directions, i * 3);
    magnitudes[i] = mag;
    colours.set(starColour(bv), i * 3);
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new BufferAttribute(directions, 3));
  starGeometry.setAttribute('aMag', new BufferAttribute(magnitudes, 1));
  starGeometry.setAttribute('aColour', new BufferAttribute(colours, 3));
  const starUniforms = {
    uEquatorialToLocal: { value: equatorialToLocal },
    uLimit: { value: 6 },
    uPixelRatio: { value: pixelRatio },
    uZoom: { value: 1 },
    uTime: { value: 0 },
    uTwinkle: { value: 0 },
    uFade: { value: 0 },
  };
  ordered(
    new Points(
      starGeometry,
      new ShaderMaterial({
        ...flat,
        uniforms: starUniforms,
        vertexShader: starVertex,
        fragmentShader: starFragment,
        blending: AdditiveBlending,
      }),
    ),
    1,
  );

  // Constellation figures.
  const figureIds = linesData.figures.map((figure) => figure.id);
  const segments: number[] = [];
  const segmentFigure: number[] = [];
  linesData.figures.forEach((figure, index) => {
    for (const line of figure.lines) {
      for (let i = 0; i + 3 < line.length; i += 2) {
        segments.push(
          ...equatorial(line[i], line[i + 1]).toArray(),
          ...equatorial(line[i + 2], line[i + 3]).toArray(),
        );
        segmentFigure.push(index, index);
      }
    }
  });
  const figureGeometry = new BufferGeometry();
  figureGeometry.setAttribute(
    'position',
    new BufferAttribute(Float32Array.from(segments), 3),
  );
  figureGeometry.setAttribute(
    'aFigure',
    new BufferAttribute(Float32Array.from(segmentFigure), 1),
  );
  const figureUniforms = {
    uEquatorialToLocal: { value: equatorialToLocal },
    uSelected: { value: -1 },
    uColour: { value: new Color('#9fb7e8') },
    uOpacity: { value: 0 },
  };
  const figures = new LineSegments(
    figureGeometry,
    new ShaderMaterial({
      ...flat,
      uniforms: figureUniforms,
      vertexShader: figureVertex,
      fragmentShader: figureFragment,
      blending: AdditiveBlending,
    }),
  );
  ordered(figures, 2);

  // The Sun and the planets as glowing points.
  const glowCount = 6;
  const glowGeometry = new BufferGeometry();
  glowGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(glowCount * 3), 3),
  );
  glowGeometry.setAttribute(
    'aSize',
    new BufferAttribute(new Float32Array(glowCount), 1),
  );
  glowGeometry.setAttribute(
    'aColour',
    new BufferAttribute(new Float32Array(glowCount * 3), 3),
  );
  glowGeometry.setAttribute(
    'aAlpha',
    new BufferAttribute(new Float32Array(glowCount), 1),
  );
  const glowUniforms = { uPixelRatio: { value: pixelRatio } };
  const glowMaterial = () =>
    new ShaderMaterial({
      ...flat,
      uniforms: glowUniforms,
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      blending: AdditiveBlending,
    });
  ordered(new Points(glowGeometry, glowMaterial()), 3);

  // The Moon: a sphere about three times its real size, so the phase reads.
  const moonUniforms = {
    uSun: { value: new Vector3(1, 0, 0) },
    uFade: { value: 0 },
  };
  const moon = new Mesh(
    new SphereGeometry(1, 48, 32),
    new ShaderMaterial({
      ...flat,
      uniforms: moonUniforms,
      vertexShader: moonVertex,
      fragmentShader: moonFragment,
    }),
  );
  const moonDistance = RADIUS * 0.95;
  moon.scale.setScalar(moonDistance * Math.tan(0.26 * 3.2 * DEG));
  ordered(moon, 4);

  // Meteors.
  const meteorPool = 24;
  const meteorGeometry = new BufferGeometry();
  meteorGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(meteorPool * 6), 3),
  );
  meteorGeometry.setAttribute(
    'aAlpha',
    new BufferAttribute(new Float32Array(meteorPool * 2), 1),
  );
  ordered(
    new LineSegments(
      meteorGeometry,
      new ShaderMaterial({
        ...flat,
        vertexShader: meteorVertex,
        fragmentShader: meteorFragment,
        blending: AdditiveBlending,
      }),
    ),
    5,
  );
  const meteors: (Meteor | null)[] = Array.from(
    { length: meteorPool },
    () => null,
  );

  // The ground, from the skyline down to the nadir.
  const segmentsAround = 720;
  const ground: number[] = [];
  const nadir = [0, -RADIUS * 0.9, 0];
  for (let i = 0; i < segmentsAround; i++) {
    const a0 = (i / segmentsAround) * Math.PI * 2;
    const a1 = ((i + 1) / segmentsAround) * Math.PI * 2;
    ground.push(
      ...toDirection(horizonAltitude(a0), a0)
        .multiplyScalar(RADIUS * 0.9)
        .toArray(),
      ...toDirection(horizonAltitude(a1), a1)
        .multiplyScalar(RADIUS * 0.9)
        .toArray(),
      ...nadir,
    );
  }
  const groundGeometry = new BufferGeometry();
  groundGeometry.setAttribute(
    'position',
    new BufferAttribute(Float32Array.from(ground), 3),
  );
  const fireDirection = toDirection(campfire.altitude, campfire.azimuth);
  const groundUniforms = {
    uSkyLight: { value: 0 },
    uFire: { value: fireDirection },
    uFlicker: { value: 1 },
    uFade: { value: 0 },
  };
  ordered(
    new Mesh(
      groundGeometry,
      new ShaderMaterial({
        ...flat,
        uniforms: groundUniforms,
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        side: DoubleSide,
      }),
    ),
    6,
  );

  // The campfire, in front of the ground.
  const fireGeometry = new BufferGeometry();
  fireGeometry.setAttribute(
    'position',
    new BufferAttribute(
      Float32Array.from(
        fireDirection
          .clone()
          .multiplyScalar(RADIUS * 0.85)
          .toArray(),
      ),
      3,
    ),
  );
  fireGeometry.setAttribute(
    'aSize',
    new BufferAttribute(new Float32Array([28]), 1),
  );
  fireGeometry.setAttribute(
    'aColour',
    new BufferAttribute(Float32Array.from([1, 0.55, 0.2]), 3),
  );
  fireGeometry.setAttribute(
    'aAlpha',
    new BufferAttribute(new Float32Array([0]), 1),
  );
  ordered(new Points(fireGeometry, glowMaterial()), 7);

  const transposed = new Matrix3();
  const sun = new Vector3();
  const v = new Vector3();
  const axis = new Vector3();

  function spawnMeteor(radiant: Vector3): void {
    const free = meteors.indexOf(null);
    if (free < 0) {
      return;
    }
    // Any direction away from the radiant: rotate about a random axis.
    axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    axis.cross(radiant).normalize();
    const start = (15 + Math.random() * 50) * DEG;
    const length = (5 + Math.random() * 12) * DEG;
    const from = radiant.clone().applyAxisAngle(axis, start);
    if (from.y < Math.sin(6 * DEG)) {
      return;
    }
    meteors[free] = {
      from,
      to: radiant.clone().applyAxisAngle(axis, start + length),
      age: 0,
      life: 0.45 + Math.random() * 0.5,
    };
  }

  function updateMeteors(
    frame: SkyFrame,
    delta: number,
    dark: number,
    fade: number,
    enabled: boolean,
  ): void {
    if (enabled && dark > 0.5) {
      for (const shower of frame.showers) {
        const radiant = new Vector3(...shower.radiant);
        if (radiant.y <= 0) {
          continue;
        }
        // Real rates (ZHR) sped up twelvefold, so a few show up in a minute.
        const perSecond = ((shower.rate * radiant.y) / 3600) * 12;
        if (Math.random() < perSecond * delta) {
          spawnMeteor(radiant);
        }
      }
    }
    const positions = meteorGeometry.getAttribute(
      'position',
    ) as BufferAttribute;
    const alphas = meteorGeometry.getAttribute('aAlpha') as BufferAttribute;
    meteors.forEach((meteor, i) => {
      if (!meteor) {
        alphas.setX(i * 2, 0);
        alphas.setX(i * 2 + 1, 0);
        return;
      }
      meteor.age += delta;
      const t = meteor.age / meteor.life;
      if (t >= 1) {
        meteors[i] = null;
        return;
      }
      const head = v.copy(meteor.from).lerp(meteor.to, t).normalize();
      positions.setXYZ(
        i * 2,
        ...(head
          .clone()
          .multiplyScalar(RADIUS * 0.97)
          .toArray() as Vec3),
      );
      const tail = v
        .copy(meteor.from)
        .lerp(meteor.to, Math.max(0, t - 0.35))
        .normalize();
      positions.setXYZ(
        i * 2 + 1,
        ...(tail.multiplyScalar(RADIUS * 0.97).toArray() as Vec3),
      );
      const brightness = Math.sin(Math.PI * t) * fade;
      alphas.setX(i * 2, brightness);
      alphas.setX(i * 2 + 1, 0);
    });
    positions.needsUpdate = true;
    alphas.needsUpdate = true;
  }

  return {
    scene,
    figureIds,
    stars: { directions, magnitudes },
    equatorialToLocal,
    setPixelRatio(ratio) {
      starUniforms.uPixelRatio.value = ratio;
      glowUniforms.uPixelRatio.value = ratio;
    },
    update(state, delta) {
      const { frame, fade } = state;
      const m = frame.equatorialToLocal;
      // prettier-ignore
      equatorialToLocal.set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);
      transposed.copy(equatorialToLocal).transpose();
      domeUniforms.uLocalToGalactic.value.multiplyMatrices(
        GALACTIC,
        transposed,
      );

      sun.set(...frame.sun.direction);
      const moonDirection = new Vector3(...frame.moon.direction);
      const moonUp = frame.moon.altitude > 0 ? 1 : 0;
      domeUniforms.uSun.value.copy(sun);
      domeUniforms.uMoon.value.copy(moonDirection);
      domeUniforms.uMoonLight.value = frame.moon.illumination * moonUp;
      domeUniforms.uMilkyWay.value = state.milkyWay ? 1 : 0;
      domeUniforms.uFade.value = fade;

      const limit = limitingMagnitude(
        frame.sun.altitude,
        frame.moon.altitude,
        frame.moon.illumination,
      );
      starUniforms.uLimit.value = limit;
      starUniforms.uZoom.value = state.zoom;
      starUniforms.uTime.value = state.time;
      starUniforms.uTwinkle.value = state.twinkle ? 1 : 0;
      starUniforms.uFade.value = fade;

      figures.visible = state.constellations;
      figureUniforms.uSelected.value = state.selectedFigure;
      // Figures show at night, not by day.
      figureUniforms.uOpacity.value =
        0.32 *
        fade *
        (1 - Math.min(Math.max((frame.sun.altitude + 6) / 6, 0), 1));

      const glowPositions = glowGeometry.getAttribute(
        'position',
      ) as BufferAttribute;
      const glowSizes = glowGeometry.getAttribute('aSize') as BufferAttribute;
      const glowColours = glowGeometry.getAttribute(
        'aColour',
      ) as BufferAttribute;
      const glowAlphas = glowGeometry.getAttribute('aAlpha') as BufferAttribute;
      glowPositions.setXYZ(
        0,
        ...(sun
          .clone()
          .multiplyScalar(RADIUS * 0.96)
          .toArray() as Vec3),
      );
      glowSizes.setX(0, 54);
      glowColours.setXYZ(0, 1, 0.92, 0.75);
      glowAlphas.setX(0, frame.sun.altitude > -1 ? fade : 0);
      frame.planets.slice(0, glowCount - 1).forEach((planet, i) => {
        const index = i + 1;
        const flux = 10 ** (-0.4 * (planet.magnitude - 1));
        glowPositions.setXYZ(
          index,
          ...(new Vector3(...planet.direction)
            .multiplyScalar(RADIUS * 0.96)
            .toArray() as Vec3),
        );
        glowSizes.setX(
          index,
          Math.min(4 + 3.2 * flux ** 0.3, 13) * Math.sqrt(state.zoom),
        );
        const colour = planetColours[planet.name] ?? new Color('#ffffff');
        glowColours.setXYZ(index, colour.r, colour.g, colour.b);
        const visible = Math.min(
          Math.max((limit + 0.5 - planet.magnitude) / 1.5, 0),
          1,
        );
        glowAlphas.setX(index, visible * fade);
      });
      for (const attribute of [
        glowPositions,
        glowSizes,
        glowColours,
        glowAlphas,
      ]) {
        attribute.needsUpdate = true;
      }

      moon.position.copy(moonDirection).multiplyScalar(moonDistance);
      moonUniforms.uSun.value.copy(sun);
      moonUniforms.uFade.value = fade;

      const skyLight = Math.min(Math.max((frame.sun.altitude + 8) / 14, 0), 1);
      groundUniforms.uSkyLight.value = skyLight;
      groundUniforms.uFlicker.value = state.flicker;
      groundUniforms.uFade.value = fade;
      const fireAlpha = fireGeometry.getAttribute('aAlpha') as BufferAttribute;
      fireAlpha.setX(
        0,
        (0.55 + 0.45 * state.flicker) * fade * (1 - skyLight * 0.8),
      );
      fireAlpha.needsUpdate = true;

      updateMeteors(frame, delta, 1 - skyLight, fade, state.meteors);
    },
  };
}
