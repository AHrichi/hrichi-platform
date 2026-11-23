import { encode } from 'uqr';

export interface QrPath {
  /** Modules per side, quiet zone included. */
  size: number;
  /** One SVG path of every dark module, 1 unit square each. */
  d: string;
}

/**
 * A badge's QR code as a single SVG path: medium error correction (a badge
 * gets scratched and wet) and the standard four-module quiet zone.
 */
export function badgeQr(code: string): QrPath {
  const { data, size } = encode(code, { ecc: 'M', border: 4 });
  const parts: string[] = [];
  data.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      // One rectangle per run of dark modules keeps the path short.
      const start = x;
      while (x < row.length && row[x]) x += 1;
      parts.push(`M${start} ${y}h${x - start}v1h${start - x}z`);
    }
  });
  return { size, d: parts.join('') };
}
