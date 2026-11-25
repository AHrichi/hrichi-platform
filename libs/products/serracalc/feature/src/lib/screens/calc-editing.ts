import { computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { CalcKind, SavedCalculation } from '@ah/products/serracalc/domain';
import type { SaveRequest } from '../ui/save-bar/save-bar';
import { SerraStore } from '../store/serra.store';

/**
 * A calculator screen's tabs and its saved-result editing, kept in the URL
 * (`?tab=…&edit=…`) so "Open & edit" in Projects lands on the right tool
 * with the saved inputs loaded. Call in a component's injection context.
 */
export function injectCalcEditing<T extends string>(options: {
  tabs: readonly T[];
  kinds: Record<T, CalcKind>;
  /** Puts a saved result's inputs back into the screen. */
  load: (saved: SavedCalculation) => void;
}) {
  const store = inject(SerraStore);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const query = toSignal(route.queryParamMap);
  const tab = signal<T>(options.tabs[0]);
  const editing = signal<SavedCalculation | null>(null);
  let loadedId: string | null = null;

  const isTab = (value: string | null): value is T =>
    options.tabs.includes(value as T);

  effect(() => {
    const params = query();
    const wanted = params?.get('tab') ?? null;
    const editId = params?.get('edit') ?? null;
    const saved = store.calculations().find((c) => c.id === editId);
    untracked(() => {
      if (isTab(wanted)) tab.set(wanted);
      if (saved && saved.id !== loadedId) {
        loadedId = saved.id;
        options.load(saved);
        editing.set(saved);
        // The tab the link asked for, if it holds this kind; else the first.
        const owner =
          isTab(wanted) && options.kinds[wanted] === saved.kind
            ? wanted
            : options.tabs.find((t) => options.kinds[t] === saved.kind);
        if (owner) tab.set(owner);
      }
    });
  });

  function navigate(queryParams: Record<string, string>): void {
    void router.navigate([], {
      relativeTo: route,
      queryParams,
      replaceUrl: true,
    });
  }

  return {
    tab,
    editing,
    /** The saved result's name while it belongs to the open tab. */
    editingLabel: computed(() => {
      const saved = editing();
      return saved && saved.kind === options.kinds[tab()] ? saved.label : null;
    }),
    select(next: T): void {
      tab.set(next);
      const saved = editing();
      navigate(
        saved && saved.kind === options.kinds[next]
          ? { tab: next, edit: saved.id }
          : { tab: next },
      );
    },
    async save(inputs: unknown, request: SaveRequest): Promise<void> {
      const kind = options.kinds[tab()];
      const current = editing();
      const id =
        request.replace && current?.kind === kind ? current.id : undefined;
      const savedId = await store.saveCalculation({
        id,
        kind,
        label: request.label,
        inputs,
      } as Parameters<typeof store.saveCalculation>[0]);
      loadedId = savedId;
      editing.set(store.calculations().find((c) => c.id === savedId) ?? null);
      navigate({ tab: tab(), edit: savedId });
    },
    stop(): void {
      editing.set(null);
      loadedId = null;
      navigate({ tab: tab() });
    },
  };
}
