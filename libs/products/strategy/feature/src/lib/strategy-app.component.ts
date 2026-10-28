import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  ActivatedRoute,
} from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { FinancialStore, Account, Transaction } from './financial.store';
import { CalculatorWidgetComponent } from './components/calculator-widget/calculator-widget.component';
import { FloatingScenarioWidgetComponent } from './components/floating-scenario-widget/floating-scenario-widget.component';

interface ElectronWindow extends Window {
  require?: (module: string) => {
    ipcRenderer?: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void;
      send: (channel: string, ...args: unknown[]) => void;
    };
  };
}

@Component({
  selector: 'ah-strategy-app',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CalculatorWidgetComponent,
    FloatingScenarioWidgetComponent,
  ],
  templateUrl: './strategy-app.component.html',
  styleUrls: ['./strategy-app.component.scss'],
})
export class StrategyAppComponent {
  readonly appMode = inject(APP_MODE, { optional: true }) ?? 'standalone';
  readonly isEmbeddedDemo = computed(() => this.appMode === 'embedded-demo');

  themeService = inject(ThemeService);
  toastService = inject(ToastService);
  isDarkMode = this.themeService.isDarkMode;
  store = inject(FinancialStore);

  hasScenarios = computed(() => this.store.scenarios().length > 0);
  showCalculator = signal(false);
  isFullscreen = signal(false);
  router = inject(Router);
  route = inject(ActivatedRoute);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  // ─── Daily Reminder ───
  showDailyReminder = signal(false);

  dismissDailyReminder() {
    localStorage.setItem(
      'daily_reminder_dismissed',
      new Date().toISOString().split('T')[0],
    );
    this.showDailyReminder.set(false);
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async enterFullscreen(): Promise<void> {
    const el =
      this.hostRef.nativeElement.querySelector<HTMLElement>('.theme-wrapper') ??
      this.hostRef.nativeElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        el.classList.add('is-fullscreen');
        this.isFullscreen.set(true);
      }
    } catch {
      el.classList.add('is-fullscreen');
      this.isFullscreen.set(true);
    }
  }

  async exitFullscreen(): Promise<void> {
    const el =
      this.hostRef.nativeElement.querySelector<HTMLElement>('.theme-wrapper') ??
      this.hostRef.nativeElement;
    try {
      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }
    } catch {
      // Ignore exit failures
    }
    el.classList.remove('is-fullscreen');
    this.isFullscreen.set(false);
  }

  goToLedger() {
    this.showDailyReminder.set(false);
    this.router.navigate(['ledger'], { relativeTo: this.route });
  }

  async resetDemo() {
    await this.store.resetDemoData();
    this.toastService.show(
      'Demo scenarios & state have been restored',
      'success',
      3000,
    );
  }

  constructor() {
    try {
      const electronWindow = window as unknown as ElectronWindow;
      const ipc = electronWindow.require?.('electron')?.ipcRenderer;
      if (ipc) {
        ipc.on('app:navigate', (_event: unknown, path: unknown) => {
          if (typeof path === 'string') {
            this.router.navigate([path], { relativeTo: this.route });
          }
        });
      }
    } catch {}

    // Send latest transaction date to main process & show in-app reminder
    effect(() => {
      const txs = this.store.transactions();
      const today = new Date().toISOString().split('T')[0];

      // Send latest transaction date to main process for native notifications
      const dates = txs
        .map((t) => t.date)
        .filter(Boolean)
        .sort()
        .reverse();
      const lastDate = dates.length > 0 ? dates[0] : '';
      try {
        const electronWindow = window as unknown as ElectronWindow;
        const ipc = electronWindow.require?.('electron')?.ipcRenderer;
        if (ipc) ipc.send('daily-reminder:update', { lastDate });
      } catch {}

      // In-app reminder modal
      const dismissed = localStorage.getItem('daily_reminder_dismissed');
      if (dismissed === today) return;
      const hasTodayTx = txs.some((t) => t.date === today);
      if (!hasTodayTx) {
        setTimeout(() => {
          if (!this.showDailyReminder()) {
            this.showDailyReminder.set(true);
          }
        }, 1500);
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (!this.hasScenarios()) return;
      e.preventDefault();
      e.returnValue = '';
    });

    const onFullscreenChange = () => {
      const el =
        this.hostRef.nativeElement.querySelector<HTMLElement>(
          '.theme-wrapper',
        ) ?? this.hostRef.nativeElement;
      const active = this.document.fullscreenElement === el;
      this.isFullscreen.set(active);
      if (!active) {
        el.classList.remove('is-fullscreen');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isFullscreen()) {
        void this.exitFullscreen();
      }
    };

    this.document.addEventListener('fullscreenchange', onFullscreenChange);
    this.document.addEventListener('keydown', onKeyDown);

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
      this.document.removeEventListener('keydown', onKeyDown);
    });
  }

  toggleCalculator() {
    this.showCalculator.update((v) => !v);
  }

  exportJson() {
    const fullState = {
      accounts: this.store.accounts(),
      categories: this.store.categories(),
      currentBalance: this.store.currentBalance(),
      transactions: this.store.transactions(),
      budgets: this.store.budgets(),
      scenarios: this.store.scenarios(),
      activeScenarioId: this.store.activeScenarioId(),
    };
    const jsonStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-strategy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.show('Data exported successfully', 'success');
  }

  importJson(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.scenarios || !data.accounts) {
          throw new Error('Invalid format: missing scenarios or accounts');
        }
        this.store.loadState(data);
        this.toastService.show('Data restored successfully', 'success');
      } catch (err) {
        console.error('Import error:', err);
        this.toastService.show(
          'Failed to import JSON: invalid format',
          'error',
        );
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
