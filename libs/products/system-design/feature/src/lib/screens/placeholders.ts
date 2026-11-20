import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ComingSoon } from '@ah/products/system-design/ui';
import { SHELL_COPY } from '../copy/shell-copy';
import { SystemDesignStore } from '../store/system-design.store';

@Component({
  selector: 'sd-practice-placeholder',
  imports: [ComingSoon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-coming-soon
      [heading]="copy.placeholders.practiceHeading"
      [body]="copy.placeholders.practiceBody"
    />
  `,
})
export class PracticePlaceholderScreen {
  protected readonly copy = SHELL_COPY;
}

@Component({
  selector: 'sd-lab-placeholder',
  imports: [ComingSoon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-coming-soon
      [heading]="copy.placeholders.labHeading"
      [body]="copy.placeholders.labBody"
    />
  `,
})
export class LabPlaceholderScreen {
  protected readonly copy = SHELL_COPY;
}

@Component({
  selector: 'sd-cheatsheets-placeholder',
  imports: [ComingSoon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-coming-soon
      [heading]="copy.placeholders.cheatsheetsHeading"
      [body]="copy.placeholders.cheatsheetsBody"
    />
  `,
})
export class CheatsheetsPlaceholderScreen {
  protected readonly copy = SHELL_COPY;
  protected readonly store = inject(SystemDesignStore);
}
