import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { type Block, CATALOG } from '@ah/products/studylm/lessons';

/**
 * A kind this version can't draw yet. Its steps still read as text, so the
 * lesson loses no content.
 */
@Component({
  selector: 'sl-coming-next',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="kind">{{ label() }}</p>
    @if (title(); as title) {
      <p class="title">{{ title }}</p>
    }
    <p class="note">This interactive visual arrives in a later update.</p>
    @if (steps().length) {
      <ol>
        @for (step of steps(); track $index) {
          <li>
            <strong>{{ step.title }}.</strong> {{ step.narration }}
          </li>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
    }
    p {
      margin: 0;
    }
    .kind {
      color: var(--color-text-muted);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .title {
      font-weight: var(--font-weight-semibold);
    }
    .note {
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
    }
    ol {
      margin: 0;
      padding-inline-start: var(--space-5);
      line-height: 1.6;
    }
  `,
})
export class ComingNext {
  readonly block = input.required<Block>();

  protected readonly label = computed(() => CATALOG[this.block().kind].label);
  protected readonly title = computed(() => {
    const block = this.block() as { title?: string | null };
    return block.title ?? null;
  });
  protected readonly steps = computed(() => {
    const block = this.block() as {
      steps?: readonly { title: string; narration: string }[];
      frames?: readonly { narration: string }[];
    };
    return (
      block.steps ??
      block.frames?.map((frame, i) => ({
        title: `Step ${i + 1}`,
        narration: frame.narration,
      })) ??
      []
    );
  });
}
