import { Injectable, signal } from '@angular/core';

const KEY = 'serracalc.folded';

/**
 * Which sections are folded, by section id, kept on this device so a screen
 * opens the way it was left.
 */
@Injectable({ providedIn: 'root' })
export class PanelState {
  private readonly folded = signal<ReadonlySet<string>>(read());

  isFolded(id: string): boolean {
    return this.folded().has(id);
  }

  setFolded(id: string, folded: boolean): void {
    const next = new Set(this.folded());
    if (folded) next.add(id);
    else next.delete(id);
    this.folded.set(next);
    write(next);
  }

  /** Unfold a section, e.g. when a link points into it. */
  unfold(id: string): void {
    if (this.isFolded(id)) this.setFolded(id, false);
  }

  /** Fold or unfold many at once (a page's "Fold all"). */
  setAll(ids: readonly string[], folded: boolean): void {
    const next = new Set(this.folded());
    for (const id of ids) {
      if (folded) next.add(id);
      else next.delete(id);
    }
    this.folded.set(next);
    write(next);
  }
}

function read(): ReadonlySet<string> {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
}

function write(ids: ReadonlySet<string>): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode or full storage: folding still works for this visit.
  }
}
