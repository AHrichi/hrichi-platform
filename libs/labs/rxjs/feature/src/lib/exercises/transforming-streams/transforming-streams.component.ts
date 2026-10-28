// src/app/exercises/transforming-streams/transforming-streams.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

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

@Component({
  selector: 'app-transforming-streams',
  standalone: true,
  imports: [],
  templateUrl: './transforming-streams.component.html',
  styleUrls: ['./transforming-streams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformingStreamsComponent {
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

  private getSignal<
    T extends
      | 'SourceMarbles'
      | 'InnerStreams'
      | 'OutputMarbles'
      | 'AllOutputMarbles'
      | 'Logs',
  >(strategy: OperatorType, type: T): any {
    return this[`${strategy}${type}` as keyof this];
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

  toggleCode(strategy: OperatorType) {
    const signal = this[
      `show${strategy.charAt(0).toUpperCase() + strategy.slice(1)}Code` as keyof this
    ] as any;
    signal.update((value: boolean) => !value);
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
