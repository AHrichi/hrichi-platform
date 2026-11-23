import { encode } from 'uqr';
import { badgeQr } from './badge-qr';

/** Paints the path's rectangles back onto a grid. */
function paint(d: string, size: number): boolean[][] {
  const grid = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false),
  );
  for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let i = 0; i < Number(w); i++) {
      const row = grid[Number(y)];
      if (row) row[Number(x) + i] = true;
    }
  }
  return grid;
}

describe('badgeQr', () => {
  it('draws exactly the dark modules of the QR code', () => {
    const { data, size } = encode('GH-0042', { ecc: 'M', border: 4 });
    const qr = badgeQr('GH-0042');
    expect(qr.size).toBe(size);
    expect(paint(qr.d, size)).toEqual(data);
  });

  it('keeps a four-module quiet zone', () => {
    const qr = badgeQr('GH-0001');
    const grid = paint(qr.d, qr.size);
    const edge = [...grid.slice(0, 4), ...grid.slice(-4)].flat();
    expect(edge.every((dark) => !dark)).toBe(true);
  });
});
