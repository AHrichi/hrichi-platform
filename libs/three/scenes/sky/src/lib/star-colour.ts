/**
 * A star's colour from its B−V index: the temperature by Ballesteros (2012),
 * then the black-body colour by Tanner Helland's fit, softened towards white
 * because the eye sees star colours only faintly.
 */
export function starColour(bv: number): [number, number, number] {
  const b = Math.min(Math.max(bv, -0.4), 2);
  const kelvin = 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
  const t = kelvin / 100;
  const clamp = (v: number) => Math.min(Math.max(v, 0), 255) / 255;

  const red = t <= 66 ? 1 : clamp(329.698727446 * (t - 60) ** -0.1332047592);
  const green =
    t <= 66
      ? clamp(99.4708025861 * Math.log(t) - 161.1195681661)
      : clamp(288.1221695283 * (t - 60) ** -0.0755148492);
  const blue =
    t >= 66
      ? 1
      : t <= 19
        ? 0
        : clamp(138.5177312231 * Math.log(t - 10) - 305.0447927307);

  const soften = 0.45;
  return [
    red + (1 - red) * soften,
    green + (1 - green) * soften,
    blue + (1 - blue) * soften,
  ];
}
