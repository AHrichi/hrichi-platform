import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ah-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <h1>Page not found</h1>
      <p>
        That page doesn't exist. <a routerLink="/">Back to the home page</a>.
      </p>
    </section>
  `,
})
export class NotFound {}
