import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComingSoon } from '@ah/products/system-design/ui';
import { SHELL_COPY } from '../copy/shell-copy';

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
