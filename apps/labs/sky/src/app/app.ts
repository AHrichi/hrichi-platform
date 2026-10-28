import { Component } from '@angular/core';
import { LabFrame } from '@ah/platform/federation';
import { labs } from '@ah/shared/content';

/** Standalone mode: the same frame the shell draws around this remote. */
@Component({
  imports: [LabFrame],
  selector: 'ah-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly intro = labs['lab-sky'];
}
