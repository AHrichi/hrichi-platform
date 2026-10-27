/** GLSL for the Orbit lab's globe (ADR-0014). */

/** The Earth: land drawn as dots, lit by the real Sun with a soft terminator. */
export const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const earthFragment = /* glsl */ `
  uniform sampler2D uLand;
  uniform vec3 uSun;
  uniform vec3 uOcean;
  uniform vec3 uLandDay;
  uniform vec3 uLandNight;
  uniform float uRows;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  const float PI = 3.14159265;

  void main() {
    // A grid of dots in latitude rows; fewer per row towards the poles so
    // they stay round.
    float row = floor(vUv.y * uRows);
    float rowLatitude = ((row + 0.5) / uRows - 0.5) * PI;
    float columns = max(1.0, floor(uRows * 2.0 * cos(rowLatitude)));
    vec2 cell = vec2(vUv.x * columns, vUv.y * uRows);
    vec2 centre = (floor(cell) + 0.5) / vec2(columns, uRows);
    float onLand = step(0.5, texture2D(uLand, centre).r);
    float dist = length(fract(cell) - 0.5);
    float dotShape = (1.0 - smoothstep(0.26, 0.34, dist)) * onLand;

    // Day side lit, night side dim, with a twilight band between.
    float daylight = smoothstep(-0.12, 0.18, dot(normalize(vNormal), uSun));
    vec3 ocean = uOcean * mix(0.55, 1.0, daylight);
    vec3 landColour = mix(uLandNight, uLandDay, daylight);
    vec3 colour = mix(ocean, landColour, dotShape);

    // A thin bright rim where the surface turns away from the camera.
    float rim = pow(1.0 - max(dot(normalize(vNormal), vView), 0.0), 4.0);
    colour += uLandDay * rim * 0.25 * daylight;
    gl_FragColor = vec4(colour, 1.0);
  }
`;

/** The atmosphere: a slightly larger shell that only glows at the limb. */
export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform vec3 uSun;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float limb = pow(1.0 - max(dot(normalize(vNormal), vView), 0.0), 3.0);
    float lit = 0.35 + 0.65 * smoothstep(-0.3, 0.4, dot(normalize(vNormal), uSun));
    gl_FragColor = vec4(uColour, limb * lit * 0.9);
  }
`;

/**
 * Satellites: one point each, in one draw call. The worker sends positions a
 * few times a second; the shader interpolates between the last two frames so
 * motion stays smooth at the display's frame rate.
 */
export const satelliteVertex = /* glsl */ `
  attribute vec3 aNext;
  attribute float aClass;
  attribute float aGroup;
  uniform float uMix;
  uniform float uPixelRatio;
  uniform float uGroupMask;
  uniform vec3 uColours[4];
  varying vec3 vColour;
  varying float vVisible;

  void main() {
    vec3 p = mix(position, aNext, uMix);
    float shown = mod(floor(uGroupMask / pow(2.0, aGroup)), 2.0);
    // Satellites that couldn't be propagated sit at the origin.
    vVisible = shown * step(0.5, length(p));
    vColour = aClass < 0.5 ? uColours[0] : aClass < 1.5 ? uColours[1] : aClass < 2.5 ? uColours[2] : uColours[3];
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = vVisible * clamp(9.0 / -view.z, 1.6, 4.0) * uPixelRatio;
    gl_Position = projectionMatrix * view;
  }
`;

export const satelliteFragment = /* glsl */ `
  uniform float uDim;
  varying vec3 vColour;
  varying float vVisible;

  void main() {
    if (vVisible < 0.5) discard;
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.55, 1.0, d);
    if (alpha < 0.02) discard;
    // The rest of the catalog fades while one satellite is selected.
    gl_FragColor = vec4(vColour, alpha * 0.9 * uDim);
  }
`;

/**
 * Fixed-size points for the selected satellite: its orbit as a dotted ring
 * (`uRing` 0) and the satellite itself as a ringed marker (`uRing` 1).
 * WebGL lines are one pixel wide, which vanishes inside the catalog.
 */
export const highlightVertex = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;

  void main() {
    gl_PointSize = uSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const highlightFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uRing;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float disc = 1.0 - smoothstep(0.5, 1.0, d);
    float ring = smoothstep(0.62, 0.72, d) * (1.0 - smoothstep(0.86, 0.96, d));
    float core = 1.0 - smoothstep(0.22, 0.32, d);
    float alpha = mix(disc, max(ring, core), uRing);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(uColour, alpha);
  }
`;
