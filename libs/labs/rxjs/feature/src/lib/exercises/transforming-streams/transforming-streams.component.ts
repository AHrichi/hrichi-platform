// src/app/exercises/transforming-streams/transforming-streams.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  WritableSignal,
} from '@angular/core';

import { Subject, Observable, timer, interval, Subscription } from 'rxjs';
import {
  map,
  take,
  tap,
  concatMap,
  switchMap,
  mergeMap,
  exhaustMap,
  finalize,
} from 'rxjs/operators';
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

// --- Interfaces for Visualization ---
interface Marble {
  id: number;
  value: string;
  color: string;
}

interface InnerStream {
  id: number;
  clickIndex: number;
  color: string;
  marbles: Marble[];
  status: 'active' | 'completed' | 'cancelled';
}

interface StreamLog {
  time: string;
  message: string;
  color: string;
}

type OperatorType = 'concatMap' | 'switchMap' | 'mergeMap' | 'exhaustMap';

interface SignalMap {
  SourceMarbles: WritableSignal<Marble[]>;
  InnerStreams: WritableSignal<InnerStream[]>;
  OutputMarbles: WritableSignal<Marble[]>;
  AllOutputMarbles: WritableSignal<Marble[]>;
  Logs: WritableSignal<StreamLog[]>;
}

@Component({
  selector: 'app-transforming-streams',
  standalone: true,
  imports: [
    UseCaseFocusComponent,
    AhButton,
    Tag,
    SectionHeading,
    AhMarbleDiagram,
    AhCodeBlock,
  ],
  templateUrl: './transforming-streams.component.html',
  styleUrls: ['./transforming-streams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformingStreamsComponent {
  readonly copy = injectRxjsLabCopy();

  // --- Focus View Options ---
  readonly focusOptions = computed<readonly SegmentedOption<string>[]>(() => {
    const opts = this.copy().transformingStreams.focusOptions;
    return [
      { value: 'all', label: opts.all },
      { value: 'concatMap', label: opts.concatMap },
      { value: 'switchMap', label: opts.switchMap },
      { value: 'mergeMap', label: opts.mergeMap },
      { value: 'exhaustMap', label: opts.exhaustMap },
    ];
  });
  readonly activeCase = signal<string>('all');

  // --- Source for all strategies ---
  private source = new Subject<{ clickIndex: number; color: string }>();
  private sourceSubscription: Subscription | null = null;

  // --- Signals for UI Configuration ---
  sourceEmissions = signal(3);
  sourceInterval = signal(1000);
  innerValues = signal(4);
  innerInterval = signal(700);
  isEmitting = signal(false);

  // --- Signals for UI State ---
  // concatMap
  concatMapSourceMarbles = signal<Marble[]>([]);
  concatMapInnerStreams = signal<InnerStream[]>([]);
  concatMapOutputMarbles = signal<Marble[]>([]);
  concatMapAllOutputMarbles = signal<Marble[]>([]);
  concatMapLogs = signal<StreamLog[]>([]);
  showConcatMapCode = signal(false);

  // switchMap
  switchMapSourceMarbles = signal<Marble[]>([]);
  switchMapInnerStreams = signal<InnerStream[]>([]);
  switchMapOutputMarbles = signal<Marble[]>([]);
  switchMapAllOutputMarbles = signal<Marble[]>([]);
  switchMapLogs = signal<StreamLog[]>([]);
  showSwitchMapCode = signal(false);

  // mergeMap
  mergeMapSourceMarbles = signal<Marble[]>([]);
  mergeMapInnerStreams = signal<InnerStream[]>([]);
  mergeMapOutputMarbles = signal<Marble[]>([]);
  mergeMapAllOutputMarbles = signal<Marble[]>([]);
  mergeMapLogs = signal<StreamLog[]>([]);
  showMergeMapCode = signal(false);

  // exhaustMap
  exhaustMapSourceMarbles = signal<Marble[]>([]);
  exhaustMapInnerStreams = signal<InnerStream[]>([]);
  exhaustMapOutputMarbles = signal<Marble[]>([]);
  exhaustMapAllOutputMarbles = signal<Marble[]>([]);
  exhaustMapLogs = signal<StreamLog[]>([]);
  showExhaustMapCode = signal(false);

  // --- Computed Stream Lanes for Marble Diagrams ---
  readonly concatMapLanes = computed<readonly AhStreamLane[]>(() => {
    const t = this.copy().transformingStreams;
    const src: AhMarbleItem[] = this.concatMapSourceMarbles().map((m, idx) => ({
      id: `concat-src-${m.id}`,
      value: m.value,
      positionPercent: Math.min(15 + idx * 25, 90),
      variant: 'data-1',
      tooltip: `Source emission #${m.value}`,
    }));
    const out: AhMarbleItem[] = this.concatMapAllOutputMarbles().map(
      (m, idx) => ({
        id: `concat-out-${m.id}`,
        value: m.value.includes('Val')
          ? m.value.split('Val')[1].trim()
          : m.value,
        positionPercent: Math.min(10 + idx * 10, 94),
        variant: 'accent',
        tooltip: `Sequential output: ${m.value}`,
      }),
    );
    return [
      {
        id: 'src',
        label: t.sourceStreamLabel,
        badge: t.triggersBadge,
        marbles: src,
      },
      {
        id: 'out',
        label: t.concatMap.outLaneLabel,
        badge: t.concatMap.outLaneBadge,
        isPrimary: true,
        marbles: out,
      },
    ];
  });

  readonly concatMapOperator = computed<AhOperatorTransform>(() => ({
    name: 'concatMap(val => inner$)',
    description: this.copy().transformingStreams.concatMap.operatorDescription,
    formula: 'Stream(n) waits for Stream(n-1) to complete',
  }));

  readonly switchMapLanes = computed<readonly AhStreamLane[]>(() => {
    const t = this.copy().transformingStreams;
    const src: AhMarbleItem[] = this.switchMapSourceMarbles().map((m, idx) => ({
      id: `switch-src-${m.id}`,
      value: m.value,
      positionPercent: Math.min(15 + idx * 25, 90),
      variant: 'data-1',
      tooltip: `Source emission #${m.value}`,
    }));
    const out: AhMarbleItem[] = this.switchMapAllOutputMarbles().map(
      (m, idx) => ({
        id: `switch-out-${m.id}`,
        value: m.value.includes('Val')
          ? m.value.split('Val')[1].trim()
          : m.value,
        positionPercent: Math.min(10 + idx * 10, 94),
        variant: 'accent',
        tooltip: `Switched output: ${m.value}`,
      }),
    );
    return [
      {
        id: 'src',
        label: t.sourceStreamLabel,
        badge: t.triggersBadge,
        marbles: src,
      },
      {
        id: 'out',
        label: t.switchMap.outLaneLabel,
        badge: t.switchMap.outLaneBadge,
        isPrimary: true,
        marbles: out,
      },
    ];
  });

  readonly switchMapOperator = computed<AhOperatorTransform>(() => ({
    name: 'switchMap(val => inner$)',
    description: this.copy().transformingStreams.switchMap.operatorDescription,
    formula: 'Unsubscribe active -> Subscribe latest',
  }));

  readonly mergeMapLanes = computed<readonly AhStreamLane[]>(() => {
    const t = this.copy().transformingStreams;
    const src: AhMarbleItem[] = this.mergeMapSourceMarbles().map((m, idx) => ({
      id: `merge-src-${m.id}`,
      value: m.value,
      positionPercent: Math.min(15 + idx * 25, 90),
      variant: 'data-1',
      tooltip: `Source emission #${m.value}`,
    }));
    const out: AhMarbleItem[] = this.mergeMapAllOutputMarbles().map(
      (m, idx) => ({
        id: `merge-out-${m.id}`,
        value: m.value.includes('Val')
          ? m.value.split('Val')[1].trim()
          : m.value,
        positionPercent: Math.min(10 + idx * 10, 94),
        variant: 'accent',
        tooltip: `Concurrent output: ${m.value}`,
      }),
    );
    return [
      {
        id: 'src',
        label: t.sourceStreamLabel,
        badge: t.triggersBadge,
        marbles: src,
      },
      {
        id: 'out',
        label: t.mergeMap.outLaneLabel,
        badge: t.mergeMap.outLaneBadge,
        isPrimary: true,
        marbles: out,
      },
    ];
  });

  readonly mergeMapOperator = computed<AhOperatorTransform>(() => ({
    name: 'mergeMap(val => inner$)',
    description: this.copy().transformingStreams.mergeMap.operatorDescription,
    formula: 'Concurrent streams -> Interleaved outputs',
  }));

  readonly exhaustMapLanes = computed<readonly AhStreamLane[]>(() => {
    const t = this.copy().transformingStreams;
    const src: AhMarbleItem[] = this.exhaustMapSourceMarbles().map(
      (m, idx) => ({
        id: `exhaust-src-${m.id}`,
        value: m.value,
        positionPercent: Math.min(15 + idx * 25, 90),
        variant: 'data-1',
        tooltip: `Source emission #${m.value}`,
      }),
    );
    const out: AhMarbleItem[] = this.exhaustMapAllOutputMarbles().map(
      (m, idx) => ({
        id: `exhaust-out-${m.id}`,
        value: m.value.includes('Val')
          ? m.value.split('Val')[1].trim()
          : m.value,
        positionPercent: Math.min(10 + idx * 10, 94),
        variant: 'accent',
        tooltip: `Guarded output: ${m.value}`,
      }),
    );
    return [
      {
        id: 'src',
        label: t.sourceStreamLabel,
        badge: t.triggersBadge,
        marbles: src,
      },
      {
        id: 'out',
        label: t.exhaustMap.outLaneLabel,
        badge: t.exhaustMap.outLaneBadge,
        isPrimary: true,
        marbles: out,
      },
    ];
  });

  readonly exhaustMapOperator = computed<AhOperatorTransform>(() => ({
    name: 'exhaustMap(val => inner$)',
    description: this.copy().transformingStreams.exhaustMap.operatorDescription,
    formula: 'Active stream ? Drop new : Execute',
  }));

  private marbleCounter = 0;

  // --- Code Snippets ---
  readonly codeSnippets: Record<OperatorType, string> = {
    concatMap: `
// Use case: Making sequential API calls.
// Ensures the second call only starts after the first one completes.
source$.pipe(
  concatMap(sourceValue =>
    this.http.get(\`/api/items/\${sourceValue}\`)
  )
).subscribe(result => console.log(result));`,
    switchMap: `
// Use case: A live search input.
// Cancels previous search requests on new input.
source$.pipe(
  switchMap(query =>
    this.http.get(\`/api/search?q=\${query}\`)
  )
).subscribe(results => console.log(results));`,
    mergeMap: `
// Use case: Handling multiple file uploads concurrently.
// Each upload starts immediately and runs in parallel.
source$.pipe(
  mergeMap(file =>
    this.uploadService.upload(file)
  )
).subscribe(uploadStatus => console.log(uploadStatus));`,
    exhaustMap: `
// Use case: A login button that should not be spammed.
// Ignores clicks while a login request is in progress.
source$.pipe(
  exhaustMap(() =>
    this.authService.login(credentials)
  )
).subscribe(user => console.log('Logged in!', user));`,
  };

  constructor() {
    this.setupStreams();
  }

  private setupStreams() {
    const source$ = this.source.asObservable();

    // concatMap
    source$
      .pipe(
        concatMap(({ clickIndex, color }) =>
          this.createInnerObservable('concatMap', clickIndex, color),
        ),
      )
      .subscribe();

    // switchMap
    source$
      .pipe(
        switchMap(({ clickIndex, color }) =>
          this.createInnerObservable('switchMap', clickIndex, color),
        ),
      )
      .subscribe();

    // mergeMap
    source$
      .pipe(
        mergeMap(({ clickIndex, color }) =>
          this.createInnerObservable('mergeMap', clickIndex, color),
        ),
      )
      .subscribe();

    // exhaustMap
    source$
      .pipe(
        exhaustMap(({ clickIndex, color }) =>
          this.createInnerObservable('exhaustMap', clickIndex, color),
        ),
      )
      .subscribe();
  }

  private createInnerObservable(
    strategy: OperatorType,
    clickIndex: number,
    color: string,
  ): Observable<string> {
    this.addLog(
      strategy,
      `Source emitted. Creating Inner Observable #${clickIndex + 1}.`,
      'text-gray-500',
    );

    const innerStreamsSignal = this.getSignal(strategy, 'InnerStreams');
    const outputMarblesSignal = this.getSignal(strategy, 'OutputMarbles');
    const allOutputMarblesSignal = this.getSignal(strategy, 'AllOutputMarbles');

    const streamId = this.marbleCounter++;
    const newStream: InnerStream = {
      id: streamId,
      clickIndex,
      color,
      marbles: [],
      status: 'active',
    };
    innerStreamsSignal.update((streams: InnerStream[]) => [
      ...streams,
      newStream,
    ]);

    let completed = false;

    return interval(this.innerInterval()).pipe(
      take(this.innerValues()),
      map((i) => `Stream ${clickIndex + 1} - Val ${i + 1}`),
      tap({
        next: (value) => {
          const marble: Marble = { id: this.marbleCounter++, value, color };

          innerStreamsSignal.update((streams: InnerStream[]) =>
            streams.map((s) =>
              s.id === streamId ? { ...s, marbles: [...s.marbles, marble] } : s,
            ),
          );

          outputMarblesSignal.update((m: Marble[]) => [...m, marble]);
          allOutputMarblesSignal.update((m: Marble[]) => [...m, marble]);

          this.addLog(
            strategy,
            `Inner Obs #${clickIndex + 1} emitted "${value}"`,
            color,
          );

          setTimeout(() => {
            innerStreamsSignal.update((streams: InnerStream[]) =>
              streams.map((s) =>
                s.id === streamId
                  ? {
                      ...s,
                      marbles: s.marbles.filter((m) => m.id !== marble.id),
                    }
                  : s,
              ),
            );
            outputMarblesSignal.update((marbles: Marble[]) =>
              marbles.filter((m) => m.id !== marble.id),
            );
          }, 4000);
        },
        complete: () => {
          completed = true;
        },
      }),
      finalize(() => {
        if (completed) {
          this.addLog(
            strategy,
            `Inner Observable #${clickIndex + 1} completed.`,
            'text-green-500',
          );
          innerStreamsSignal.update((streams: InnerStream[]) =>
            streams.map((s) =>
              s.id === streamId ? { ...s, status: 'completed' } : s,
            ),
          );
        } else {
          this.addLog(
            strategy,
            `Inner Observable #${clickIndex + 1} cancelled.`,
            'text-red-500',
          );
          innerStreamsSignal.update((streams: InnerStream[]) =>
            streams.map((s) =>
              s.id === streamId ? { ...s, status: 'cancelled' } : s,
            ),
          );
        }
      }),
    );
  }

  private getSignal<T extends keyof SignalMap>(
    strategy: OperatorType,
    type: T,
  ): SignalMap[T] {
    const key = `${strategy}${type}` as keyof this;
    return this[key] as unknown as SignalMap[T];
  }

  private addLog(strategy: OperatorType, message: string, color: string) {
    const logsSignal = this.getSignal(strategy, 'Logs');
    const newLog: StreamLog = {
      time: new Date().toLocaleTimeString(),
      message,
      color,
    };
    logsSignal.update((logs: StreamLog[]) => [newLog, ...logs]);
  }

  private addSourceMarble(
    strategy: OperatorType,
    clickIndex: number,
    color: string,
  ) {
    const sourceMarblesSignal = this.getSignal(strategy, 'SourceMarbles');
    const marble: Marble = {
      id: this.marbleCounter++,
      value: `Emit ${clickIndex + 1}`,
      color,
    };
    sourceMarblesSignal.update((m: Marble[]) => [...m, marble]);
    setTimeout(() => {
      sourceMarblesSignal.update((marbles: Marble[]) =>
        marbles.filter((m) => m.id !== marble.id),
      );
    }, 4000);
  }

  private getRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 65%)`;
  }

  // --- Methods for Template ---
  startEmitting() {
    this.resetAll();
    this.isEmitting.set(true);
    let clickIndex = 0;

    this.sourceSubscription = interval(this.sourceInterval())
      .pipe(
        take(this.sourceEmissions()),
        finalize(() => this.isEmitting.set(false)),
      )
      .subscribe(() => {
        const color = this.getRandomColor();
        ['concatMap', 'switchMap', 'mergeMap', 'exhaustMap'].forEach(
          (strategy) => {
            this.addSourceMarble(strategy as OperatorType, clickIndex, color);
          },
        );
        this.source.next({ clickIndex, color });
        clickIndex++;
      });
  }

  resetAll() {
    this.sourceSubscription?.unsubscribe();
    this.isEmitting.set(false);
    this.marbleCounter = 0;
    (
      ['concatMap', 'switchMap', 'mergeMap', 'exhaustMap'] as OperatorType[]
    ).forEach((strategy) => {
      this.getSignal(strategy, 'SourceMarbles').set([]);
      this.getSignal(strategy, 'InnerStreams').set([]);
      this.getSignal(strategy, 'OutputMarbles').set([]);
      this.getSignal(strategy, 'AllOutputMarbles').set([]);
      this.getSignal(strategy, 'Logs').set([]);
    });
  }

  toggleCode(strategy: OperatorType): void {
    const map: Record<OperatorType, WritableSignal<boolean>> = {
      concatMap: this.showConcatMapCode,
      switchMap: this.showSwitchMapCode,
      mergeMap: this.showMergeMapCode,
      exhaustMap: this.showExhaustMapCode,
    };
    map[strategy].update((value) => !value);
  }

  onSourceEmissionsChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) this.sourceEmissions.set(val);
  }
  onSourceIntervalChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 100) this.sourceInterval.set(val);
  }
  onInnerValuesChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) this.innerValues.set(val);
  }
  onInnerIntervalChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 100) this.innerInterval.set(val);
  }
}
