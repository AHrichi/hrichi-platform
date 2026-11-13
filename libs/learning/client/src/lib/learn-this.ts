import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { CaptureItem, HostCaptureItem } from '@ah/learning/contracts';
import { AhButton, type ButtonVariant } from '@ah/ui';
import { LearningClient } from './learning-client';
import { LearningLink } from './learning-link';

/**
 * "Learn this" (design §9): sends one or more ideas to the Learning
 * Engine, where they become concepts for the daily set. Host apps pass the
 * text and where it came from; the labels are theirs to translate.
 *
 * A linked host sends through the engine's API and stays on the page; the
 * button then says the cards are in the reviews. Inside the portfolio demo
 * shell, it offers both the standalone Learning Engine (new tab) and the
 * in-shell portfolio demo so learners aren't trapped in demo mode.
 */
@Component({
  selector: 'ah-learn-this',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showDemoChoice()) {
      <a
        [ahButton]="variant()"
        [size]="size()"
        [attr.href]="standaloneHref()"
        [attr.aria-disabled]="!sendable() || null"
        target="_blank"
        rel="noopener noreferrer"
        (click)="openStandalone($event)"
      >
        <span aria-hidden="true">✦</span>
        {{ label() }}
        <span aria-hidden="true">↗</span>
        <span class="ah-visually-hidden"> ({{ standaloneHint() }})</span>
      </a>
      <button
        type="button"
        [ahButton]="demoVariant()"
        [size]="size()"
        [disabled]="!sendable()"
        (click)="send()"
      >
        {{ demoLabel() }}
      </button>
    } @else {
      <button
        type="button"
        [ahButton]="variant()"
        [size]="size()"
        [disabled]="!sendable() || allSent()"
        (click)="send()"
      >
        <span aria-hidden="true">{{ allSent() ? '✓' : '✦' }}</span>
        {{ allSent() ? sentLabel() : label() }}
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }
  `,
})
export class LearnThis {
  readonly items = input.required<readonly CaptureItem[]>();
  readonly label = input('Learn this');
  /** Shown alongside the standalone link inside the portfolio demo shell. */
  readonly demoLabel = input('Try in demo');
  /** Screen-reader hint appended to the standalone link when embedded. */
  readonly standaloneHint = input('Standalone app, opens in a new tab');
  /** Shown once a linked host has sent every item. */
  readonly sentLabel = input('In your reviews');
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<'md' | 'sm'>('sm');
  /** After the hand-off, e.g. to say "Sent to your inbox". */
  readonly sent = output<number>();

  private readonly client = inject(LearningClient);
  private readonly link = inject(LearningLink);
  private readonly isLocalHost = signal(false);

  constructor() {
    const doc = inject(DOCUMENT, { optional: true });
    afterNextRender(() => {
      const host = doc?.defaultView?.location.hostname ?? '';
      this.isLocalHost.set(host === 'localhost' || host === '127.0.0.1');
    });
  }

  protected readonly sendable = computed(() =>
    this.items().some((item) => item.text.trim()),
  );
  /** Every item has a source: the link needs it as the card's identity. */
  private readonly linkable = computed(
    () =>
      this.link.linked() && this.items().every((item) => item.source !== null),
  );
  protected readonly showDemoChoice = computed(
    () => this.client.isEmbeddedDemo && !this.linkable(),
  );
  protected readonly demoVariant = computed<ButtonVariant>(() =>
    this.variant() === 'primary' ? 'secondary' : 'ghost',
  );
  protected readonly standaloneHref = computed(() =>
    this.showDemoChoice() && this.sendable()
      ? this.client.captureHref(this.items(), {
          standalone: true,
          isLocalHost: this.isLocalHost(),
        })
      : null,
  );
  protected readonly allSent = computed(
    () =>
      this.linkable() &&
      this.items().every((item) =>
        this.link.isSent(
          item.source?.objectType ?? '',
          item.source?.objectId ?? '',
        ),
      ),
  );

  protected openStandalone(event: MouseEvent): void {
    if (!this.sendable()) {
      event.preventDefault();
      return;
    }
    this.sent.emit(this.items().length);
  }

  protected send(): void {
    if (this.linkable()) {
      this.link.send(this.items() as readonly HostCaptureItem[]);
    } else {
      this.client.capture(this.items());
    }
    this.sent.emit(this.items().length);
  }
}
