import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** A frame from either source: the tracer's run or the AI's script. */
export interface ShownFrame {
  line: number;
  vars: { scope: string; name: string; value: string }[];
  stack: string[];
  output: string;
}

/** Code with the line about to run lit, and the state at that moment. */
@Component({
  selector: 'sl-code-trace-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let f = frame();
    <p class="source">
      {{ executed() ? '▶ Run in your browser' : '✎ Steps written by the AI' }}
    </p>
    <div class="layout" dir="ltr">
      <pre
        class="code"
        tabindex="0"
        aria-label="Code"
      ><code>@for (line of lines(); track $index) {<span class="line" [class.now]="f?.line === $index + 1"><span class="n" aria-hidden="true">{{ $index + 1 }}</span>{{ line }}
</span>}</code></pre>
      <div class="state">
        <section aria-label="Variables">
          <p class="title">Variables</p>
          @if (f?.vars?.length) {
            <table>
              @for (v of f!.vars; track v.scope + v.name) {
                <tr>
                  <th scope="row">{{ v.name }}</th>
                  <td>{{ v.value }}</td>
                  <td class="scope">{{ v.scope }}</td>
                </tr>
              }
            </table>
          } @else {
            <p class="empty">none yet</p>
          }
        </section>
        <section aria-label="Call stack">
          <p class="title">Call stack</p>
          <ol class="stack">
            @for (call of f?.stack ?? []; track $index) {
              <li>{{ call }}</li>
            } @empty {
              <li class="empty">top level</li>
            }
          </ol>
        </section>
        <section aria-label="Output">
          <p class="title">Output</p>
          <pre class="out">{{ f?.output || '' }}</pre>
        </section>
      </div>
    </div>
  `,
  styles: `
    .source {
      margin: 0 0 var(--space-2);
      color: var(--sl-muted);
      font-size: var(--font-size-100);
    }
    .layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: var(--space-3);
    }
    .code {
      margin: 0;
      padding: var(--space-2) 0;
      overflow-x: auto;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
      line-height: 1.6;
    }
    .line {
      display: block;
      padding-inline: var(--space-2);
    }
    .now {
      background: color-mix(in srgb, var(--color-data-3) 25%, transparent);
      box-shadow: inset 3px 0 var(--color-data-3);
    }
    .n {
      display: inline-block;
      inline-size: 2.5ch;
      margin-inline-end: var(--space-2);
      color: var(--sl-muted);
      text-align: end;
      user-select: none;
    }
    .state {
      display: grid;
      gap: var(--space-2);
      align-content: start;
    }
    section {
      padding: var(--space-2);
      border: 1px solid var(--color-stage-border);
      border-radius: var(--radius-md);
    }
    .title {
      margin: 0 0 var(--space-1);
      color: var(--sl-muted);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table {
      border-collapse: collapse;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
    }
    th,
    td {
      padding: 2px var(--space-2);
      text-align: start;
    }
    th {
      color: var(--color-data-2);
      font-weight: var(--font-weight-semibold);
    }
    .scope {
      color: var(--sl-muted);
      font-size: var(--font-size-100);
    }
    .stack {
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
    }
    .empty {
      margin: 0;
      color: var(--sl-muted);
      font-size: var(--font-size-200);
    }
    .out {
      margin: 0;
      min-block-size: 1.5em;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
      white-space: pre-wrap;
    }
  `,
})
export class CodeTraceView {
  readonly code = input.required<string>();
  readonly frame = input<ShownFrame | null>(null);
  readonly executed = input(false);
  protected readonly lines = computed(() => this.code().split('\n'));
}
