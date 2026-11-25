import { describe, expect, it } from 'vitest';
import { PHENOMENA } from '@ah/products/serracalc/domain';
import { type MathNode, parseFormula } from './formula-parse';

/** A compact text form of the tree, to compare against. */
function show(nodes: readonly MathNode[]): string {
  return nodes
    .map((n): string => {
      switch (n.k) {
        case 'mi':
        case 'mn':
        case 'mo':
          return n.t;
        case 'mtext':
          return `"${n.t}"`;
        case 'space':
          return '␣';
        case 'sub':
          return `${show([n.b])}_{${show([n.s])}}`;
        case 'sup':
          return `${show([n.b])}^{${show([n.s])}}`;
        case 'frac':
          return `{${show(n.n)}}/{${show(n.d)}}`;
        case 'sqrt':
          return `√{${show(n.c)}}`;
        case 'group':
          return `${n.open}${show(n.c)}${n.close}`;
      }
    })
    .join(' ');
}

const one = (source: string) => {
  const [eq] = parseFormula(source);
  return show(eq.nodes);
};

describe('parseFormula', () => {
  it('builds a fraction from a spaced slash, dropping its brackets', () => {
    expect(one('EC_drain = (A·EC_feed − U·EC_uptake) / D')).toBe(
      'EC_{drain} = {A · EC_{feed} − U · EC_{uptake}}/{D}',
    );
  });

  it('keeps an unspaced slash inline, as in units and D/A', () => {
    expect(one('C_D = C·A/D')).toBe('C_{D} = C · A / D');
    expect(one('= 4.80 dS/m')).toBe('= 4.80 ␣ dS / "m"');
    expect(one('→ 467 L/d')).toBe('→ 467 ␣ "L" / "d"');
    // A letter after a number is a unit only when it is one: T is not.
    expect(one('ΔT/T + 17.27 T')).toBe('ΔT / T + 17.27 ␣ T');
  });

  it('takes the whole term before the slash as the numerator', () => {
    expect(one('t = V (C_lim·D/A − C_0) / (C_in·F)')).toBe(
      't = {V ␣ (C_{lim} · D / A − C_{0})}/{C_{in} · F}',
    );
    expect(one('Y = a + b × c / d')).toBe('Y = a + {b × c}/{d}');
  });

  it('reads numbers as the screens print them', () => {
    expect(one('38 × (8 × 16 / 53 − 1) / (1 × 37) = 2 d')).toBe(
      '{38 × ({8 × 16}/{53} − 1)}/{1 × 37} = 2 ␣ "d"',
    );
    expect(one('Q = 825,2 × 10⁻⁶')).toBe('Q = 825,2 × 10⁻⁶');
  });

  it('handles powers, roots and functions', () => {
    expect(one('h_c = 1.32 (ΔT / D)^0.25')).toBe(
      'h_{c} = 1.32 ␣ ({ΔT}/{D})^{0.25}',
    );
    expect(one('G = √(2g × h)')).toBe('G = √{2 g × h}');
    expect(one('e_s = exp(17.27 T / (T + 237.3))')).toBe(
      'e_{s} = exp ({17.27 ␣ T}/{T + 237.3})',
    );
  });

  it('keeps plain words together as text', () => {
    expect(one('heat if T_min < night set point')).toBe(
      '"heat if" ␣ T_{min} < "night set point"',
    );
  });

  it('splits equations, and reads labels and notes', () => {
    const eqs = parseFormula(
      'closed: t = V / F;  Q = 1.163 × V   [kWh; V in m³]',
    );
    expect(eqs).toHaveLength(2);
    expect(eqs[0].label).toBe('closed');
    expect(eqs[1].note).toBe('kWh; V in m³');
    expect(show(eqs[1].nodes)).toBe('Q = 1.163 × V');
  });

  it('parses every formula on the Science page without falling back', () => {
    for (const p of PHENOMENA) {
      for (const eq of parseFormula(p.formula)) {
        const whole = eq.nodes.length === 1 && eq.nodes[0].k === 'mtext';
        expect(whole, `${p.id}: ${p.formula}`).toBe(false);
      }
    }
  });
});
