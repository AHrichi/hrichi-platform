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
  templateUrl: './effects-cycle.component.html',
  styleUrl: './effects-cycle.component.scss',
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
