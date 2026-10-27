/**
 * GLSL for the constellation. Nodes are camera-facing quads drawn in one
 * instanced call; the glow is computed per pixel, so there is no bloom pass
 * and no extra render target.
 */

/** Quads span this many core radii, leaving room for the halo. */
export const haloSpan = 3.5;

export const nodeVertex = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aColor;
  attribute float aRadius;
  attribute float aFocus;
  uniform float uTime;
  uniform float uFocus;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vLight;

  void main() {
    vUv = uv;
    vColor = aColor;
    // Unfocused nodes dim while something is highlighted.
    vLight = mix(1.0, mix(0.28, 1.25, aFocus), uFocus);
    float breathe = 1.0 + 0.05 * sin(uTime * 1.3 + aOffset.x * 9.0 + aOffset.z * 5.0);
    float radius = aRadius * breathe * (1.0 + 0.35 * aFocus * uFocus);
    vec4 view = modelViewMatrix * vec4(aOffset, 1.0);
    // Billboard: grow the quad in view space so it always faces the camera.
    view.xy += position.xy * radius * ${haloSpan.toFixed(1)} * 2.0;
    gl_Position = projectionMatrix * view;
  }
`;

export const nodeFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vLight;

  void main() {
    // Distance from the centre in core radii.
    float d = length(vUv - 0.5) * 2.0 * ${haloSpan.toFixed(1)};
    float core = 1.0 - smoothstep(0.82, 1.0, d);
    float halo = exp(-d * d * 0.32) * 0.6;
    float alpha = clamp(core + halo * (1.0 - core), 0.0, 1.0) * vLight;
    if (alpha < 0.004) discard;
    // A white-hot centre reads as light rather than paint.
    vec3 colour = mix(vColor, vec3(1.0), core * 0.35);
    gl_FragColor = vec4(colour, alpha);
  }
`;

export const edgeVertex = /* glsl */ `
  attribute float aT;
  attribute vec3 aColor;
  attribute float aKind;
  attribute float aSeed;
  attribute float aFocus;
  varying float vT;
  varying vec3 vColor;
  varying float vKind;
  varying float vSeed;
  varying float vFocus;

  void main() {
    vT = aT;
    vColor = aColor;
    vKind = aKind;
    vSeed = aSeed;
    vFocus = aFocus;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const edgeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uFocus;
  varying float vT;
  varying vec3 vColor;
  varying float vKind;
  varying float vSeed;
  varying float vFocus;

  void main() {
    // A pulse runs from each project to the one it depends on.
    float head = fract(uTime * 0.22 + vSeed);
    float behind = head - vT;
    float pulse = behind >= 0.0 ? exp(-behind * 9.0) : 0.0;
    // Federated edges (kind 3) are runtime-only, so they are dashed.
    float dash = vKind > 2.5 ? step(0.45, fract(vT * 16.0 - uTime * 0.6)) : 1.0;
    float alpha = (0.3 + pulse * 0.7) * dash;
    alpha *= mix(1.0, mix(0.18, 1.8, vFocus), uFocus);
    gl_FragColor = vec4(vColor, clamp(alpha, 0.0, 1.0));
  }
`;

export const starVertex = /* glsl */ `
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vAlpha = clamp(aSize * 0.35, 0.15, 0.6);
    gl_PointSize = aSize * uPixelRatio * (6.0 / -view.z);
    gl_Position = projectionMatrix * view;
  }
`;

export const starFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.2, 1.0, d)) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
