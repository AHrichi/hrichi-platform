import linesData from '../generated/lines.json';
import starsData from '../generated/stars.json';
import { horizonAltitude } from './horizon';
import { limitingMagnitude } from './sky-layer';
import { starColour } from './star-colour';

describe('sky data', () => {
  it('lists naked-eye stars brightest first', () => {
    const magnitudes = starsData.stars.filter((_, i) => i % 4 === 2);
    expect(magnitudes).toHaveLength(starsData.count);
    expect(starsData.count).toBeGreaterThan(5000);
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => a - b));
    // Sirius first: RA 101.29°, Dec −16.72°.
    expect(starsData.stars.slice(0, 2)).toEqual([101.287, -16.716]);
  });

  it('draws every constellation figure', () => {
    expect(linesData.figures).toHaveLength(89);
    for (const figure of linesData.figures) {
      expect(figure.lines.length).toBeGreaterThan(0);
    }
  });
});

describe('star colours', () => {
  it('turns blue-white stars bluish and red giants orange', () => {
    const [rb, , bb] = starColour(-0.3);
    const [rr, , br] = starColour(1.8);
    expect(bb).toBeGreaterThan(rb);
    expect(rr).toBeGreaterThan(br);
    for (const channel of [
      ...starColour(0.65),
      ...starColour(-1),
      ...starColour(4),
    ]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });
});

describe('what the eye can see', () => {
  it('reaches magnitude 6 under a dark, moonless sky', () => {
    expect(limitingMagnitude(-30, -10, 1)).toBeCloseTo(6.2, 1);
  });

  it('loses faint stars in twilight and under a full Moon', () => {
    expect(limitingMagnitude(-9, -10, 0)).toBeLessThan(4.5);
    expect(limitingMagnitude(-30, 60, 1)).toBeLessThan(5);
    expect(limitingMagnitude(20, -10, 0)).toBeLessThan(-2);
  });
});

describe('the skyline', () => {
  it('stays low: a few degrees of hills and pines', () => {
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      const altitude = horizonAltitude(a);
      expect(altitude).toBeGreaterThan(-0.01);
      expect(altitude).toBeLessThan((6 * Math.PI) / 180);
    }
    expect(horizonAltitude(1)).toBeCloseTo(horizonAltitude(1 + Math.PI * 2), 9);
  });
});
