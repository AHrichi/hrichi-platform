// src/app/exercises/reactive-caching/reactive-caching.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, EMPTY, of } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { UserDataService, User } from '../../shared/services/user-data.service';
import { NotificationService } from '../../shared/services/notification.service';

interface LogEntry {
  id: number;
  message: string;
  type: 'cache' | 'network';
}

@Component({
  selector: 'app-reactive-caching',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reactive-caching.component.html',
  styleUrls: ['./reactive-caching.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveCachingComponent {
  private userDataService = inject(UserDataService);
  private notificationService = inject(NotificationService);

  private cache = new Map<number, Observable<User | undefined>>();
  private logCounter = 0;

  logs = signal<LogEntry[]>([]);
  currentUser$ = new Observable<User | undefined>();
  isLoading = signal(false);

  fetchUser(id: number) {
    this.isLoading.set(true);
    if (this.cache.has(id)) {
      this.addLog(`Fetching User ${id} from CACHE.`, 'cache');
      this.notificationService.show(`User ${id} loaded from cache!`, 'success');
      this.currentUser$ = this.cache.get(id)!;
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
      this.currentUser$ = newUser$;
    }
  }

  clearCache() {
    this.cache.clear();
    this.logs.set([]);
    this.currentUser$ = EMPTY;
    this.notificationService.show('Cache cleared!', 'warning');
  }

  private addLog(message: string, type: 'cache' | 'network') {
    const newLog: LogEntry = { id: this.logCounter++, message, type };
    this.logs.update((currentLogs) => [newLog, ...currentLogs]);
  }
}
