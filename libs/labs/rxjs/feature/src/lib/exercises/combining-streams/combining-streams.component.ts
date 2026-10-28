// src/app/exercises/combining-streams/combining-streams.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { Subject, Observable, merge, combineLatest } from 'rxjs';
import {
  switchMap,
  map,
  withLatestFrom,
  scan,
  startWith,
} from 'rxjs/operators';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

@Component({
  selector: 'app-combining-streams',
  standalone: true,
  imports: [UseCaseFocusComponent, AhButton, Tag, SectionHeading],
  templateUrl: './combining-streams.component.html',
  styleUrls: ['./combining-streams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombiningStreamsComponent {
  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Combining Operators' },
    { value: 'withLatestFrom', label: 'withLatestFrom' },
    { value: 'combineLatest', label: 'combineLatest' },
  ];
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
  latestSecondaryValue = signal<string | null>(null);
  outputValues = signal<string[]>([]);

  // --- Signals for UI state (combineLatest) ---
  latestSource1Value = signal<string | null>(null);
  latestSource2Value = signal<number | null>(null);
  combineLatestOutput = signal<string[]>([]);

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
    this.primarySource.next(value);
  }
  emitSecondary(value: string) {
    this.secondarySource.next(value);
  }
  resetWithLatestFrom() {
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
