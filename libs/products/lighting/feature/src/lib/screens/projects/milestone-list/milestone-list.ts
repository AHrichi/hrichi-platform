import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhButton, AhModal } from '@ah/ui';
import type { MilestoneItem } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../../i18n/luxpath-i18n';
import {
  downloadMilestoneIcs,
  emailMilestone,
} from '../../../services/reminders';
import { LightingStore } from '../../../store/lighting.store';

type Category = MilestoneItem['category'];

const CATEGORIES: readonly Category[] = [
  'excavation',
  'foundation_curing',
  'erection',
  'cabling',
  'commissioning',
  'inspection',
  'battery_audit',
];

/** The site plan: tick off milestones, edit them, send them to a calendar or by email. */
@Component({
  selector: 'lp-milestone-list',
  imports: [AhButton, AhModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './milestone-list.html',
  styleUrl: './milestone-list.scss',
})
export class MilestoneList {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly categories = CATEGORIES;

  protected readonly milestones = computed(() =>
    [...(this.store.activeProject()?.milestones ?? [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  );
  private readonly today = new Date().toISOString().slice(0, 10);

  protected readonly draft = signal<MilestoneItem | null>(null);
  protected readonly isNew = signal(false);

  protected isLate(milestone: MilestoneItem): boolean {
    return !milestone.completed && milestone.date < this.today;
  }

  protected add(): void {
    const project = this.store.activeProject();
    if (!project) return;
    this.isNew.set(true);
    this.draft.set({
      id: '',
      projectId: project.id,
      title: '',
      date: this.today,
      category: 'inspection',
      completed: false,
      notes: '',
    });
  }

  protected edit(milestone: MilestoneItem): void {
    this.isNew.set(false);
    this.draft.set({ ...milestone });
  }

  protected patch(change: Partial<MilestoneItem>): void {
    const draft = this.draft();
    if (draft) this.draft.set({ ...draft, ...change });
  }

  protected async saveDraft(): Promise<void> {
    const draft = this.draft();
    if (!draft || !draft.title.trim() || !draft.date) return;
    if (this.isNew()) {
      await this.store.addMilestone(draft);
    } else {
      await this.store.updateMilestone(draft);
    }
    this.draft.set(null);
  }

  protected async remove(): Promise<void> {
    const draft = this.draft();
    if (draft?.id) await this.store.deleteMilestone(draft.id);
    this.draft.set(null);
  }

  protected toCalendar(milestone: MilestoneItem): void {
    const project = this.store.activeProject();
    if (project) downloadMilestoneIcs(project, milestone, this.t().reminder);
  }

  protected toEmail(milestone: MilestoneItem): void {
    const project = this.store.activeProject();
    if (project) emailMilestone(project, milestone, this.t().reminder);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
