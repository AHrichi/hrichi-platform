import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { encode } from 'uqr';

export interface QrPath {
  /** Modules per side, quiet zone included. */
  readonly size: number;
  /** One SVG path of every dark module, one unit square each. */
  readonly d: string;
}

/**
 * A QR code as one SVG path: medium error correction (a phone screen with
 * glare, a scratched sticker) and the standard four-module quiet zone.
 */
export function qrPath(text: string): QrPath {
  const { data, size } = encode(text, { ecc: 'M', border: 4 });
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

/**
 * Dark modules on a light square in every theme: scanners read that best,
 * so the code sets its own light colour scheme (see the .scss).
 */
@Component({
  selector: 'lt-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="qr"
      role="img"
      [attr.aria-label]="label()"
      [attr.viewBox]="'0 0 ' + path().size + ' ' + path().size"
      shape-rendering="crispEdges"
    >
      <rect
        class="qr-bg"
        [attr.width]="path().size"
        [attr.height]="path().size"
      />
      <path class="qr-fg" [attr.d]="path().d" />
    </svg>
  `,
  styleUrl: './qr-code.scss',
})
export class QrCode {
  readonly text = input.required<string>();
  /** What the code is for, read by screen readers. */
  readonly label = input.required<string>();

  protected readonly path = computed(() => qrPath(this.text()));
}
