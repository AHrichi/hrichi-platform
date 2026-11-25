import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhTabs, type AhTabItem } from '@ah/ui';
import {
  checkLogEntry,
  HYGIENE_ITEMS,
  heatStress,
  LOG_KINDS,
  type LogEntry,
  type LogKind,
  MAINTENANCE_TASKS,
  maintenanceStatus,
  WHO_CLASSES,
  type WhoClass,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { NoteList } from '../../ui/note-list/note-list';

type OpsTab = 'log' | 'hygiene' | 'maintenance' | 'heat';
const TABS: readonly OpsTab[] = ['log', 'hygiene', 'maintenance', 'heat'];

/** Today as yyyy-mm-dd, in the reader's time zone. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Operations: the crop log (scouting, releases, sprays, maintenance,
 * hygiene, harvest), the daily hygiene checklist, the maintenance
 * schedule and a heat-stress plan for the people working inside.
 */
@Component({
  selector: 'sc-operations-screen',
  imports: [AhTabs, NoteList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operations-screen.html',
  styleUrls: ['../calc-screen.scss', './operations-screen.scss'],
})
export class OperationsScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly kinds = LOG_KINDS;
  protected readonly whoClasses = WHO_CLASSES;
  protected readonly tasks = MAINTENANCE_TASKS;
  protected readonly hygieneItems = HYGIENE_ITEMS;
  protected readonly today = today();

  protected readonly tab = signal<OpsTab>('log');
  protected readonly tabs = computed<AhTabItem<OpsTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().ops.tabs[id] })),
  );

  protected readonly logs = computed(
    () => this.store.activeProject()?.logs ?? [],
  );
  protected readonly filter = signal<LogKind | 'all'>('all');
  protected readonly shown = computed(() =>
    [...this.logs()]
      .filter((l) => this.filter() === 'all' || l.kind === this.filter())
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
  );

  // The new entry's form.
  protected readonly date = signal(this.today);
  protected readonly kind = signal<LogKind>('scouting');
  protected readonly subject = signal('');
  protected readonly amount = signal<number | null>(null);
  protected readonly unit = signal('');
  protected readonly whoClass = signal<WhoClass>('III');
  protected readonly task = signal(MAINTENANCE_TASKS[0].id);
  protected readonly note = signal('');
  protected readonly problems = computed(() =>
    checkLogEntry({ kind: this.kind(), whoClass: this.whoClass() }),
  );
  protected readonly canAdd = computed(
    () =>
      !!this.store.activeProject() &&
      this.problems().length === 0 &&
      (this.subject().trim().length > 0 || this.kind() === 'maintenance'),
  );

  protected readonly schedule = computed(() =>
    maintenanceStatus(this.logs(), this.today),
  );
  protected readonly overdue = computed(
    () => this.schedule().filter((s) => s.state === 'overdue').length,
  );

  /** Hygiene: what is ticked today, and the last seven checklists. */
  protected readonly ticked = signal<ReadonlySet<string>>(new Set());
  protected readonly recentChecks = computed(() =>
    this.logs()
      .filter((l) => l.kind === 'hygiene')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7),
  );

  /** Heat stress from the latest reading, or numbers typed in. */
  private readonly latest = computed(() => {
    const readings = this.store.activeProject()?.readings ?? [];
    return [...readings]
      .reverse()
      .find((r) => r.airC !== undefined && r.rhPct !== undefined);
  });
  protected readonly heatAir = signal<number | null>(null);
  protected readonly heatRh = signal<number | null>(null);
  protected readonly air = computed(
    () => this.heatAir() ?? this.latest()?.airC ?? 32,
  );
  protected readonly rh = computed(
    () => this.heatRh() ?? this.latest()?.rhPct ?? 55,
  );
  protected readonly heat = computed(() => heatStress(this.air(), this.rh()));
  protected readonly bands = [
    { id: 'caution', from: 27 },
    { id: 'extremeCaution', from: 32 },
    { id: 'danger', from: 41 },
    { id: 'extremeDanger', from: 54 },
  ] as const;

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected number(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    const value = Number(raw);
    return raw === '' || !Number.isFinite(value) ? null : value;
  }

  protected async add(): Promise<void> {
    if (!this.canAdd()) return;
    const kind = this.kind();
    const entry: Omit<LogEntry, 'id'> = {
      date: this.date(),
      kind,
      subject:
        this.subject().trim() ||
        (kind === 'maintenance' ? this.taskName(this.task()) : ''),
      note: this.note().trim() || undefined,
      amount: this.amount() ?? undefined,
      unit: this.unit().trim() || undefined,
      whoClass: kind === 'spray' ? this.whoClass() : undefined,
      task: kind === 'maintenance' ? this.task() : undefined,
    };
    await this.store.addLog(entry);
    this.subject.set('');
    this.amount.set(null);
    this.unit.set('');
    this.note.set('');
  }

  protected remove(id: string): Promise<void> {
    return this.store.deleteLog(id);
  }

  protected toggleItem(id: string): void {
    this.ticked.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected async saveChecklist(): Promise<void> {
    await this.store.addLog({
      date: this.today,
      kind: 'hygiene',
      subject: this.t().ops.checklist,
      checked: [...this.ticked()],
    });
    this.ticked.set(new Set());
  }

  protected markDone(task: string): Promise<void> {
    return this.store.addLog({
      date: this.today,
      kind: 'maintenance',
      subject: this.taskName(task),
      task,
    });
  }

  protected taskName(id: string): string {
    return (this.t().ops.tasks as Record<string, string>)[id] ?? id;
  }

  protected itemName(id: string): string {
    return (this.t().ops.hygiene as Record<string, string>)[id] ?? id;
  }
}
