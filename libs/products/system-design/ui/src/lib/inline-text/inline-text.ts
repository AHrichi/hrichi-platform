import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type InlineToken,
  parseInline,
} from '@ah/products/system-design/domain';

/**
 * Renders inline lesson text (`**bold**`, `` `code` ``, `_term_`) safely via
 * `parseInline()` and `[textContent]` bindings — never `innerHTML`.
 */
@Component({
  selector: 'sd-inline-text',
  templateUrl: './inline-text.html',
  styleUrl: './inline-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdInlineText {
  readonly text = input.required<string>();

  protected readonly tokens = computed<readonly InlineToken[]>(() =>
    parseInline(this.text()),
  );
}
