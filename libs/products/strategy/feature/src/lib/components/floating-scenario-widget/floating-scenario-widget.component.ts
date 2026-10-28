import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FinancialStore } from '../../financial.store';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-floating-scenario-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-scenario-widget.component.html',
  styleUrl: './floating-scenario-widget.component.scss',
})
export class FloatingScenarioWidgetComponent {
  store = inject(FinancialStore);
  toast = inject(ToastService);
  router = inject(Router);
  isOpen = signal(false);
  searchQuery = signal('');

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  filteredScenarios = () => {
    const q = this.searchQuery().toLowerCase();
    return this.store
      .scenarios()
      .filter((s) => s.name.toLowerCase().includes(q));
  };

  toggle() {
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) this.searchQuery.set('');
  }
  close() {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  select(id: string) {
    const name = this.store.scenarios().find((s) => s.id === id)?.name || '';
    const url = this.router.url;
    if (url.includes('/editor/')) {
      const match = url.match(/(.*\/editor)\/[^/]+(\/.+)?$/);
      const prefix = match?.[1] || 'editor';
      const suffix = match?.[2] || '/settings';
      this.router.navigate([prefix, id, suffix.replace(/^\//, '')]);
    } else {
      // On other pages: update store directly
      this.store.setActiveScenario(id);
    }
    this.toast.show(`Switched to "${name}"`, 'info');
    this.close();
  }

  addNew() {
    const name = `Scenario ${this.store.scenarios().length + 1}`;
    this.store.addScenario(name);
    const created = this.store.scenarios().find((s) => s.name === name);
    if (created) {
      const url = this.router.url;
      if (url.includes('/editor/')) {
        const match = url.match(/(.*\/editor)/);
        const prefix = match?.[1] || 'editor';
        this.router.navigate([prefix, created.id, 'settings']);
      } else {
        this.store.setActiveScenario(created.id);
      }
    }
    this.toast.show(`Created "${name}"`, 'success');
    this.close();
  }

  @HostListener('keydown.escape') onEscape() {
    this.close();
  }
}
