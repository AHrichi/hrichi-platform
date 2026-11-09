// src/app/exercises/combining-streams/combining-streams.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { Subject, Observable, combineLatest } from 'rxjs';
import { withLatestFrom, scan } from 'rxjs/operators';
import {
  AhButton,
  AhCodeBlock,
  AhMarbleDiagram,
  type AhMarbleItem,
  type AhOperatorTransform,
  type AhStreamLane,
  SectionHeading,
  SegmentedOption,
  Tag,
} from '@ah/ui';
import { injectRxjsLabCopy } from '../../i18n/rxjs-lab-copy';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

@Component({
  selector: 'app-combining-streams',
  standalone: true,
  imports: [
    UseCaseFocusComponent,
    AhButton,
    Tag,
    SectionHeading,
    AhMarbleDiagram,
    AhCodeBlock,
  ],
  templateUrl: './combining-streams.component.html',
  styleUrls: ['./combining-streams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombiningStreamsComponent {
  readonly copy = injectRxjsLabCopy();

  // --- Focus View Options ---
  readonly focusOptions = computed<readonly SegmentedOption<string>[]>(() => {
    const opts = this.copy().combiningStreams.focusOptions;
    return [
      { value: 'all', label: opts.all },
      { value: 'withLatestFrom', label: opts.withLatestFrom },
      { value: 'combineLatest', label: opts.combineLatest },
    ];
  });
  readonly activeCase = signal<string>('all');

  // --- Code Snippets & Visibility ---
  readonly showCode = signal<Record<string, boolean>>({
    withLatestFrom: false,
    combineLatest: false,
    comparison: true,
  });

  readonly codeSnippets = {
    withLatestFrom: `// 🎯 withLatestFrom: Triggered ONLY by primary stream
saveButtonClick$.pipe(
  withLatestFrom(this.formValues$, this.currentUser$),
  switchMap(([click, form, user]) => 
    this.api.saveDocument({ ...form, userId: user.id })
  )
);`,
    combineLatest: `// 🔀 combineLatest: Re-emits whenever ANY source emits
// (Requires every source to have emitted at least once!)
combineLatest([
  searchQuery$,
  filterCategory$,
  sortBy$,
]).pipe(
  switchMap(([query, category, sort]) =>
    this.catalogService.query({ query, category, sort })
  )
);`,
    comparison: `// 📊 Quick Decision Guide:
// 1. combineLatest([A$, B$]): Both are equals. Emits when A OR B emits.
// 2. A$.pipe(withLatestFrom(B$)): A is master. Emits ONLY when A emits, reading B's latest snapshot.
// 3. forkJoin([A$, B$]): Waits for both A and B to COMPLETE. Emits once with final values.
// 4. zip([A$, B$]): Pairs emissions 1-to-1 in strict lockstep (1st with 1st, 2nd with 2nd).`,
  };

  toggleCode(key: string) {
    this.showCode.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // --- Subjects for withLatestFrom ---
  private primarySource = new Subject<string>();
  private secondarySource = new Subject<string>();

  // --- Subjects for combineLatest ---
  private source1 = new Subject<string>();
  private source2 = new Subject<number>();

  // --- Signals for UI state (withLatestFrom) ---
  readonly primaryEmissions = signal<string[]>([]);
  readonly latestSecondaryValue = signal<string | null>(null);
  readonly outputValues = signal<string[]>([]);

  // --- Signals for UI state (combineLatest) ---
  readonly latestSource1Value = signal<string | null>(null);
  readonly latestSource2Value = signal<number | null>(null);
  readonly combineLatestOutput = signal<string[]>([]);

  // --- Observables (withLatestFrom) ---
  primary$: Observable<string> = this.primarySource.asObservable();
  secondary$: Observable<string> = this.secondarySource.asObservable();

  // --- Observables (combineLatest) ---
  source1$: Observable<string> = this.source1.asObservable();
  source2$: Observable<number> = this.source2.asObservable();

  // --- Combined Stream with withLatestFrom ---
  combinedWithLatestFrom$: Observable<[string, string]> = this.primary$.pipe(
    withLatestFrom(this.secondary$),
  );

  // --- Combined Stream with combineLatest ---
  combinedLatest$: Observable<[string, number]> = combineLatest([
    this.source1$,
    this.source2$,
  ]);

  readonly withLatestFromLanes = computed<readonly AhStreamLane[]>(() => {
    const primaryMarbles: AhMarbleItem[] = this.primaryEmissions().map(
      (val, idx) => ({
        id: `wlf-p-${idx}-${val}`,
        value: val,
        positionPercent: Math.min(15 + idx * 18, 92),
        variant: 'data-1',
        tooltip: `Primary trigger emission: "${val}"`,
      }),
    );

    const secondaryVal = this.latestSecondaryValue();
    const secondaryMarbles: AhMarbleItem[] = secondaryVal
      ? [
          {
            id: `wlf-s-${secondaryVal}`,
            value: secondaryVal,
            positionPercent: 50,
            variant: 'data-2',
            tooltip: `Latest sampled secondary value: "${secondaryVal}"`,
          },
        ]
      : [];

    const outputMarbles: AhMarbleItem[] = this.outputValues().map(
      (val, idx) => ({
        id: `wlf-out-${idx}`,
        value: val.replace(
          /Primary:\s*"([^"]+)",\s*Latest Secondary:\s*"([^"]+)"/,
          '$1+$2',
        ),
        positionPercent: Math.min(22 + idx * 18, 94),
        variant: 'accent',
        tooltip: val,
      }),
    );

    const c = this.copy().combiningStreams.withLatestFrom;
    return [
      {
        id: 'primary',
        label: c.primaryLaneLabel,
        badge: c.primaryLaneBadge,
        marbles: primaryMarbles,
      },
      {
        id: 'secondary',
        label: c.secondaryLaneLabel,
        badge: c.secondaryLaneBadge,
        marbles: secondaryMarbles,
      },
      {
        id: 'output',
        label: c.outputLaneLabel,
        badge: c.outputLaneBadge,
        isPrimary: true,
        marbles: outputMarbles,
      },
    ];
  });

  readonly withLatestFromOperator = computed<AhOperatorTransform>(() => ({
    name: 'withLatestFrom(secondary$)',
    description: this.copy().combiningStreams.withLatestFrom.operatorDescription,
    formula: 'output = [primary, latest secondary]',
  }));

  readonly combineLatestLanes = computed<readonly AhStreamLane[]>(() => {
    const s1Val = this.latestSource1Value();
    const s2Val = this.latestSource2Value();

    const s1Marbles: AhMarbleItem[] = s1Val
      ? [
          {
            id: `cl-s1-${s1Val}`,
            value: s1Val,
            positionPercent: 35,
            variant: 'data-1',
            tooltip: `Source 1 (Strings): "${s1Val}"`,
          },
        ]
      : [];

    const s2Marbles: AhMarbleItem[] =
      s2Val !== null
        ? [
            {
              id: `cl-s2-${s2Val}`,
              value: s2Val,
              positionPercent: 65,
              variant: 'data-2',
              tooltip: `Source 2 (Numbers): ${s2Val}`,
            },
          ]
        : [];

    const outMarbles: AhMarbleItem[] = this.combineLatestOutput().map(
      (val, idx) => ({
        id: `cl-out-${idx}`,
        value: val.replace(/[[\]\s]/g, ''),
        positionPercent: Math.min(20 + idx * 16, 94),
        variant: 'accent',
        tooltip: `Democratic emission: ${val}`,
      }),
    );

    const c = this.copy().combiningStreams.combineLatest;
    return [
      {
        id: 'source-1',
        label: c.source1LaneLabel,
        badge: c.source1LaneBadge,
        marbles: s1Marbles,
      },
      {
        id: 'source-2',
        label: c.source2LaneLabel,
        badge: c.source2LaneBadge,
        marbles: s2Marbles,
      },
      {
        id: 'combined-output',
        label: c.outputLaneLabel,
        badge: c.outputLaneBadge,
        isPrimary: true,
        marbles: outMarbles,
      },
    ];
  });

  readonly combineLatestOperator = computed<AhOperatorTransform>(() => ({
    name: 'combineLatest([source1$, source2$])',
    description: this.copy().combiningStreams.combineLatest.operatorDescription,
    formula: 'output = [latest A, latest B]',
  }));

  constructor() {
    // Subscription for withLatestFrom example
    this.secondary$.subscribe((value) => this.latestSecondaryValue.set(value));
    this.combinedWithLatestFrom$
      .pipe(
        scan(
          (acc, [primary, secondary]) => [
            ...acc,
            `Primary: "${primary}", Latest Secondary: "${secondary}"`,
          ],
          [] as string[],
        ),
      )
      .subscribe((values) => this.outputValues.set(values));

    // Subscriptions for combineLatest example
    this.source1$.subscribe((value) => this.latestSource1Value.set(value));
    this.source2$.subscribe((value) => this.latestSource2Value.set(value));
    this.combinedLatest$
      .pipe(
        scan(
          (acc, [val1, val2]) => [...acc, `[${val1}, ${val2}]`],
          [] as string[],
        ),
      )
      .subscribe((values) => this.combineLatestOutput.set(values));
  }

  // --- Methods for withLatestFrom ---
  emitPrimary(value: string) {
    this.primaryEmissions.update((list) => [...list, value]);
    this.primarySource.next(value);
  }
  emitSecondary(value: string) {
    this.secondarySource.next(value);
  }
  resetWithLatestFrom() {
    this.primaryEmissions.set([]);
    this.latestSecondaryValue.set(null);
    this.outputValues.set([]);
  }

  // --- Methods for combineLatest ---
  emitSource1(value: string) {
    this.source1.next(value);
  }
  emitSource2(value: number) {
    this.source2.next(value);
  }
  resetCombineLatest() {
    this.latestSource1Value.set(null);
    this.latestSource2Value.set(null);
    this.combineLatestOutput.set([]);
  }
}
