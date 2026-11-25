import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { climateById } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';

/**
 * Says where a calculator's starting numbers came from (the active project,
 * or the example house) and puts them back on request.
 */
@Component({
  selector: 'sc-context-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="from">
      <span class="label">{{ t().context.from }}</span>
      <strong>{{ source() }}</strong>
      <span class="detail">{{ detail() }}</span>
    </p>
    <button type="button" class="reset" (click)="resetInputs.emit()">
      ↺ {{ t().context.reset }}
    </button>
  `,
  styleUrl: './context-bar.scss',
})
export class ContextBar {
  readonly resetInputs = output<void>();
  private readonly store = inject(SerraStore);
  private readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly source = computed(
    () => this.store.activeProject()?.title ?? this.t().context.defaultHouse,
  );

  protected readonly detail = computed(() => {
    const project = this.store.activeProject();
    if (!project) return '';
    return `${climateById(project.climateId).name} · ${this.t().crops[project.crop]}`;
  });
}
