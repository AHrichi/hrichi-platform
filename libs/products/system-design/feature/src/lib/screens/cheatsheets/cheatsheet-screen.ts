import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  type CheatSection,
  findCheatsheet,
  findLesson,
  type ModuleId,
} from '@ah/products/system-design/domain';
import { SdCheatSection } from '@ah/products/system-design/ui';
import { map } from 'rxjs';
import { CHEATSHEET_COPY } from '../../copy/cheatsheet-copy';
import { SystemDesignStore } from '../../store/system-design.store';

/** A stable DOM id for a section, from its title. */
export function cheatSectionId(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `sd-cheat-${slug || 'section'}`;
}

/**
 * One module's cheatsheet (`cheatsheets/:module`), printable on A4: sections
 * drawn by kind, each `pattern` linking to its lesson.
 */
@Component({
  selector: 'sd-cheatsheet-screen',
  imports: [RouterLink, SdCheatSection],
  templateUrl: './cheatsheet-screen.html',
  styleUrl: './cheatsheet-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheatsheetScreen {
  protected readonly copy = CHEATSHEET_COPY;
  private readonly store = inject(SystemDesignStore);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  /** Links resolve against the shell route, as `SdNav` does. */
  protected readonly shellRoute = this.route.parent;

  private readonly moduleParam = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('module') ?? '')),
    { initialValue: '' },
  );

  protected readonly meta = computed(() =>
    findCheatsheet(this.moduleParam() as ModuleId),
  );

  protected readonly courseModule = computed(() => {
    const id = this.meta()?.module;
    return id ? this.store.curriculum().find((m) => m.id === id) : undefined;
  });

  protected readonly moduleLabel = computed(() => {
    const mod = this.courseModule();
    return mod ? `${String(mod.number).padStart(2, '0')}. ${mod.title}` : '';
  });

  protected readonly sheet = resource({
    params: () => this.meta(),
    loader: ({ params }) => params.load(),
  });

  protected readonly sections = computed(() =>
    (this.sheet.hasValue() ? this.sheet.value().sections : []).map(
      (section) => ({
        section,
        id: cheatSectionId(section.title),
        lesson: lessonLinkOf(section),
      }),
    ),
  );

  protected print(): void {
    this.document.defaultView?.print();
  }

  protected jump(event: Event, id: string): void {
    event.preventDefault();
    const target = this.document.getElementById(id);
    target?.scrollIntoView?.({ block: 'start' });
    target?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
}

function lessonLinkOf(
  section: CheatSection,
): { id: string; title: string } | null {
  if (section.kind !== 'pattern' || !section.lesson) return null;
  const lesson = findLesson(section.lesson);
  return lesson ? { id: lesson.id, title: lesson.title } : null;
}
