import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { BlockOf, SequenceState } from '@ah/products/studylm/lessons';

const LANE = 150;
const TOP = 56;
const ROW = 42;

/** Actors across the top; each message appears on its own row, in order. */
@Component({
  selector: 'sl-sequence-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="diagram"
      [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
      [style.min-inline-size.px]="width() * 0.75"
      role="img"
      [attr.aria-label]="label()"
    >
      <defs>
        <marker
          [attr.id]="arrowId()"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" class="arrowhead" />
        </marker>
      </defs>
      @for (actor of actors(); track actor.id) {
        <line
          class="lifeline"
          [attr.x1]="actor.x"
          [attr.x2]="actor.x"
          y1="40"
          [attr.y2]="height() - 8"
        />
        <g
          class="actor"
          [class.highlighted]="state().highlighted.includes(actor.id)"
        >
          <rect [attr.x]="actor.x - 62" y="4" width="124" height="34" rx="8" />
          <text [attr.x]="actor.x" y="26">{{ actor.label }}</text>
        </g>
      }
      @for (message of messages(); track message.id) {
        <g
          class="message"
          [class.reply]="message.style === 'reply'"
          [class.highlighted]="state().highlighted.includes(message.id)"
        >
          <path
            [attr.d]="message.d"
            [attr.marker-end]="'url(#' + arrowId() + ')'"
          />
          <text [attr.x]="message.labelX" [attr.y]="message.y - 7">
            {{ message.label }}
          </text>
        </g>
      }
    </svg>
    @if (notes().length) {
      <ul class="notes">
        @for (note of notes(); track $index) {
          <li>
            <strong>{{ note.actor }}:</strong> {{ note.text }}
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .diagram {
      display: block;
      inline-size: 100%;
      max-block-size: 30rem;
    }
    .lifeline {
      stroke: var(--color-stage-border);
      stroke-dasharray: 4 4;
    }
    .actor rect {
      fill: var(--color-stage-bg);
      stroke: var(--color-stage-border);
      stroke-width: 2;
    }
    .actor.highlighted rect {
      stroke: var(--color-data-3);
    }
    text {
      fill: var(--color-stage-text);
      font-size: 12px;
      text-anchor: middle;
    }
    .message path {
      fill: none;
      stroke: var(--color-data-2);
      stroke-width: 2;
    }
    .message.reply path {
      stroke-dasharray: 6 4;
    }
    .message.highlighted path {
      stroke: var(--color-data-3);
      stroke-width: 3;
    }
    .message.highlighted text {
      font-weight: 700;
    }
    .message text {
      font-family: var(--font-family-mono);
      font-size: 11px;
    }
    .arrowhead {
      fill: var(--color-data-2);
    }
    .notes {
      margin: var(--space-2) 0 0;
      padding-inline-start: var(--space-4);
      font-size: var(--font-size-200);
    }
  `,
})
export class SequenceView {
  readonly block = input.required<BlockOf<'sequence'>>();
  readonly state = input.required<SequenceState>();

  protected readonly arrowId = computed(() => `sl-seq-${this.block().id}`);

  protected readonly actors = computed(() =>
    this.block().actors.map((actor, i) => ({
      ...actor,
      x: LANE / 2 + i * LANE,
    })),
  );

  protected readonly width = computed(() => this.actors().length * LANE);
  protected readonly height = computed(
    () => TOP + Math.max(this.messages().length, 1) * ROW + 16,
  );

  protected readonly messages = computed(() => {
    const x = new Map(this.actors().map((a) => [a.id, a.x]));
    const byId = new Map(this.block().messages.map((m) => [m.id, m]));
    return this.state().shown.flatMap((id, row) => {
      const message = byId.get(id);
      if (!message) return [];
      const y = TOP + 18 + row * ROW;
      const from = x.get(message.from) ?? 0;
      const to = x.get(message.to) ?? 0;
      const d =
        from === to
          ? `M${from},${y - 8} h36 v16 h-34`
          : `M${from},${y} L${to + (to > from ? -2 : 2)},${y}`;
      return [
        {
          ...message,
          y,
          d,
          labelX: from === to ? from + 60 : (from + to) / 2,
        },
      ];
    });
  });

  protected readonly notes = computed(() => {
    const labels = new Map(this.block().actors.map((a) => [a.id, a.label]));
    return this.state().notes.map((note) => ({
      actor: labels.get(note.actor) ?? note.actor,
      text: note.text,
    }));
  });

  protected readonly label = computed(() => {
    const block = this.block();
    return `${block.title ?? 'Sequence'} between ${block.actors.map((a) => a.label).join(', ')}`;
  });
}
