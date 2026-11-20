import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CHEATSHEETS } from '@ah/products/system-design/domain';
import { CHEATSHEET_COPY } from '../../copy/cheatsheet-copy';
import { SystemDesignStore } from '../../store/system-design.store';

/** Cheatsheet index (`cheatsheets`): one card per module. */
@Component({
  selector: 'sd-cheatsheet-index',
  imports: [RouterLink],
  templateUrl: './cheatsheet-index.html',
  styleUrl: './cheatsheet-index.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheatsheetIndex {
  protected readonly copy = CHEATSHEET_COPY;
  private readonly store = inject(SystemDesignStore);
  /** Links resolve against the shell route, as `SdNav` does. */
  protected readonly shellRoute = inject(ActivatedRoute).parent;

  protected readonly cards = computed(() =>
    this.store.curriculum().flatMap((mod) => {
      const meta = CHEATSHEETS.find((c) => c.module === mod.id);
      if (!meta) return [];
      return [
        {
          module: mod.id,
          number: String(mod.number).padStart(2, '0'),
          moduleTitle: mod.title,
          hue: mod.hue,
          title: meta.title,
          summary: meta.summary,
          lessons: mod.lessons.length,
        },
      ];
    }),
  );
}
