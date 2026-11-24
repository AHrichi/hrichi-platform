import { DEFAULT_GREENHOUSE } from '../data/catalogue.data';
import type { GreenhouseSpec } from '../models/serra.models';
import { greenhouseGeometry, roofSectionsPerSpan } from './geometry';

describe('Greenhouse geometry', () => {
  it('measures a multi-span gable house', () => {
    const g = greenhouseGeometry(DEFAULT_GREENHOUSE);
    // 8 × 9.6 m wide, 60 m long
    expect(g.widthM).toBe(76.8);
    expect(g.floorAreaM2).toBe(4608);
    expect(g.perimeterM).toBe(273.6);
    // Each slope: √(4.8² + 1.8²) = 5.126 m; 16 slopes × 60 m
    expect(g.roofAreaM2).toBe(Math.round(16 * Math.hypot(4.8, 1.8) * 60));
    expect(g.sideWallAreaM2).toBe(540);
    // Ends: 2 × (76.8 × 4.5 + 8 × 9.6 × 1.8 / 2)
    expect(g.gableAreaM2).toBe(Math.round(2 * (76.8 * 4.5 + 8 * 8.64)));
    // 4608 × 4.5 + 8 × 8.64 × 60
    expect(g.volumeM3).toBe(Math.round(4608 * 4.5 + 8 * 8.64 * 60));
    expect(g.coverRatio).toBeGreaterThan(1.3);
    expect(g.coverRatio).toBeLessThan(1.45);
  });

  it('splits a Venlo span into 3.2 m roofs', () => {
    const venlo: GreenhouseSpec = {
      ...DEFAULT_GREENHOUSE,
      shape: 'venlo',
      spanWidthM: 9.6,
      ridgeHeightM: 5.4,
    };
    expect(roofSectionsPerSpan(venlo)).toBe(3);
    const g = greenhouseGeometry(venlo);
    // 24 roofs of 3.2 m, rise 0.9: 48 slopes of √(1.6² + 0.9²)
    expect(g.roofAreaM2).toBe(Math.round(48 * Math.hypot(1.6, 0.9) * 60));
    expect(g.roofSectionsPerSpan).toBe(3);
  });

  it('treats a tunnel roof as half an ellipse', () => {
    const tunnel: GreenhouseSpec = {
      ...DEFAULT_GREENHOUSE,
      shape: 'tunnel',
      spans: 1,
      spanWidthM: 8,
      lengthM: 50,
      gutterHeightM: 1.5,
      ridgeHeightM: 5.5,
    };
    const g = greenhouseGeometry(tunnel);
    // A semicircle of radius 4 m: π × 4 = 12.566 m across, × 50 m
    expect(g.roofAreaM2).toBe(Math.round(Math.PI * 4 * 50));
    // Floor × 1.5 + half disc (π × 4² / 2) × 50
    expect(g.volumeM3).toBe(Math.round(400 * 1.5 + ((Math.PI * 16) / 2) * 50));
    expect(g.notes.map((n) => n.code)).toContain('geometry.lowGutter');
  });
});
