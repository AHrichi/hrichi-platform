import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { type Inline, parseMarkdown } from '@ah/products/studylm/lessons';

/**
 * A lesson's Markdown, rendered from the parser's token tree as elements.
 * Text is always interpolated, never bound as HTML.
 */
@Component({
  selector: 'sl-markdown',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #inline let-nodes>
      @for (node of asInline(nodes); track $index) {
        @switch (node.type) {
          @case ('text') {
            <!-- Bound, not interpolated: template whitespace can't leak in. -->
            <span [textContent]="$any(node).text"></span>
          }
          @case ('code') {
            <code [textContent]="$any(node).text"></code>
          }
          @case ('em') {
            <em
              ><ng-container
                *ngTemplateOutlet="
                  inline;
                  context: { $implicit: $any(node).children }
                "
            /></em>
          }
          @case ('strong') {
            <strong
              ><ng-container
                *ngTemplateOutlet="
                  inline;
                  context: { $implicit: $any(node).children }
                "
            /></strong>
          }
          @case ('link') {
            <a
              [href]="$any(node).href"
              target="_blank"
              rel="noopener noreferrer"
              ><ng-container
                *ngTemplateOutlet="
                  inline;
                  context: { $implicit: $any(node).children }
                "
            /></a>
          }
        }
      }
    </ng-template>
    @for (block of blocks(); track $index) {
      @if (block.type === 'paragraph') {
        <p>
          <ng-container
            *ngTemplateOutlet="inline; context: { $implicit: block.children }"
          />
        </p>
      } @else if (block.ordered) {
        <ol>
          @for (item of block.items; track $index) {
            <li>
              <ng-container
                *ngTemplateOutlet="inline; context: { $implicit: item }"
              />
            </li>
          }
        </ol>
      } @else {
        <ul>
          @for (item of block.items; track $index) {
            <li>
              <ng-container
                *ngTemplateOutlet="inline; context: { $implicit: item }"
              />
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    p {
      margin: 0 0 var(--space-3);
      line-height: 1.65;
    }
    p:last-child {
      margin-block-end: 0;
    }
    code {
      padding: 0 0.3em;
      border-radius: var(--radius-sm);
      background: var(--color-bg-raised);
      font-family: var(--font-family-mono);
      font-size: 0.92em;
    }
    ul,
    ol {
      margin: 0 0 var(--space-3);
      padding-inline-start: var(--space-5);
      line-height: 1.6;
    }
  `,
})
export class MarkdownView {
  readonly source = input.required<string>();
  protected readonly blocks = computed(() => parseMarkdown(this.source()));

  protected asInline(nodes: unknown): Inline[] {
    return nodes as Inline[];
  }
}
