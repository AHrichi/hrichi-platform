import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Placeholder home for the M0 spike; real content arrives in M1. */
@Component({
  selector: 'ah-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <p class="eyebrow">Angular &amp; Full-Stack Developer</p>
      <h1>Ahmed Hrichi</h1>
      <p>
        I build Angular platforms that scale: micro-frontends, Nx monorepos, 3D
        product experiences and the NestJS services behind them. This site is
        one of those platforms.
      </p>
      <a routerLink="/labs/hello">Open the first micro-frontend</a>
    </section>
  `,
})
export class Home {}
