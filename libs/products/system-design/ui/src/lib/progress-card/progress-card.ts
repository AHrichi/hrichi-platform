import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import {
  type CourseModule,
  type CourseProgress,
  CURRICULUM,
  type Hue,
  type ModuleId,
} from '@ah/products/system-design/domain';
import { AhProgressBar } from '@ah/ui';

export type ProgressModuleInfo = Pick<
  CourseModule,
  'id' | 'number' | 'title' | 'hue'
>;

export interface ModuleProgressRow {
  id: ModuleId;
  code: string;
  title: string;
  hue: Hue;
  done: number;
  total: number;
}

/**
 * Sidebar course progress card (`sd-progress-card`).
 * Shows overall `"x / 44"` progress and expands to per-module bars using
 * `AhProgressBar` from `@ah/ui`.
 */
@Component({
  selector: 'sd-progress-card',
  imports: [AhProgressBar],
  templateUrl: './progress-card.html',
  styleUrl: './progress-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdProgressCard {
  readonly progress = input.required<CourseProgress>();
  readonly modules = input<readonly ProgressModuleInfo[]>(CURRICULUM);
  readonly expanded = model<boolean>(false);

  protected readonly rows = computed<readonly ModuleProgressRow[]>(() => {
    const counts = new Map(this.progress().modules.map((m) => [m.id, m]));
    return this.modules().map((mod) => {
      const c = counts.get(mod.id);
      const code = String(mod.number).padStart(2, '0');
      return {
        id: mod.id,
        code,
        title: mod.title,
        hue: mod.hue,
        done: c?.done ?? 0,
        total: c?.total ?? 0,
      };
    });
  });

  protected toggle(): void {
    this.expanded.update((v) => !v);
  }
}
