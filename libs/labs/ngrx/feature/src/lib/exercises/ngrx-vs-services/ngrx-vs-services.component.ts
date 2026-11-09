import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { AhButton, SectionHeading, Tag } from '@ah/ui';
import { injectNgrxLabCopy } from '../../i18n/ngrx-lab-copy';

export type PatternKey =
  | 'service-signals'
  | 'service-rxjs'
  | 'signal-store'
  | 'global-store';

export interface ArchitectureComparison {
  key: PatternKey;
  name: string;
  tagline: string;
  badge: 'simplest' | 'stream-heavy' | 'recommended' | 'enterprise';
  bundleWeight: string;
  reactivityModel: string;
  learningCurve: 'Gentle' | 'Moderate' | 'Steep';
  timeTravelSupport:
    | 'None'
    | 'Manual'
    | 'Custom Plugin'
    | 'Full Redux DevTools';
  whenToUse: string[];
  whenToAvoid: string[];
  codeSample: string;
}

@Component({
  selector: 'ah-ngrx-vs-services',
  imports: [SectionHeading, AhButton, Tag],
  templateUrl: './ngrx-vs-services.component.html',
  styleUrl: './ngrx-vs-services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgRxVsServicesComponent {
  private readonly labCopy = injectNgrxLabCopy();
  readonly copy = computed(() => this.labCopy().ngrxVsServices);

  readonly expandedFaqId = signal<string | null>('signals-vs-ngrx');

  toggleFaq(id: string): void {
    this.expandedFaqId.update((curr) => (curr === id ? null : id));
  }

  readonly interviewFaqs = computed(() => this.copy().interview.faqs);

  // Wizard state inputs
  readonly stateScope = signal<'local' | 'modular' | 'global'>('modular');
  readonly asyncComplexity = signal<'simple' | 'streams' | 'choreography'>(
    'simple',
  );
  readonly auditLevel = signal<'standard' | 'strict'>('standard');

  readonly selectedPatternKey = signal<PatternKey>('signal-store');

  readonly wizardRecommendation = computed(() => {
    const scope = this.stateScope();
    const asyncType = this.asyncComplexity();
    const audit = this.auditLevel();
    const recs = this.copy().advisor.recommendations;

    if (audit === 'strict' || asyncType === 'choreography') {
      return {
        winner: recs['global-store'].winner,
        patternKey: 'global-store' as PatternKey,
        rationale: recs['global-store'].rationale,
      };
    }

    if (scope === 'local' && asyncType === 'simple') {
      return {
        winner: recs['service-signals'].winner,
        patternKey: 'service-signals' as PatternKey,
        rationale: recs['service-signals'].rationale,
      };
    }

    if (asyncType === 'streams' && scope === 'local') {
      return {
        winner: recs['service-rxjs'].winner,
        patternKey: 'service-rxjs' as PatternKey,
        rationale: recs['service-rxjs'].rationale,
      };
    }

    return {
      winner: recs['signal-store'].winner,
      patternKey: 'signal-store' as PatternKey,
      rationale: recs['signal-store'].rationale,
    };
  });

  readonly patterns = computed(() => this.copy().patterns);

  selectPattern(key: PatternKey): void {
    this.selectedPatternKey.set(key);
  }

  currentPattern = computed(() => {
    return this.patterns().find((p) => p.key === this.selectedPatternKey());
  });
}
