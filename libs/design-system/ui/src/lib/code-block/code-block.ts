import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

/**
 * Token-styled code snippet viewer with language badge, optional filename,
 * and one-click clipboard copy functionality.
 */
@Component({
  selector: 'ah-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-code-block',
  },
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');
  readonly filename = input<string>();
  readonly allowCopy = input<boolean>(true);

  readonly copied = signal<boolean>(false);

  async copyCode(): Promise<void> {
    if (!this.allowCopy()) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.code());
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  }
}
