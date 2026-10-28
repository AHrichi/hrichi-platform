// src/app/exercises/reactive-caching/reactive-caching.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
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
  imports: [CommonModule, UseCaseFocusComponent, AhButton, Tag, SectionHeading],
  templateUrl: './reactive-caching.component.html',
  styleUrls: ['./reactive-caching.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveCachingComponent {
  private userDataService = inject(UserDataService);
  private notificationService = inject(NotificationService);

  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Users (1, 2, 3)' },
    { value: 'user-1', label: 'User 1 (Alice)' },
    { value: 'user-2', label: 'User 2 (Bob)' },
    { value: 'user-3', label: 'User 3 (Charlie)' },
  ];
  readonly activeCase = signal<string>('all');

  private cache = new Map<number, Observable<User | undefined>>();
  private logCounter = 0;

  logs = signal<LogEntry[]>([]);
  currentUser = signal<User | undefined>(undefined);
  isLoading = signal(false);

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
