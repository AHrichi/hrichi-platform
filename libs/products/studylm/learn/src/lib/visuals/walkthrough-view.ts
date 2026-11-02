import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { BlockOf, WalkthroughState } from '@ah/products/studylm/lessons';

/** Code with the lines in focus lit, and each step's notes under their line. */
@Component({
  selector: 'sl-walkthrough-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pre
      class="code"
      dir="ltr"
      tabindex="0"
      [attr.aria-label]="'Code, ' + block().language"
    ><code>@for (line of lines(); track line.n) {<span class="line" [class.focus]="line.focus" [class.dim]="line.dim"><span class="n" aria-hidden="true">{{ line.n }}</span>{{ line.text }}
</span>@for (note of line.notes; track $index) {<span class="note">↳ {{ note }}
</span>}}</code></pre>
  `,
  styles: `
    .code {
      margin: 0;
      padding: var(--space-3) 0;
      overflow-x: auto;
      border-radius: var(--radius-md);
      background: var(--color-stage-bg);
      color: var(--color-stage-text);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
      line-height: 1.6;
    }
    .line,
    .note {
      display: block;
      padding-inline: var(--space-3);
    }
    .n {
      display: inline-block;
      inline-size: 2.5ch;
      margin-inline-end: var(--space-3);
      color: var(--sl-muted);
      text-align: end;
      user-select: none;
    }
    .focus {
      background: color-mix(in srgb, var(--color-data-3) 22%, transparent);
      box-shadow: inset 3px 0 var(--color-data-3);
    }
    .dim {
      color: var(--sl-muted);
    }
    .note {
      padding-inline-start: calc(var(--space-3) + 2.5ch + var(--space-3));
      color: var(--color-data-3);
      font-family: var(--font-family-sans);
      white-space: pre-wrap;
    }
  `,
})
export class WalkthroughView {
  readonly block = input.required<BlockOf<'code-walkthrough'>>();
  readonly state = input.required<WalkthroughState>();

  protected readonly lines = computed(() => {
    const { lines, notes } = this.state();
    return this.block()
      .code.split('\n')
      .map((text, i) => {
        const n = i + 1;
        const focus = lines !== null && n >= lines[0] && n <= lines[1];
        return {
          n,
          text,
          focus,
          dim: lines !== null && !focus,
          notes: notes
            .filter((note) => note.line === n)
            .map((note) => note.text),
        };
      });
  });
}
