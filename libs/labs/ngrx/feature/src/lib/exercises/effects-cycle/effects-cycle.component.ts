import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { AhButton, SectionHeading, type SegmentedOption } from '@ah/ui';
import {
  FlowStage,
  StateFlowDiagramComponent,
} from '../../shared/ui/state-flow-diagram/state-flow-diagram.component';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

export interface EffectLog {
  id: number;
  time: string;
  source: 'Component' | 'Action' | 'Effect' | 'API' | 'tapResponse' | 'Reducer';
  message: string;
  badge: 'info' | 'success' | 'warn' | 'error';
}

@Component({
  selector: 'ah-ngrx-effects-cycle',
  imports: [
    SectionHeading,
    AhButton,
    UseCaseFocusComponent,
    StateFlowDiagramComponent,
  ],
  template: `
    <div class="exercise-container">
      <ah-section-heading
        eyebrow="NgRx Effects & Async Pipelines"
        heading="Side-Effect Model & Concurrency Strategies"
        lead="Isolate impure asynchronous side-effects (HTTP, WebSockets, LocalStorage) from pure UI components with functional effects, ofType filtering, and tapResponse."
      />

      <ah-ngrx-use-case-focus
        [options]="focusOptions"
        [(value)]="activeCase"
        ariaLabel="Focus on NgRx Effects concepts"
      />

      <!-- Visual State Flow with Active Effect Branch -->
      <ah-state-flow-diagram
        [activeStage]="currentStage()"
        [showEffect]="true"
      />

      <div class="cards-grid">
        <!-- Interactive Simulation Controller -->
        @if (activeCase() === 'all' || activeCase() === 'simulation') {
          <div
            class="card"
            [class.focused-card]="activeCase() === 'simulation'"
          >
            <div class="card-header">
              <span class="badge">1. Interactive Effect Runner</span>
              <h3>Simulate Async Authentication Flow</h3>
            </div>
            <p class="description">
              Test how effects handle async network latency, success, and errors
              without ever breaking the component or killing the stream.
            </p>

            <div class="config-controls">
              <div class="config-group">
                <span class="config-title"
                  >Concurrency Flattening Operator (4 Strategies):</span
                >
                <div class="pills-row">
                  <button
                    type="button"
                    class="pill"
                    [class.active]="operator() === 'exhaustMap'"
                    (click)="operator.set('exhaustMap')"
                  >
                    exhaustMap (Ignore rapid duplicates)
                  </button>
                  <button
                    type="button"
                    class="pill"
                    [class.active]="operator() === 'switchMap'"
                    (click)="operator.set('switchMap')"
                  >
                    switchMap (Cancel previous in-flight)
                  </button>
                  <button
                    type="button"
                    class="pill"
                    [class.active]="operator() === 'concatMap'"
                    (click)="operator.set('concatMap')"
                  >
                    concatMap (Queue sequentially)
                  </button>
                  <button
                    type="button"
                    class="pill"
                    [class.active]="operator() === 'mergeMap'"
                    (click)="operator.set('mergeMap')"
                  >
                    mergeMap (Run in parallel)
                  </button>
                </div>
              </div>

              <div class="config-group">
                <span class="config-title">Outcome Simulation:</span>
                <div class="pills-row">
                  <button
                    type="button"
                    class="pill"
                    [class.active]="outcome() === 'success'"
                    (click)="outcome.set('success')"
                  >
                    200 Success
                  </button>
                  <button
                    type="button"
                    class="pill"
                    [class.active]="outcome() === 'error'"
                    (click)="outcome.set('error')"
                  >
                    401 Unauthorized
                  </button>
                </div>
              </div>
            </div>

            <div class="action-bar">
              <button
                type="button"
                ahButton="primary"
                [disabled]="isBusy() && operator() === 'exhaustMap'"
                (click)="triggerEffect()"
              >
                {{
                  isBusy() ? 'Effect in Progress...' : 'Dispatch [Auth] Login'
                }}
              </button>
              <button
                type="button"
                ahButton="secondary"
                [disabled]="isBusy() && operator() === 'exhaustMap'"
                (click)="rapidFireDispatches()"
                title="Dispatch 3 actions in rapid succession to test concurrency"
              >
                🔥 Rapid-Fire 3 Actions
              </button>
              <button type="button" ahButton="ghost" (click)="clearLogs()">
                Clear Timeline
              </button>
            </div>

            <!-- Effect Pipeline Code Snippet -->
            <div class="code-preview">
              <span class="preview-title"
                >Modern Functional Effect Definition:</span
              >
              <pre><code>{{ effectCodeSnippet }}</code></pre>
            </div>
          </div>
        }

        <!-- Card 2: Stream Activity Timeline -->
        @if (activeCase() === 'all' || activeCase() === 'timeline') {
          <div class="card" [class.focused-card]="activeCase() === 'timeline'">
            <div class="card-header">
              <span class="badge">2. Live Event Stream Log</span>
              <h3>Pipeline Trace &amp; tapResponse Audit</h3>
            </div>
            <p class="description">
              Notice that when an HTTP call fails,
              <code>tapResponse</code> catches the error and dispatches a
              failure action. The outer effect stream stays alive!
            </p>

            <div class="timeline-list">
              @for (log of logs(); track log.id) {
                <div class="timeline-item" [class]="'badge-' + log.badge">
                  <span class="timeline-time">{{ log.time }}</span>
                  <span class="timeline-source">{{ log.source }}</span>
                  <span class="timeline-msg">{{ log.message }}</span>
                </div>
              } @empty {
                <div class="empty-state">
                  No events yet. Click "Dispatch [Auth] Login" above to start
                  the cycle.
                </div>
              }
            </div>

            <!-- TapResponse explanation note -->
            <div class="audit-note">
              <strong>Why tapResponse instead of catchError?</strong><br />
              Standard RxJS <code>catchError()</code> can accidentally complete
              the stream if not nested inside <code>switchMap</code>.
              <code>tapResponse</code> guarantees error handling isolation and
              enforces exhaustiveness for success and failure handlers.
            </div>
          </div>
        }

        <!-- Card 3: Concurrency Flattening Comparison -->
        @if (activeCase() === 'all' || activeCase() === 'operators') {
          <div class="card" [class.focused-card]="activeCase() === 'operators'">
            <div class="card-header">
              <span class="badge">3. Concurrency Cheatsheet</span>
              <h3>Choosing the Right Operator</h3>
            </div>

            <div class="operator-guide-list">
              <div class="operator-item">
                <span class="op-name">exhaustMap</span>
                <span class="op-desc"
                  >Ignores new source emissions until current inner observable
                  completes. Perfect for submit buttons, logins, and checkout
                  actions to prevent double submissions.</span
                >
              </div>
              <div class="operator-item">
                <span class="op-name">switchMap</span>
                <span class="op-desc"
                  >Unsubscribes from previous inner request when a new action
                  arrives. Perfect for search/autocomplete filters where only
                  the latest query matters.</span
                >
              </div>
              <div class="operator-item">
                <span class="op-name">concatMap</span>
                <span class="op-desc"
                  >Buffers incoming actions and processes them sequentially in
                  strict order. Perfect for queued file uploads or chronological
                  transactions.</span
                >
              </div>
              <div class="operator-item">
                <span class="op-name">mergeMap</span>
                <span class="op-desc"
                  >Executes all inner requests concurrently. Perfect for
                  independent background syncs where ordering and duplicate
                  prevention do not matter.</span
                >
              </div>
            </div>
          </div>
        }

        <!-- Card 4: The Dead Stream Trap -->
        @if (activeCase() === 'all' || activeCase() === 'dead-stream') {
          <div
            class="card"
            [class.focused-card]="activeCase() === 'dead-stream'"
          >
            <div class="card-header">
              <span class="badge">Production Reliability</span>
              <h3>The "Dead Stream" Trap &amp; Why tapResponse is Vital</h3>
            </div>
            <p class="description">
              The #1 most common junior/intermediate bug in NgRx is putting
              <code>catchError()</code> directly on the outer
              <code>actions$.pipe(...)</code> stream instead of the inner HTTP
              observable.
            </p>

            <div class="comparison-boxes">
              <div class="cmp-box fatal">
                <span class="cmp-tag"
                  >❌ Fatal: Outer catchError Kills Effect</span
                >
                <pre><code>actions$.pipe(
  ofType(AuthActions.login),
  switchMap(() => api.login()),
  catchError(err => of(AuthActions.failure(&#123; err &#125;)))
  // 💀 Outer actions stream COMPLETES!
  // Future login clicks will NEVER fire!
)</code></pre>
              </div>

              <div class="cmp-box safe">
                <span class="cmp-tag">✅ Production Safe: tapResponse</span>
                <pre><code>actions$.pipe(
  ofType(AuthActions.login),
  switchMap(() => api.login().pipe(
    tapResponse(&#123;
      next: (user) => AuthActions.success(&#123; user &#125;),
      error: (err) => AuthActions.failure(&#123; err &#125;),
    &#125;)
  ))
  // 🛡️ Outer stream remains ALIVE forever!
)</code></pre>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .exercise-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-5, 1.25rem);
    }

    .card {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .card.focused-card {
      border-color: var(--color-accent-default);
      box-shadow: 0 0 24px rgba(179, 18, 46, 0.15);
    }

    .card-header h3 {
      margin: var(--space-1, 0.25rem) 0 0;
      font-size: var(--font-size-base, 1rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .badge {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-muted);
      line-height: 1.5;
      margin: 0;
    }

    .config-controls {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .config-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-muted);
      display: block;
      margin-bottom: 4px;
    }

    .pills-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .pill {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      cursor: pointer;
      user-select: none;
      transition: all var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .pill:hover {
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      border-color: var(--color-border-strong);
    }

    .pill.active {
      background: var(--color-accent-default);
      border-color: var(--color-accent-default);
      color: var(--color-accent-on);
      font-weight: 600;
    }

    .action-bar {
      display: flex;
      gap: var(--space-2, 0.5rem);
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      padding: 6px var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-left: 3px solid var(--color-border-strong);
      border-radius: 4px;
      font-size: var(--font-size-xs, 0.75rem);
    }

    .timeline-item.badge-info {
      border-left-color: var(--color-accent-default);
    }

    .timeline-item.badge-success {
      border-left-color: var(--color-success-default, #15803d);
    }

    .timeline-item.badge-warn {
      border-left-color: #f59e0b;
    }

    .timeline-item.badge-error {
      border-left-color: #ef4444;
    }

    .timeline-time {
      font-family: monospace;
      color: var(--color-text-muted);
      font-size: 0.65rem;
    }

    .timeline-source {
      font-weight: 700;
      color: var(--color-text-default);
      min-width: 80px;
    }

    .timeline-msg {
      color: var(--color-text-default);
      font-family: monospace;
      font-size: 0.7rem;
    }

    .empty-state {
      padding: var(--space-4, 1rem);
      text-align: center;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
      border: 1px dashed var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .audit-note {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      font-size: 0.7rem;
      color: var(--color-stage-muted, #9a9aa3);
      line-height: 1.4;
    }

    .audit-note strong {
      color: var(--color-stage-text, #f7f7f8);
    }

    .operator-guide-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .operator-item {
      padding: var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .op-name {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8rem;
      color: var(--color-accent-default);
    }

    .op-desc {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .code-preview {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .preview-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--color-stage-muted, #9a9aa3);
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }

    .code-preview pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.7rem;
      color: var(--color-stage-text, #f7f7f8);
      line-height: 1.4;
      overflow-x: auto;
    }

    .comparison-boxes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-3, 0.75rem);
      margin-top: var(--space-2, 0.5rem);
    }

    .cmp-box {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cmp-box.fatal {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .cmp-box.safe {
      border-color: rgba(34, 197, 94, 0.4);
    }

    .cmp-tag {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cmp-box.fatal .cmp-tag {
      color: #f87171;
    }

    .cmp-box.safe .cmp-tag {
      color: #4ade80;
    }

    .cmp-box pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.7rem;
      line-height: 1.45;
      color: var(--color-stage-text, #f7f7f8);
      overflow-x: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsCycleComponent {
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Effect Concepts' },
    { value: 'simulation', label: 'Simulation Runner' },
    { value: 'operators', label: 'Concurrency Flattening' },
    { value: 'dead-stream', label: 'The Dead Stream Trap' },
    { value: 'timeline', label: 'Stream Timeline' },
  ];

  readonly activeCase = signal('all');
  readonly currentStage = signal<FlowStage>('idle');
  readonly operator = signal<
    'exhaustMap' | 'switchMap' | 'concatMap' | 'mergeMap'
  >('exhaustMap');
  readonly outcome = signal<'success' | 'error'>('success');
  readonly isBusy = signal(false);

  readonly logs = signal<EffectLog[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      source: 'Effect',
      message: 'AuthEffects registered & listening on Actions stream',
      badge: 'info',
    },
  ]);

  readonly effectCodeSnippet = computed(() => {
    const op = this.operator();
    return `export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      ${op}(({ credentials }) =>
        authService.login(credentials).pipe(
          tapResponse({
            next: (user) => AuthActions.loginSuccess({ user }),
            error: (error) => AuthActions.loginFailure({ error }),
          }),
        ),
      ),
    ),
  { functional: true },
);`;
  });

  triggerEffect(customLabel?: string): void {
    if (this.isBusy() && this.operator() === 'exhaustMap') {
      this.addLog(
        'Effect',
        'exhaustMap: Ignored duplicate action while previous was active',
        'warn',
      );
      return;
    }

    this.isBusy.set(true);
    this.currentStage.set('dispatch');
    this.addLog(
      'Component',
      `Dispatched [Auth] Login Request ${customLabel ? `(${customLabel})` : ''}`,
      'info',
    );

    setTimeout(() => {
      this.currentStage.set('effect');
      this.addLog(
        'Effect',
        `ofType filter matched -> entering ${this.operator()}`,
        'info',
      );
      this.addLog('API', 'HTTP POST /api/auth/login in-flight...', 'info');
    }, 300);

    setTimeout(() => {
      if (this.outcome() === 'success') {
        this.currentStage.set('reducer');
        this.addLog(
          'tapResponse',
          '200 OK -> dispatching [Auth] Login Success',
          'success',
        );
        this.addLog(
          'Reducer',
          'Auth state updated: isAuthenticated: true, user: "Ahmed Hrichi"',
          'success',
        );
      } else {
        this.currentStage.set('reducer');
        this.addLog(
          'tapResponse',
          '401 Unauthorized -> dispatching [Auth] Login Failure',
          'error',
        );
        this.addLog(
          'Reducer',
          'Auth state updated: error: "Invalid credentials"',
          'warn',
        );
      }

      setTimeout(() => {
        this.currentStage.set('store');
      }, 300);

      setTimeout(() => {
        this.currentStage.set('selector');
      }, 600);

      setTimeout(() => {
        this.currentStage.set('component');
        this.isBusy.set(false);
      }, 900);

      setTimeout(() => {
        this.currentStage.set('idle');
      }, 1500);
    }, 1200);
  }

  rapidFireDispatches(): void {
    this.clearLogs();
    const op = this.operator();
    this.addLog(
      'Component',
      `🔥 Triggering Rapid-Fire 3 Dispatches under [${op}]...`,
      'warn',
    );

    if (op === 'exhaustMap') {
      this.triggerEffect('Action #1');
      setTimeout(() => {
        this.addLog(
          'Effect',
          '⚡ Action #2 arrived: exhaustMap DROPPED it because Action #1 is in-flight!',
          'warn',
        );
      }, 200);
      setTimeout(() => {
        this.addLog(
          'Effect',
          '⚡ Action #3 arrived: exhaustMap DROPPED it because Action #1 is in-flight!',
          'warn',
        );
      }, 400);
    } else if (op === 'switchMap') {
      this.triggerEffect('Action #1');
      setTimeout(() => {
        this.addLog(
          'Effect',
          '🔄 Action #2 arrived: switchMap CANCELLED Action #1 HTTP request!',
          'warn',
        );
        this.triggerEffect('Action #2');
      }, 300);
      setTimeout(() => {
        this.addLog(
          'Effect',
          '🔄 Action #3 arrived: switchMap CANCELLED Action #2 HTTP request!',
          'warn',
        );
        this.triggerEffect('Action #3 (Final)');
      }, 600);
    } else if (op === 'concatMap') {
      this.addLog(
        'Effect',
        '⛓️ concatMap: Action #1 started immediately.',
        'info',
      );
      this.addLog(
        'Effect',
        '⛓️ concatMap: Action #2 buffered in FIFO queue.',
        'info',
      );
      this.addLog(
        'Effect',
        '⛓️ concatMap: Action #3 buffered in FIFO queue.',
        'info',
      );
      this.triggerEffect('Action #1');
      setTimeout(() => {
        this.addLog(
          'Effect',
          '⛓️ Action #1 completed -> dequeuing and executing Action #2.',
          'success',
        );
      }, 1400);
      setTimeout(() => {
        this.addLog(
          'Effect',
          '⛓️ Action #2 completed -> dequeuing and executing Action #3.',
          'success',
        );
      }, 2700);
    } else if (op === 'mergeMap') {
      this.addLog(
        'Effect',
        '⚡ mergeMap: Spawning 3 concurrent parallel HTTP requests simultaneously!',
        'info',
      );
      this.triggerEffect('Action #1 (Parallel)');
      setTimeout(() => this.triggerEffect('Action #2 (Parallel)'), 150);
      setTimeout(() => this.triggerEffect('Action #3 (Parallel)'), 300);
    }
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  private addLog(
    source: EffectLog['source'],
    message: string,
    badge: EffectLog['badge'],
  ): void {
    const entry: EffectLog = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      source,
      message,
      badge,
    };
    this.logs.update((l) => [entry, ...l]);
  }
}
