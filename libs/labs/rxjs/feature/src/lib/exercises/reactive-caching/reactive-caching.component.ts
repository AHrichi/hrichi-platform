// src/app/exercises/reactive-caching/reactive-caching.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
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
import { UserDataService, User } from '../../shared/services/user-data.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

interface LogEntry {
  id: number;
  message: string;
  type: 'cache' | 'network';
}

@Component({
  selector: 'app-reactive-caching',
  standalone: true,
  imports: [
    CommonModule,
    UseCaseFocusComponent,
    AhButton,
    Tag,
    SectionHeading,
    AhMarbleDiagram,
    AhCodeBlock,
  ],
  templateUrl: './reactive-caching.component.html',
  styleUrls: ['./reactive-caching.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveCachingComponent {
  readonly copy = injectRxjsLabCopy();
  private userDataService = inject(UserDataService);
  private notificationService = inject(NotificationService);

  // --- Focus View Options ---
  readonly focusOptions = computed<readonly SegmentedOption<string>[]>(() => {
    const opts = this.copy().reactiveCaching.focusOptions;
    return [
      { value: 'all', label: opts.all },
      { value: 'user-1', label: opts.user1 },
      { value: 'user-2', label: opts.user2 },
      { value: 'user-3', label: opts.user3 },
    ];
  });
  readonly activeCase = signal<string>('all');

  private cache = new Map<number, Observable<User | undefined>>();
  private logCounter = 0;

  logs = signal<LogEntry[]>([]);
  currentUser = signal<User | undefined>(undefined);
  isLoading = signal(false);
  showCode = signal(false);

  readonly cachingLanes = computed<readonly AhStreamLane[]>(() => {
    const cacheMarbles: AhMarbleItem[] = [];
    const networkMarbles: AhMarbleItem[] = [];

    this.logs().forEach((log, idx) => {
      const pos = Math.min(15 + idx * 14, 94);
      if (log.type === 'network') {
        networkMarbles.push({
          id: `net-${log.id}`,
          value: 'HTTP',
          positionPercent: pos,
          variant: 'info',
          tooltip: log.message,
        });
      } else {
        cacheMarbles.push({
          id: `cache-${log.id}`,
          value: 'CACHE',
          positionPercent: pos,
          variant: 'success',
          tooltip: log.message,
        });
      }
    });

    const c = this.copy().reactiveCaching;
    return [
      {
        id: 'network-lane',
        label: c.networkLaneLabel,
        badge: c.networkLaneBadge,
        marbles: networkMarbles,
      },
      {
        id: 'cache-lane',
        label: c.cacheLaneLabel,
        badge: c.cacheLaneBadge,
        isPrimary: true,
        marbles: cacheMarbles,
      },
    ];
  });

  readonly cachingOperator = computed<AhOperatorTransform>(() => {
    const c = this.copy().reactiveCaching;
    return {
      name: 'shareReplay({ bufferSize: 1, refCount: false })',
      description: c.operatorDescription,
      formula: c.operatorFormula,
    };
  });

  readonly codeSnippet = `// ⚡ Production Pattern: In-Memory Stream Cache with shareReplay
@Injectable({ providedIn: 'root' })
export class CatalogCacheService {
  private cache = new Map<string, Observable<Product[]>>();

  getProductsByCategory(category: string): Observable<Product[]> {
    if (!this.cache.has(category)) {
      const stream$ = this.http.get<Product[]>(\`/api/products?cat=\${category}\`).pipe(
        // bufferSize: 1 keeps latest value for late subscribers.
        // refCount: false preserves cache even when all components unmount.
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          this.cache.delete(category); // Do NOT cache failed responses!
          return throwError(() => err);
        })
      );
      this.cache.set(category, stream$);
    }
    return this.cache.get(category)!;
  }

  invalidate(category?: string) {
    if (category) this.cache.delete(category);
    else this.cache.clear();
  }
}`;

  toggleCode() {
    this.showCode.update((v) => !v);
  }

  constructor() {
    effect(() => {
      const active = this.activeCase();
      if (active === 'user-1') this.fetchUser(1);
      else if (active === 'user-2') this.fetchUser(2);
      else if (active === 'user-3') this.fetchUser(3);
    });
  }

  fetchUser(id: number) {
    this.isLoading.set(true);
    if (this.cache.has(id)) {
      this.addLog(`Fetching User ${id} from CACHE.`, 'cache');
      this.notificationService.show(`User ${id} loaded from cache!`, 'success');
      this.cache.get(id)!.subscribe((user) => {
        this.currentUser.set(user);
        this.isLoading.set(false);
      });
    } else {
      this.addLog(`Fetching User ${id} from NETWORK.`, 'network');
      this.notificationService.show(
        `Making network request for User ${id}...`,
        'info',
      );

      const newUser$ = this.userDataService.getUser(id).pipe(
        tap(() => this.isLoading.set(false)),
        catchError(() => {
          this.isLoading.set(false);
          this.notificationService.show(`Failed to fetch User ${id}`, 'error');
          return of(undefined);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

      this.cache.set(id, newUser$);
      newUser$.subscribe((user) => {
        this.currentUser.set(user);
      });
    }
  }

  clearCache() {
    this.cache.clear();
    this.logs.set([]);
    this.currentUser.set(undefined);
    this.notificationService.show('Cache cleared!', 'warning');
  }

  private addLog(message: string, type: 'cache' | 'network') {
    const newLog: LogEntry = { id: this.logCounter++, message, type };
    this.logs.update((currentLogs) => [newLog, ...currentLogs]);
  }
}
