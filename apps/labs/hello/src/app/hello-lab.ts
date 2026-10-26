import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { remoteMeta } from './remote.meta';

/** M0 spike page: proves a remote renders and stays reactive inside a zoneless shell. */
@Component({
  selector: 'ah-hello-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hello-lab">
      <p class="eyebrow">Remote · {{ meta.id }} v{{ meta.version }}</p>
      <h1>Hello from a federated remote</h1>
      <p>
        This page is built and deployed separately from the shell and loaded at
        runtime through Native Federation. No zone.js: the counter below updates
        through signals only.
      </p>
      <button type="button" (click)="increment()">
        Clicked {{ count() }} times
      </button>
      <p class="derived">
        Doubled with <code>computed()</code>: {{ doubled() }}
      </p>
    </section>
  `,
  styles: `
    .hello-lab {
      max-inline-size: 40rem;
      margin-inline: auto;
      padding-block: 3rem;
    }
    .eyebrow {
      font-size: 0.875rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.7;
    }
    button {
      font: inherit;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      cursor: pointer;
    }
  `,
})
export class HelloLab {
  protected readonly meta = remoteMeta;
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);

  protected increment(): void {
    this.count.update((value) => value + 1);
  }
}
