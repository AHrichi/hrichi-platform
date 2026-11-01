import { combineSides, gravityToLean, leanToCompass } from './plumb';

const g = 9.81;
const rad = (deg: number) => (deg * Math.PI) / 180;

describe('Phone plumb reading', () => {
  it('reads a plumb pole as zero, on Android and iOS signs', () => {
    expect(gravityToLean(0, g, 0)).toEqual({ sideways: -0, away: 0 });
    const ios = gravityToLean(0, -g, 0);
    expect(ios?.sideways).toBeCloseTo(0);
    expect(ios?.away).toBeCloseTo(0);
  });

  it('reads a 1° lean to the right and away', () => {
    const right = gravityToLean(-g * Math.sin(rad(1)), g * Math.cos(rad(1)), 0);
    expect(right?.sideways).toBeCloseTo(1, 5);
    const away = gravityToLean(0, g * Math.cos(rad(1)), g * Math.sin(rad(1)));
    expect(away?.away).toBeCloseTo(1, 5);
  });

  it('refuses a phone lying flat', () => {
    expect(gravityToLean(0, 0.5, g)).toBeNull();
  });

  it('cancels the phone error and the taper between the two sides', () => {
    const lean = { sideways: 0.4, away: -0.3 };
    const bias = { sideways: 0.5, away: 0.2 };
    const taper = 0.35;
    const a = {
      sideways: lean.sideways + bias.sideways,
      away: lean.away + taper + bias.away,
    };
    const b = {
      sideways: -lean.sideways + bias.sideways,
      away: -lean.away + taper + bias.away,
    };
    const both = combineSides(a, b);
    expect(both.sideways).toBeCloseTo(0.4);
    expect(both.away).toBeCloseTo(-0.3);
  });

  it('turns the lean into compass components', () => {
    // Facing north, leaning away = north; leaning right = east.
    expect(leanToCompass({ sideways: 0, away: 1 }, 0).north).toBeCloseTo(1);
    expect(leanToCompass({ sideways: 1, away: 0 }, 0).east).toBeCloseTo(1);
    // Facing east, leaning away = east; leaning right = south.
    expect(leanToCompass({ sideways: 0, away: 1 }, 90).east).toBeCloseTo(1);
    expect(leanToCompass({ sideways: 1, away: 0 }, 90).north).toBeCloseTo(-1);
  });
});
