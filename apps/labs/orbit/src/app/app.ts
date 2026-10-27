import { Component } from '@angular/core';
import { LabFrame } from '@ah/platform/federation';
import { labs } from '@ah/shared/content';

/** Standalone mode: the same frame the shell draws around this remote. */
@Component({
  imports: [LabFrame],
  selector: 'ah-root',
  template: `
    <ah-lab-frame
      [eyebrow]="intro.eyebrow"
      [heading]="intro.heading"
      [lead]="intro.lead"
    />
  `,
})
export class App {
  protected readonly intro = labs['lab-orbit'];
}
