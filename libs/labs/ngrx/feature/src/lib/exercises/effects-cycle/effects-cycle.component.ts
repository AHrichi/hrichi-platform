import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
                  >Concurrency Flattening Operator:</span
                >
                <div class="pills-row">
                  <button
                    class="pill"
                    [class.active]="operator() === 'exhaustMap'"
                    (click)="operator.set('exhaustMap')"
                  >
                    exhaustMap (Ignore rapid clicks)
                  </button>
                  <button
                    class="pill"
                    [class.active]="operator() === 'switchMap'"
                    (click)="operator.set('switchMap')"
                  >
                    switchMap (Cancel previous)
                  </button>
                </div>
              </div>

              <div class="config-group">
                <span class="config-title">Outcome Simulation:</span>
                <div class="pills-row">
                  <button
                    class="pill"
                    [class.active]="outcome() === 'success'"
                    (click)="outcome.set('success')"
                  >
                    200 Success
                  </button>
                  <button
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
      background: var(--color-surface-raised, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .card.focused-card {
      border-color: #6366f1;
      box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
    }

    .card-header h3 {
      margin: var(--space-1, 0.25rem) 0 0;
      font-size: var(--font-size-base, 1rem);
      font-weight: 600;
      color: var(--color-text-primary, #f8fafc);
    }

    .badge {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #818cf8;
    }

    .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-muted, #94a3b8);
      line-height: 1.5;
      margin: 0;
    }

    .config-controls {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .config-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-muted, #94a3b8);
      display: block;
      margin-bottom: 4px;
    }

    .pills-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md, 0.5rem);
      padding: 4px 10px;
      font-size: 0.7rem;
      color: var(--color-text-muted, #94a3b8);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }

    .pill.active {
      background: #6366f1;
      border-color: #6366f1;
      color: #ffffff;
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
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid #64748b;
      border-radius: 4px;
      font-size: var(--font-size-xs, 0.75rem);
    }

    .timeline-item.badge-info {
      border-left-color: #38bdf8;
    }

    .timeline-item.badge-success {
      border-left-color: #34d399;
    }

    .timeline-item.badge-warn {
      border-left-color: #fbbf24;
    }

    .timeline-item.badge-error {
      border-left-color: #f87171;
    }

    .timeline-time {
      font-family: monospace;
      color: var(--color-text-muted, #64748b);
      font-size: 0.65rem;
    }

    .timeline-source {
      font-weight: 700;
      color: #cbd5e1;
      min-width: 80px;
    }

    .timeline-msg {
      color: var(--color-text-primary, #f1f5f9);
      font-family: monospace;
      font-size: 0.7rem;
    }

    .empty-state {
      padding: var(--space-4, 1rem);
      text-align: center;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted, #64748b);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md, 0.5rem);
    }

    .audit-note {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      font-size: 0.7rem;
      color: var(--color-text-muted, #94a3b8);
      line-height: 1.4;
    }

    .audit-note strong {
      color: #38bdf8;
    }

    .operator-guide-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .operator-item {
      padding: var(--space-3, 0.75rem);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md, 0.5rem);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .op-name {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8rem;
      color: #818cf8;
    }

    .op-desc {
      font-size: 0.7rem;
      color: var(--color-text-muted, #94a3b8);
      line-height: 1.4;
    }

    .code-preview {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .preview-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--color-text-muted, #94a3b8);
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }

    .code-preview pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.7rem;
      color: #93c5fd;
      line-height: 1.4;
      overflow-x: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsCycleComponent {
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Effect Concepts' },
    { value: 'simulation', label: 'Simulation Runner' },
    { value: 'timeline', label: 'Stream Timeline' },
    { value: 'operators', label: 'Concurrency Cheatsheet' },
  ];

  readonly activeCase = signal('all');
  readonly currentStage = signal<FlowStage>('idle');
  readonly operator = signal<'exhaustMap' | 'switchMap'>('exhaustMap');
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

  readonly effectCodeSnippet = `export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
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

  triggerEffect(): void {
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
    this.addLog('Component', 'Dispatched [Auth] Login Request', 'info');

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
