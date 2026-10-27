const TAU = Math.PI * 2;

/** A repeatable pseudo-random number in [0, 1) for an integer. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43_758.5453;
  return x - Math.floor(x);
}

/**
 * The campsite's skyline: altitude (radians) of the ground at an azimuth
 * (radians east of north). Low rolling hills, with a few stands of pines.
 * The ground mesh and the labels use it, so nothing shows through a hill.
 */
export function horizonAltitude(azimuth: number): number {
  const a = ((azimuth % TAU) + TAU) % TAU;
  const hills =
    0.01 +
    0.02 *
      (0.5 + 0.5 * Math.sin(a * 3 + 1.3)) *
      (0.5 + 0.5 * Math.sin(a * 7 + 0.4)) +
    0.006 * Math.sin(a * 13 + 2.1);

  // Pines grow where this is positive: two or three stands around the camp.
  const stand = Math.max(0, Math.sin(a * 2 + 0.7)) ** 3;
  const width = (1.1 * Math.PI) / 180;
  const slot = Math.floor(a / width);
  const tall = hash(slot);
  const shape = 1 - Math.abs((a / width - slot) * 2 - 1);
  const pine = tall > 0.35 ? stand * (0.015 + 0.035 * tall) * shape : 0;

  return hills + pine;
}

/** The campfire, just in front of the observer: azimuth and altitude, radians. */
export const campfire = { azimuth: (196 * Math.PI) / 180, altitude: -0.07 };
