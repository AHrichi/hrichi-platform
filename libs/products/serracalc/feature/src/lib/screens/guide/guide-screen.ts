import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SerraI18n } from '../../i18n/serra-i18n';

/** What each tool does, what it assumes, and where its numbers come from. */
@Component({
  selector: 'sc-guide-screen',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="screen" aria-labelledby="sc-guide-title">
      <header class="head">
        <div>
          <h2 id="sc-guide-title">{{ t().guide.title }}</h2>
          <p>{{ t().guide.lead }}</p>
        </div>
      </header>
      <div class="tools">
        @for (tool of t().guide.tools; track tool.id) {
          <article class="panel">
            <h3>{{ tool.title }}</h3>
            <p>{{ tool.body }}</p>
            <a
              [routerLink]="['..', linkOf(tool.id).screen]"
              [queryParams]="linkOf(tool.id).query"
              >{{ t().guide.open }} {{ tool.title }} {{ t().common.next }}</a
            >
          </article>
        }
      </div>
      <section class="panel" aria-labelledby="sc-guide-sources">
        <h3 id="sc-guide-sources">{{ t().guide.sourcesTitle }}</h3>
        <ul>
          @for (source of t().guide.sources; track $index) {
            <li>{{ source }}</li>
          }
        </ul>
        <h3>{{ t().guide.limitsTitle }}</h3>
        <ul>
          @for (limit of t().guide.limits; track $index) {
            <li>{{ limit }}</li>
          }
        </ul>
      </section>
    </section>
  `,
  styleUrl: './guide-screen.scss',
})
export class GuideScreen {
  protected readonly t = inject(SerraI18n).t;

  /** Guide entries that open a tab of another screen. */
  protected linkOf(id: string): {
    screen: string;
    query: Record<string, string>;
  } {
    const tabs: Record<string, [string, string]> = {
      vpd: ['air', 'vpd'],
      fog: ['cooling', 'fog'],
    };
    const tab = tabs[id];
    return tab
      ? { screen: tab[0], query: { tab: tab[1] } }
      : { screen: id, query: {} };
  }
}
