import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComingSoon } from '@ah/products/system-design/ui';
import { SHELL_COPY } from '../copy/shell-copy';

/**
 * The app's root. It carries the paper look and pins English, left to right,
 * so the course reads the same inside the portfolio whatever the site
 * language (ADR-0025).
 */
@Component({
  selector: 'sd-shell',
  imports: [ComingSoon],
  templateUrl: './system-design-shell.html',
  styleUrl: './system-design-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-look': 'paper', lang: 'en', dir: 'ltr' },
})
export class SystemDesignShell {
  protected readonly copy = SHELL_COPY;
}
