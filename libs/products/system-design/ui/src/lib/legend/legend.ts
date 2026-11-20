import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { PacketKind } from '@ah/products/system-design/domain';

export interface LegendItemView {
  kind: PacketKind;
  label: string;
  shape: 'dot' | 'ring' | 'square';
}

const DEFAULT_PACKET_KINDS: readonly PacketKind[] = [
  'request',
  'response',
  'handshake',
  'write',
  'event',
  'error',
];

const PACKET_LABELS: Readonly<Record<PacketKind, string>> = {
  request: 'Request',
  response: 'Response',
  handshake: 'Handshake',
  write: 'Write',
  event: 'Event',
  error: 'Error',
};

/**
 * Packet legend (`sd-legend`) shown on the stage card.
 * Dots for request/response/event/error, a hollow ring for handshake, and a
 * square for write.
 */
@Component({
  selector: 'sd-legend',
  templateUrl: './legend.html',
  styleUrl: './legend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLegend {
  readonly kinds = input<readonly PacketKind[]>(DEFAULT_PACKET_KINDS);

  protected readonly items = computed<readonly LegendItemView[]>(() =>
    this.kinds().map((kind) => ({
      kind,
      label: PACKET_LABELS[kind],
      shape:
        kind === 'handshake' ? 'ring' : kind === 'write' ? 'square' : 'dot',
    })),
  );
}
