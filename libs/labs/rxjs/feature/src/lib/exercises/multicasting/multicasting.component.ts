// src/app/exercises/multicasting/multicasting.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnDestroy,
  computed,
} from '@angular/core';

import {
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  interval,
  Subscription,
  take,
  tap,
  share,
  Observable,
  connectable,
  Connectable,
} from 'rxjs';
import { NotificationService } from '../../shared/services/notification.service';

interface Marble {
  id: number;
  value: number;
  color: string;
}

interface Subscriber {
  id: string;
  marbles: Marble[];
  subscription: Subscription | null;
}

type SubjectType =
  'subject' | 'behaviorSubject' | 'replaySubject' | 'asyncSubject';
type ExampleType = 'cold' | 'hot' | 'connectable' | SubjectType;

@Component({
  selector: 'app-multicasting',
  standalone: true,
  imports: [],
  templateUrl: './multicasting.component.html',
  styleUrls: ['./multicasting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulticastingComponent implements OnDestroy {
  // --- Signals for UI Configuration ---
  replayBufferSize = signal(3);
  behaviorInitialValue = signal(0);

  // --- State for each example ---
  subscribers = signal<Record<ExampleType, Subscriber[]>>({
    cold: [],
    hot: [],
    connectable: [],
    subject: [],
    behaviorSubject: [],
    replaySubject: [],
    asyncSubject: [],
  });

  sourceMarbles = signal<Record<ExampleType, Marble[]>>({
    cold: [],
    hot: [],
    connectable: [],
    subject: [],
    behaviorSubject: [],
    replaySubject: [],
    asyncSubject: [],
  });

  isSubjectCreated = signal<Record<SubjectType, boolean>>({
    subject: false,
    behaviorSubject: false,
    replaySubject: false,
    asyncSubject: false,
  });

  // --- Subjects and Observables ---
  private subject: Subject<number> | null = null;
  private behaviorSubject: BehaviorSubject<number> | null = null;
  private replaySubject: ReplaySubject<number> | null = null;
  private asyncSubject: AsyncSubject<number> | null = null;

  private hotSource$: Observable<number>;
  private connectableSource$: Connectable<number> | null = null;
  private connectableSubscription: Subscription | null = null;

  private sourceSubscriptions: Subscription[] = [];
  private valueCounters: Record<SubjectType, number> = {
    subject: 0,
    behaviorSubject: 0,
    replaySubject: 0,
    asyncSubject: 0,
  };

  private marbleCounter = 0;
  public colors = ['#f87171', '#60a5fa', '#4ade80', '#facc15', '#a78bfa'];
  private notificationService = inject(NotificationService);

  // --- Computed signals for special displays ---
  behaviorSubjectValue = computed(() => this.behaviorSubject?.getValue());
  replaySubjectBuffer = signal<number[]>([]);

  constructor() {
    this.hotSource$ = interval(1000).pipe(
      take(5),
      tap((value) => this.addSourceMarble('hot', value)),
      share(), // share makes the source hot
    );
  }

  ngOnDestroy() {
    this.sourceSubscriptions.forEach((sub) => sub.unsubscribe());
    this.subject?.complete();
    this.behaviorSubject?.complete();
    this.replaySubject?.complete();
    this.asyncSubject?.complete();
    this.connectableSubscription?.unsubscribe();
  }

  // --- Control Methods ---
  createSubject(type: SubjectType) {
    this.reset(type);
    if (type === 'subject') this.subject = new Subject<number>();
    if (type === 'behaviorSubject')
      this.behaviorSubject = new BehaviorSubject<number>(
        this.behaviorInitialValue(),
      );
    if (type === 'replaySubject')
      this.replaySubject = new ReplaySubject<number>(this.replayBufferSize());
    if (type === 'asyncSubject') this.asyncSubject = new AsyncSubject<number>();

    this.isSubjectCreated.update((s) => ({ ...s, [type]: true }));
    this.notificationService.show(`${type} instance created.`, 'info');
  }

  emitValue(type: SubjectType) {
    const subject = this.getSubject(type);
    if (!subject) {
      this.notificationService.show(
        `Please create the ${type} first.`,
        'warning',
      );
      return;
    }
    const value = this.valueCounters[type]++;
    this.addSourceMarble(type, value);
    subject.next(value);
    if (type === 'replaySubject') {
      this.replaySubjectBuffer.update((buffer) =>
        [...buffer, value].slice(-this.replayBufferSize()),
      );
    }
    this.notificationService.show(`Emitted value: ${value}`, 'info');
  }

  completeSubject(type: SubjectType) {
    const subject = this.getSubject(type);
    if (!subject) {
      this.notificationService.show(
        `Please create the ${type} first.`,
        'warning',
      );
      return;
    }
    subject.complete();
    this.notificationService.show(`${type} has completed.`, 'success');
  }

  createConnectable() {
    this.reset('connectable');
    const source$ = interval(1000).pipe(
      take(5),
      tap((value) => this.addSourceMarble('connectable', value)),
    );
    this.connectableSource$ = connectable(source$);
    this.notificationService.show('Connectable Observable created.', 'info');
  }

  connectConnectable() {
    if (!this.connectableSource$) {
      this.notificationService.show(
        'Please create the connectable source first.',
        'warning',
      );
      return;
    }
    this.connectableSubscription = this.connectableSource$.connect();
    this.notificationService.show('Connected to the source!', 'success');
  }

  addSubscriber(type: ExampleType) {
    const isSubject =
      type !== 'cold' && type !== 'hot' && type !== 'connectable';
    const subject = isSubject ? this.getSubject(type) : null;
    if (isSubject && !subject) {
      this.notificationService.show(
        `Please create the ${type} first.`,
        'warning',
      );
      return;
    }
    if (type === 'connectable' && !this.connectableSource$) {
      this.notificationService.show(
        'Please create the connectable source first.',
        'warning',
      );
      return;
    }

    const subscriberId = `${type}-sub-${this.subscribers()[type].length + 1}`;
    const newSubscriber: Subscriber = {
      id: subscriberId,
      marbles: [],
      subscription: null,
    };
    let stream$: Observable<number>;

    switch (type) {
      case 'cold':
        stream$ = interval(1000).pipe(
          take(5),
          tap((value) => this.addSourceMarble('cold', value, subscriberId)),
        );
        break;
      case 'hot':
        stream$ = this.hotSource$;
        break;
      case 'connectable':
        stream$ = this.connectableSource$!;
        break;
      default:
        stream$ = subject!;
        break;
    }

    this.subscribers.update((s) => ({
      ...s,
      [type]: [...s[type], newSubscriber],
    }));

    newSubscriber.subscription = stream$.subscribe({
      next: (value: number) => {
        this.addSubscriberMarble(type, subscriberId, value);
        this.notificationService.show(
          `${subscriberId} received: ${value}`,
          'success',
        );
      },
      complete: () => {
        this.notificationService.show(`${subscriberId} completed.`, 'warning');
      },
    });

    if (newSubscriber.subscription) {
      this.sourceSubscriptions.push(newSubscriber.subscription);
    }
  }

  reset(type: ExampleType) {
    this.sourceMarbles.update((s) => ({ ...s, [type]: [] }));

    this.subscribers()[type].forEach((sub) => sub.subscription?.unsubscribe());
    this.subscribers.update((s) => ({ ...s, [type]: [] }));

    if (type === 'connectable') {
      this.connectableSubscription?.unsubscribe();
      this.connectableSource$ = null;
    } else if (type !== 'cold' && type !== 'hot') {
      const subject = this.getSubject(type);
      subject?.complete();
      this.setSubject(type, null);
      this.isSubjectCreated.update((s) => ({
        ...s,
        [type as SubjectType]: false,
      }));
      this.valueCounters[type as SubjectType] = 0;
    }
    if (type === 'replaySubject') this.replaySubjectBuffer.set([]);
  }

  private getSubject(type: SubjectType) {
    return this[type] as Subject<number> | null;
  }

  private setSubject(type: SubjectType, value: any) {
    (this[type] as any) = value;
  }

  // --- Marble and Logging Helpers ---
  private addSourceMarble(type: ExampleType, value: number, subId?: string) {
    const color = this.colors[value % this.colors.length];
    const marble: Marble = { id: this.marbleCounter++, value, color };
    this.sourceMarbles.update((s) => ({ ...s, [type]: [...s[type], marble] }));
  }

  private addSubscriberMarble(
    type: ExampleType,
    subscriberId: string,
    value: number,
  ) {
    const color = this.colors[value % this.colors.length];
    const marble: Marble = { id: this.marbleCounter++, value, color };
    this.subscribers.update((s) => ({
      ...s,
      [type]: s[type].map((sub) =>
        sub.id === subscriberId
          ? { ...sub, marbles: [...sub.marbles, marble] }
          : sub,
      ),
    }));
  }

  // --- Input Handlers ---
  onReplayBufferSizeChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.replayBufferSize.set(val);
      this.reset('replaySubject');
    }
  }
  onBehaviorInitialValueChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.behaviorInitialValue.set(val);
      this.reset('behaviorSubject');
    }
  }
}
