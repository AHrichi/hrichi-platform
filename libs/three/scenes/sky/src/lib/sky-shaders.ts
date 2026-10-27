/**
 * GLSL for the sky (ADR-0016). Everything sits around a camera at the origin
 * in the observer's frame: x east, y up, z south.
 */

const noise = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x),
          mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x),
          mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  // Each octave is rotated, so value noise's lattice never lines up into stripes.
  const mat3 octave = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = octave * p * 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

/** A direction per vertex of a sphere around the camera. */
export const domeVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The sky's colour: night, twilight glowing towards the Sun, and day; the
 * Sun's and Moon's glow; and a procedural Milky Way along the galactic plane,
 * brightest towards the centre in Sagittarius, with a dark rift.
 */
export const domeFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uMoon;
  uniform float uMoonLight;
  uniform mat3 uLocalToGalactic;
  uniform float uMilkyWay;
  uniform float uFade;
  varying vec3 vDir;
  ${noise}

  void main() {
    vec3 dir = normalize(vDir);
    float sunAlt = asin(clamp(uSun.y, -1.0, 1.0));
    float h = max(dir.y, 0.0);

    vec3 night = mix(vec3(0.020, 0.027, 0.055), vec3(0.006, 0.008, 0.022), pow(h, 0.4));
    vec3 day = mix(vec3(0.55, 0.72, 0.92), vec3(0.15, 0.35, 0.72), pow(h, 0.5));
    vec3 flatDir = normalize(vec3(dir.x, 0.0, dir.z) + 1e-5);
    vec3 flatSun = normalize(vec3(uSun.x, 0.0, uSun.z) + 1e-5);
    float towardSun = max(dot(flatDir, flatSun), 0.0);
    vec3 twilight = mix(
      vec3(0.09, 0.11, 0.28),
      vec3(0.98, 0.48, 0.20),
      pow(towardSun, 3.0) * pow(1.0 - h, 3.0)
    );

    float dayness = smoothstep(-0.10, 0.10, sunAlt);
    float twilightness = smoothstep(-0.32, -0.06, sunAlt) * (1.0 - dayness);
    vec3 colour = mix(night, twilight, twilightness * (0.3 + 0.7 * pow(1.0 - h, 2.0)));
    colour = mix(colour, day, dayness);

    float sunDot = max(dot(dir, uSun), 0.0);
    colour += vec3(1.0, 0.85, 0.6)
      * (pow(sunDot, 900.0) * 6.0 + pow(sunDot, 14.0) * 0.3)
      * smoothstep(-0.06, 0.02, sunAlt);

    float moonDot = max(dot(dir, uMoon), 0.0);
    colour += vec3(0.62, 0.68, 0.80) * pow(moonDot, 60.0) * 0.35 * uMoonLight;
    colour += vec3(0.03, 0.05, 0.10) * uMoonLight * (1.0 - dayness);

    if (uMilkyWay > 0.0) {
      vec3 g = uLocalToGalactic * dir;
      float b = asin(clamp(g.z, -1.0, 1.0));
      float l = atan(g.y, g.x);
      // Star clouds and a wandering dark rift, so the band isn't a smooth stripe.
      float n1 = fbm(g * 7.0);
      float n2 = fbm(g * 17.0 + 5.0);
      float width = 0.10 * (0.7 + 0.6 * n1);
      float band = exp(-pow(b / width, 2.0));
      float core = exp(-pow(l / 0.45, 2.0)) * exp(-pow(b / 0.15, 2.0));
      float clumps = smoothstep(0.32, 0.78, n2);
      float lane = (b - 0.01 + 0.04 * (n1 - 0.5)) / 0.02;
      float rift = 1.0 - 0.7 * exp(-lane * lane) * smoothstep(1.4, 0.0, abs(l - 0.3));
      float light = (band * (0.15 + 1.0 * clumps) + core * (0.5 + 0.7 * clumps)) * rift;
      float dark = (1.0 - smoothstep(-0.30, -0.20, sunAlt)) * (1.0 - 0.75 * uMoonLight);
      colour += vec3(0.060, 0.064, 0.082) * light * dark * uMilkyWay;
    }

    gl_FragColor = vec4(colour, uFade);
  }
`;

/**
 * Stars: J2000 unit vectors turned into the observer's frame by one matrix.
 * Size and opacity follow brightness, and stars fainter than the sky allows
 * (twilight, moonlight) fade out. They twinkle a little, more near the horizon.
 */
export const starVertex = /* glsl */ `
  attribute float aMag;
  attribute vec3 aColour;
  uniform mat3 uEquatorialToLocal;
  uniform float uLimit;
  uniform float uPixelRatio;
  uniform float uZoom;
  uniform float uTime;
  uniform float uTwinkle;
  uniform float uFade;
  varying vec3 vColour;
  varying float vAlpha;

  void main() {
    vec3 dir = uEquatorialToLocal * normalize(position);
    float flux = pow(10.0, -0.4 * (aMag - 1.0));
    float visible = smoothstep(uLimit + 0.4, uLimit - 0.6, aMag);
    float above = smoothstep(-0.02, 0.01, dir.y);
    float phase = uTime * (6.0 + mod(aMag * 31.0, 5.0)) + position.x * 53.0;
    float twinkle = 1.0 - uTwinkle * 0.3 * (0.5 + 0.5 * sin(phase)) * (1.0 - 0.7 * dir.y);
    vAlpha = visible * above * twinkle * uFade * clamp(0.5 + 0.5 * pow(flux, 0.25), 0.0, 1.0);
    vColour = aColour;
    gl_PointSize = clamp(2.0 + 3.0 * pow(flux, 0.35), 2.0, 11.0) * sqrt(uZoom) * uPixelRatio;
    gl_Position = projectionMatrix * viewMatrix * vec4(dir * 40.0, 1.0);
  }
`;

export const starFragment = /* glsl */ `
  varying vec3 vColour;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.45, d);
    float halo = 1.0 - smoothstep(0.25, 1.0, d);
    float alpha = (core + halo * 0.45) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColour * (1.0 + core * 0.6), alpha);
  }
`;

/** Constellation figures: line segments between J2000 directions. */
export const figureVertex = /* glsl */ `
  attribute float aFigure;
  uniform mat3 uEquatorialToLocal;
  uniform float uSelected;
  varying float vHighlight;
  varying float vAbove;

  void main() {
    vec3 dir = uEquatorialToLocal * normalize(position);
    vHighlight = abs(aFigure - uSelected) < 0.5 ? 1.0 : 0.0;
    vAbove = dir.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(dir * 39.0, 1.0);
  }
`;

export const figureFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uOpacity;
  varying float vHighlight;
  varying float vAbove;

  void main() {
    if (vAbove < -0.01) discard;
    float alpha = uOpacity * mix(1.0, 2.6, vHighlight);
    gl_FragColor = vec4(mix(uColour, vec3(1.0, 0.86, 0.55), vHighlight), alpha);
  }
`;

/** Soft round points for the Sun, the planets and the campfire. */
export const glowVertex = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColour;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying vec3 vColour;
  varying float vAlpha;

  void main() {
    vColour = aColour;
    vAlpha = aAlpha;
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment = /* glsl */ `
  varying vec3 vColour;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.35, d);
    float halo = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);
    float alpha = (core + halo * 0.6) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColour * (0.9 + core * 0.4), alpha);
  }
`;

/**
 * The Moon: a real sphere lit by the real Sun, so its phase and the tilt of
 * the terminator come out right by themselves. Earthshine keeps the dark
 * side faintly visible.
 */
export const moonVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vLocal;

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const moonFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uFade;
  varying vec3 vNormal;
  varying vec3 vLocal;
  ${noise}

  void main() {
    float lit = smoothstep(-0.04, 0.10, dot(normalize(vNormal), uSun));
    float maria = smoothstep(0.52, 0.70, fbm(normalize(vLocal) * 2.6 + 3.0));
    vec3 surface = mix(vec3(0.93, 0.92, 0.88), vec3(0.62, 0.62, 0.62), maria);
    vec3 colour = surface * mix(0.05, 1.0, lit);
    gl_FragColor = vec4(colour, uFade);
  }
`;

/**
 * The ground: from the skyline down to the nadir, dark, lit faintly by the
 * sky and warmly by the campfire.
 */
export const groundVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const groundFragment = /* glsl */ `
  uniform float uSkyLight;
  uniform vec3 uFire;
  uniform float uFlicker;
  uniform float uFade;
  varying vec3 vDir;

  void main() {
    vec3 ground = mix(vec3(0.006, 0.008, 0.012), vec3(0.10, 0.12, 0.09), uSkyLight);
    float fire = pow(max(dot(normalize(vDir), uFire), 0.0), 90.0);
    ground += vec3(0.42, 0.16, 0.04) * fire * uFlicker * (1.0 - uSkyLight);
    gl_FragColor = vec4(ground, uFade);
  }
`;

/** Meteors: short streaks, bright at the head, fading along the tail. */
export const meteorVertex = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const meteorFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.01) discard;
    gl_FragColor = vec4(vec3(0.95, 0.97, 1.0), vAlpha);
  }
`;
