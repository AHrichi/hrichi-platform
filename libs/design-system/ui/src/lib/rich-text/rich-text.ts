import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { parseRichText } from './rich-text.parse';

/**
 * Text with light formatting — paragraphs, lists, **bold**, *italic* and
 * `code` — drawn from a parsed tree with Angular's own elements, never as
 * HTML: a model's answer (or anyone's) can't run anything. Each block
 * reads in its own direction (`dir="auto"`), so Arabic and English answers
 * both sit right. `transform` touches only plain text (keeping a
 * temperature's unit whole in right-to-left text, say).
 */
@Component({
  selector: 'ah-rich-text',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ah-rich-text' },
  template: `
    <ng-template #inline let-runs>
      @for (run of runs; track $index) {
        @switch (run.kind) {
          @case ('strong') {
            <strong
              ><ng-container
                *ngTemplateOutlet="
                  inline;
                  context: { $implicit: run.children }
                "
            /></strong>
          }
          @case ('em') {
            <em
              ><ng-container
                *ngTemplateOutlet="
                  inline;
                  context: { $implicit: run.children }
                "
            /></em>
          }
          @case ('code') {
            <code dir="ltr">{{ run.text }}</code>
          }
          @default {
            <ng-container>{{ run.text }}</ng-container>
          }
        }
      }
    </ng-template>

    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('heading') {
          <p class="heading" dir="auto">
            <ng-container
              *ngTemplateOutlet="inline; context: { $implicit: block.inlines }"
            />
          </p>
        }
        @case ('list') {
          @if (block.ordered) {
            <ol [attr.start]="block.start === 1 ? null : block.start">
              @for (item of block.items; track $index) {
                <li dir="auto">
                  <ng-container
                    *ngTemplateOutlet="inline; context: { $implicit: item }"
                  />
                </li>
              }
            </ol>
          } @else {
            <ul>
              @for (item of block.items; track $index) {
                <li dir="auto">
                  <ng-container
                    *ngTemplateOutlet="inline; context: { $implicit: item }"
                  />
                </li>
              }
            </ul>
          }
        }
        @default {
          <p dir="auto">
            <ng-container
              *ngTemplateOutlet="inline; context: { $implicit: block.inlines }"
            />
          </p>
        }
      }
    }
  `,
  styleUrl: './rich-text.scss',
})
export class RichText {
  readonly text = input('');
  readonly transform = input<(text: string) => string>((text) => text);

  protected readonly blocks = computed(() =>
    parseRichText(this.text(), this.transform()),
  );
}
