import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FinancialStore } from '../../financial.store';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-floating-scenario-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="floating-widget" [class.expanded]="isOpen()">
      <div class="fab-scrim" [class.show]="isOpen()" (click)="close()"></div>

      @if (isOpen()) {
        <div class="fab-panel">
          <div class="panel-header">
            <span>Switch Scenario</span>
            <button class="panel-close" (click)="close()">✕</button>
          </div>
          <div class="panel-search">
            <input
              type="text"
              placeholder="Search scenarios…"
              [(ngModel)]="searchQuery"
              (keydown)="$event.stopPropagation()"
            />
          </div>
          <div class="panel-list">
            @for (s of filteredScenarios(); track s.id) {
              <div
                class="panel-item"
                [class.active]="s.id === store.activeScenarioId()"
                (click)="select(s.id)"
              >
                <span class="item-name">{{ s.name }}</span>
                @if (s.id === store.activeScenarioId()) {
                  <span class="item-check">✓</span>
                }
              </div>
            }
            @if (filteredScenarios().length === 0) {
              <div class="panel-empty">No scenarios found</div>
            }
          </div>
          <div class="panel-footer">
            <button class="panel-action" (click)="addNew()">
              + New Scenario
            </button>
          </div>
        </div>
      }

      <button class="fab-btn" (click)="toggle()" title="Switch scenario">
        <span class="fab-icon">📋</span>
        <span class="fab-label">{{
          store.activeScenario()?.name || 'No Scenario'
        }}</span>
        <span class="fab-arrow">{{ isOpen() ? '▼' : '▲' }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .floating-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .fab-scrim {
        position: fixed;
        inset: 0;
        z-index: 8998;
        background: transparent;
        display: none;
      }
      .fab-scrim.show {
        display: block;
      }
      .fab-panel {
        position: absolute;
        bottom: calc(100% + 12px);
        right: 0;
        width: 280px;
        background: var(--surface, #fff);
        border: 1px solid var(--border-light, #e2e8f0);
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        z-index: 8999;
        overflow: hidden;
        animation: panelIn 0.2s ease-out;
      }
      @keyframes panelIn {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 10px;
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--text-main, #1e293b);
      }
      .panel-close {
        background: none;
        border: none;
        font-size: 0.85rem;
        color: var(--text-muted, #64748b);
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .panel-close:hover {
        background: var(--border-light, #e2e8f0);
      }
      .panel-search {
        padding: 0 16px 10px;
      }
      .panel-search input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-light, #e2e8f0);
        border-radius: 10px;
        font-size: 0.8rem;
        background: var(--input-bg, #f8fafc);
        color: var(--text-main, #1e293b);
        outline: none;
        box-sizing: border-box;
      }
      .panel-search input:focus {
        border-color: var(--primary, #4f46e5);
      }
      .panel-list {
        max-height: 240px;
        overflow-y: auto;
        padding: 0 8px 8px;
      }
      .panel-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.82rem;
        color: var(--text-main, #1e293b);
        transition: background 0.15s;
      }
      .panel-item:hover {
        background: var(--primary-light, #e0e7ff);
      }
      .panel-item.active {
        background: var(--primary, #4f46e5);
        color: #fff;
        font-weight: 600;
      }
      .item-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .item-check {
        font-size: 0.75rem;
        margin-left: 8px;
        flex-shrink: 0;
      }
      .panel-empty {
        padding: 20px;
        text-align: center;
        color: var(--text-muted, #64748b);
        font-size: 0.8rem;
      }
      .panel-footer {
        padding: 10px 16px 14px;
        border-top: 1px solid var(--border-light, #e2e8f0);
      }
      .panel-action {
        width: 100%;
        padding: 9px 0;
        border: none;
        border-radius: 10px;
        background: var(--primary, #4f46e5);
        color: #fff;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.2s;
      }
      .panel-action:hover {
        background: var(--primary-hover, #4338ca);
      }
      .fab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border: none;
        border-radius: 100px;
        background: var(--primary, #4f46e5);
        color: #fff;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
        transition: all 0.2s;
        z-index: 8999;
      }
      .fab-btn:hover {
        background: var(--primary-hover, #4338ca);
        box-shadow: 0 6px 24px rgba(79, 70, 229, 0.45);
        transform: translateY(-1px);
      }
      .fab-icon {
        font-size: 1rem;
        line-height: 1;
      }
      .fab-label {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fab-arrow {
        font-size: 0.6rem;
        opacity: 0.7;
      }
    `,
  ],
})
export class FloatingScenarioWidgetComponent {
  store = inject(FinancialStore);
  toast = inject(ToastService);
  router = inject(Router);
  isOpen = signal(false);
  searchQuery = signal('');

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
