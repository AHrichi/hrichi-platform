// src/app/exercises/error-handling/error-handling.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Subject,
  timer,
  of,
  throwError,
  Observable,
  merge,
  retryWhen,
} from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  retry,
  tap,
  finalize,
  shareReplay,
  startWith,
  delayWhen,
  scan,
} from 'rxjs/operators';

@Component({
  selector: 'app-error-handling',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-handling.component.html',
  styleUrls: ['./error-handling.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorHandlingComponent {
  // --- Signals for retry strategy configuration ---
  retryDelay = signal(3000);
  maxRetries = signal(2);

  // --- Subjects to trigger each strategy ---
  private triggerReplace = new Subject<boolean>();
  private triggerRethrow = new Subject<void>();
  private triggerRetry = new Subject<void>();
  private triggerRetryWhen = new Subject<void>();
  private resetReplace = new Subject<void>();
  private resetRethrow = new Subject<void>();
  private resetRetry = new Subject<void>();
  private resetRetryWhen = new Subject<void>();

  // --- Loading Indicators as Signals ---
  isLoadingReplace = signal(false);
  isLoadingRethrow = signal(false);
  isLoadingRetry = signal(false);
  isLoadingRetryWhen = signal(false);

  // --- Strategy 1: Replace Strategy ---
  replaceStrategyData$: Observable<string | null> = merge(
    this.triggerReplace.pipe(
      switchMap((shouldFail) => {
        this.isLoadingReplace.set(true);
        return timer(1000).pipe(
          map(() => {
            if (shouldFail) {
              throw new Error('Server is on fire!');
            }
            return '✅ Data fetched successfully!';
          }),
          catchError((error) => of(`❌ Error handled: ${error.message}`)),
          finalize(() => this.isLoadingReplace.set(false)),
        );
      }),
    ),
    this.resetReplace.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));

  // --- Strategy 2: Rethrow Strategy ---
  rethrowStrategyData$: Observable<string | null> = merge(
    this.triggerRethrow.pipe(
      switchMap(() => {
        this.isLoadingRethrow.set(true);
        return timer(1000).pipe(
          map(() => {
            throw new Error('DB connection lost!');
          }),
          catchError((error) => {
            console.error(
              'RETHROW-STRATEGY: Error caught and re-thrown!',
              error.message,
            );
            return throwError(() => error);
          }),
          finalize(() => this.isLoadingRethrow.set(false)),
        );
      }),
      catchError((error) =>
        of(`❌ Rethrown error captured by UI: ${error.message}`),
      ),
    ),
    this.resetRethrow.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));

  // --- Strategy 3: Retry Strategy (Modern) ---
  retryCount = signal(0);
  retryStrategyData$: Observable<string | null> = merge(
    this.triggerRetry.pipe(
      switchMap(() => {
        this.retryCount.set(0);
        this.isLoadingRetry.set(true);
        return timer(800).pipe(
          tap(() => {
            this.retryCount.update((c) => c + 1);
            console.log(`RETRY-STRATEGY: Attempt #${this.retryCount()}...`);
          }),
          switchMap(() => throwError(() => new Error('Server is still down.'))),
          retry({
            count: this.maxRetries(),
            delay: (error, retryCount) => {
              console.log(
                `RETRY-STRATEGY: Attempt #${retryCount} will be retried in ${this.retryDelay()}ms...`,
              );
              this.retryCount.set(retryCount);
              return timer(this.retryDelay());
            },
          }),
          catchError((error) =>
            of(
              `❌ Failed after ${this.retryCount()} attempts. Error: ${error.message}`,
            ),
          ),
          finalize(() => this.isLoadingRetry.set(false)),
        );
      }),
    ),
    this.resetRetry.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));

  // --- Strategy 4: RetryWhen Strategy (Legacy) ---
  retryWhenCount = signal(0);
  retryWhenStrategyData$: Observable<string | null> = merge(
    this.triggerRetryWhen.pipe(
      switchMap(() => {
        this.retryWhenCount.set(0);
        this.isLoadingRetryWhen.set(true);
        return of(null).pipe(
          tap(() => this.retryWhenCount.update((c) => c + 1)),
          map(() => {
            console.log(
              `RETRY-WHEN-STRATEGY: Attempt #${this.retryWhenCount()}...`,
            );
            throw new Error('Service unavailable.');
          }),
          retryWhen((errors) =>
            errors.pipe(
              delayWhen(() => timer(this.retryDelay())),
              tap(() =>
                console.log(
                  `RETRY-WHEN-STRATEGY: Retrying after ${this.retryDelay()}ms...`,
                ),
              ),
              scan((errorCount, err) => {
                if (errorCount >= this.maxRetries()) {
                  throw err;
                }
                return errorCount + 1;
              }, 0),
            ),
          ),
          catchError((error) =>
            of(`❌ Failed after retries. Error: ${error.message}`),
          ),
          finalize(() => this.isLoadingRetryWhen.set(false)),
        );
      }),
    ),
    this.resetRetryWhen.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));

  // --- Methods to be called from the template ---
  fetchSuccess() {
    this.triggerReplace.next(false);
  }
  fetchFail() {
    this.triggerReplace.next(true);
  }
  fetchWithRethrow() {
    this.triggerRethrow.next();
  }
  fetchWithRetry() {
    this.triggerRetry.next();
  }
  fetchWithRetryWhen() {
    this.triggerRetryWhen.next();
  }

  resetReplaceMessage() {
    this.resetReplace.next();
  }
  resetRethrowMessage() {
    this.resetRethrow.next();
  }
  resetRetryMessage() {
    this.resetRetry.next();
  }
  resetRetryWhenMessage() {
    this.resetRetryWhen.next();
  }

  // --- Methods to update signals from the template ---
  onRetryDelayChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.retryDelay.set(Number(value));
  }

  onMaxRetriesChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.maxRetries.set(Number(value));
  }
}
