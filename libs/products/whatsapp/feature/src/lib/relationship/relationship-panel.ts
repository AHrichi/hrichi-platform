import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CheckInReason,
  CyclePhase,
  formatDurationCompact,
} from '@ah/products/whatsapp/domain';
import { AhAlert, AhBadge, AhButton } from '@ah/ui';
import { WhatsAppStore } from '../whatsapp.store';

const REASON_TEXT: Record<CheckInReason, string> = {
  lower_tone: 'a lower tone than usual',
  slower_replies: 'slower replies',
  shorter_messages: 'shorter messages',
  fewer_messages: 'fewer messages',
};

const CHART = { width: 720, height: 200, padX: 8, padY: 14 } as const;
const CHART_DAYS = 120;

interface ChartLine {
  sender: string;
  color: string;
  path: string;
}

interface ChartBand {
  x: number;
  width: number;
  phase: CyclePhase;
}

@Component({
  selector: 'ah-whatsapp-relationship-panel',
  standalone: true,
  imports: [FormsModule, AhAlert, AhBadge, AhButton],
  templateUrl: './relationship-panel.html',
  styleUrl: './relationship-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppRelationshipPanel {
  protected readonly store = inject(WhatsAppStore);
  protected readonly chart = CHART;
  protected readonly formatDuration = formatDurationCompact;

  // Cycle calendar setup and entry form
  protected readonly partnerName = signal('');
  protected readonly consentChecked = signal(false);
  protected readonly newStart = signal('');
  protected readonly newEnd = signal('');
  protected readonly formError = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);

  protected readonly participants = computed(
    () => this.store.report()?.participants ?? [],
  );

  protected readonly checkIns = computed(() =>
    (this.store.wellbeing()?.checkInWindows ?? []).slice(0, 6).map((w) => ({
      ...w,
      reasonText: w.reasons.map((r) => REASON_TEXT[r]).join(', '),
    })),
  );

  protected readonly crisis = computed(
    () => this.store.wellbeing()?.crisisSignal ?? null,
  );

  /** The last CHART_DAYS chat days, shared by every line and the cycle bands. */
  private readonly chartDates = computed(() => {
    const series = this.store.wellbeing()?.series ?? [];
    const all = new Set(series.flatMap((s) => s.points.map((p) => p.date)));
    return Array.from(all).sort().slice(-CHART_DAYS);
  });

  private xFor(i: number, n: number): number {
    const inner = CHART.width - CHART.padX * 2;
    return CHART.padX + (n <= 1 ? inner / 2 : (i / (n - 1)) * inner);
  }

  private yFor(tone: number): number {
    const inner = CHART.height - CHART.padY * 2;
    return CHART.padY + ((1 - tone) / 2) * inner;
  }

  protected readonly zeroY = this.yFor(0);

  protected readonly chartLines = computed<ChartLine[]>(() => {
    const dates = this.chartDates();
    const index = new Map(dates.map((d, i) => [d, i]));
    const colors = new Map(
      this.participants().map((p) => [p.name, p.accentColor]),
    );
    return (this.store.wellbeing()?.series ?? []).map((s) => {
      // 3-day rolling mean keeps single sarcastic messages from spiking the line.
      const pts = s.points.filter((p) => index.has(p.date));
      const cmds = pts.map((p, i) => {
        const win = pts.slice(Math.max(0, i - 2), i + 1);
        const tone = win.reduce((a, b) => a + b.netTone, 0) / win.length;
        const x = this.xFor(index.get(p.date) ?? 0, dates.length);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${this.yFor(tone).toFixed(1)}`;
      });
      return {
        sender: s.sender,
        color: colors.get(s.sender) ?? 'currentColor',
        path: cmds.join(' '),
      };
    });
  });

  protected readonly chartBands = computed<ChartBand[]>(() => {
    const phases = this.store.cyclePhaseByDate();
    const dates = this.chartDates();
    if (dates.length === 0) return [];
    const step = (CHART.width - CHART.padX * 2) / Math.max(1, dates.length - 1);
    return dates
      .map((d, i) => ({ d, i, phase: phases[d] ?? 'other' }))
      .filter((b) => b.phase !== 'other')
      .map((b) => ({
        x: this.xFor(b.i, dates.length) - step / 2,
        width: step,
        phase: b.phase,
      }));
  });

  protected readonly chartRange = computed(() => {
    const d = this.chartDates();
    return d.length ? `${d[0]} → ${d[d.length - 1]}` : '';
  });

  /** Communication balance cards, reusing the participant analytics. */
  protected readonly balance = computed(() =>
    this.participants().map((p) => ({
      name: p.name,
      color: p.accentColor,
      share: p.messageSharePct,
      initiation: p.initiationSharePct,
      reply: p.medianReplySeconds,
      questions: p.questionCount,
      peak: p.chronotypeLabel,
    })),
  );

  protected readonly sortedPeriods = computed(() =>
    [...(this.store.cycleProfile()?.periods ?? [])].reverse(),
  );

  protected async startCalendar(): Promise<void> {
    this.formError.set(null);
    if (!this.consentChecked()) {
      this.formError.set('Tick the agreement box first.');
      return;
    }
    if (!this.partnerName().trim()) {
      this.formError.set('Add her name.');
      return;
    }
    const ok = await this.store.createCycleProfile(
      this.partnerName(),
      this.consentChecked(),
    );
    if (!ok) {
      this.formError.set('Could not save. Is this chat saved in the vault?');
    }
  }

  protected async addPeriod(): Promise<void> {
    this.formError.set(null);
    const start = this.newStart();
    const end = this.newEnd();
    if (!start) {
      this.formError.set('Pick a start date.');
      return;
    }
    if (end && end < start) {
      this.formError.set('The end date is before the start date.');
      return;
    }
    if (await this.store.addCyclePeriod(end ? { start, end } : { start })) {
      this.newStart.set('');
      this.newEnd.set('');
    }
  }

  protected async deleteCalendar(): Promise<void> {
    await this.store.deleteCycleProfile();
    this.confirmDelete.set(false);
    this.consentChecked.set(false);
    this.partnerName.set('');
  }

  protected phaseLabel(phase: CyclePhase): string {
    return phase === 'period'
      ? 'Period (entered)'
      : phase === 'predicted_period'
        ? 'Predicted period'
        : 'Premenstrual window';
  }
}
