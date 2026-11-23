import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  addDays,
  startOfWeek,
  todayOnFarm,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';

/** The week on screen, shared by the plan and the absences. */
@Component({
  selector: 'gh-week-nav',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let tp = t().plan;
    <p class="week">
      {{ i18n.fill(tp.week, { date: i18n.date(store.weekStart()) }) }}
    </p>
    <div class="buttons" role="group" [attr.aria-label]="tp.title">
      <button type="button" ghButton="secondary" (click)="shift(-1)">
        <span class="flip" aria-hidden="true">‹</span>
        {{ tp.previous }}
      </button>
      <button
        type="button"
        ghButton="secondary"
        [disabled]="isThisWeek()"
        (click)="thisWeek()"
      >
        {{ tp.thisWeek }}
      </button>
      <button type="button" ghButton="secondary" (click)="shift(1)">
        {{ tp.next }}
        <span class="flip" aria-hidden="true">›</span>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
      justify-items: start;
    }

    .week {
      margin: 0;
      color: var(--color-text-muted);
    }

    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    // Chevrons point back and forward in either reading direction.
    :host-context([dir='rtl']) .flip {
      display: inline-block;
      transform: scaleX(-1);
    }

    @media print {
      .buttons {
        display: none;
      }
    }
  `,
})
export class WeekNav {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;

  protected shift(weeks: number): void {
    void this.store.showWeek(addDays(this.store.weekStart(), 7 * weeks));
  }

  protected thisWeek(): void {
    void this.store.showWeek(todayOnFarm());
  }

  protected isThisWeek(): boolean {
    return this.store.weekStart() === startOfWeek(todayOnFarm());
  }
}
