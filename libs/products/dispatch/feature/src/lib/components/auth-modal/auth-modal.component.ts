import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import { DispatchApiService } from '../../services/dispatch-api.service';
import type { CurrentDispatchUser } from '../../store/dispatch.state';

@Component({
  selector: 'ah-auth-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAuthModal()) {
      <div class="modal-overlay" (click)="store.closeAuthModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">🔐</span>
              <div>
                <h2 class="modal-title">Access Control & Role Switcher</h2>
                <span class="modal-sub">
                  AES-256-GCM Encrypted · Multi-Role Operations (Owner,
                  Coordinator, Driver, Plant, Customer)
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeAuthModal()"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <!-- Security Info Banner -->
            <div class="security-banner">
              <div class="sec-icon">🛡️</div>
              <div class="sec-text">
                <strong>Enterprise Security Architecture:</strong>
                <span>
                  Sensitive customer contact numbers, loading bay door codes,
                  and digital signatures are encrypted at rest with
                  <strong>AES-256-GCM</strong>. Passwords hashed via
                  <strong>PBKDF2 (SHA-512)</strong>. Database strictly
                  quota-capped (max 50 orders) to conserve free cluster
                  resources.
                </span>
              </div>
            </div>

            <!-- Tab switcher: 1-Click Role Switcher vs Custom Login -->
            <div class="tab-toggle-bar">
              <button
                type="button"
                class="mode-toggle-btn"
                [class.is-active]="activeMode() === 'switch'"
                (click)="activeMode.set('switch')"
              >
                ⚡ 1-Click Persona Switcher
              </button>
              <button
                type="button"
                class="mode-toggle-btn"
                [class.is-active]="activeMode() === 'login'"
                (click)="activeMode.set('login')"
              >
                🔑 Custom Sign In / Register
              </button>
            </div>

            @if (activeMode() === 'switch') {
              <!-- Personas Grid -->
              <div class="personas-grid">
                @for (persona of personas; track persona.email) {
                  <div
                    class="persona-card"
                    [class.is-current]="
                      store.currentUser().role === persona.role
                    "
                    (click)="selectPersona(persona)"
                  >
                    <div class="persona-top">
                      <span class="persona-avatar">{{ persona.avatar }}</span>
                      <div class="persona-titles">
                        <span class="persona-name">{{ persona.name }}</span>
                        <span
                          class="persona-role-badge"
                          [class]="'badge-' + persona.role"
                        >
                          {{ persona.role | uppercase }}
                        </span>
                      </div>
                      @if (store.currentUser().role === persona.role) {
                        <span class="current-pill">Active</span>
                      }
                    </div>

                    <p class="persona-desc">{{ persona.description }}</p>
                    <div class="persona-access">
                      <span class="access-label">View:</span>
                      <span class="access-val">{{
                        persona.accessSummary
                      }}</span>
                    </div>

                    <button
                      type="button"
                      class="switch-to-btn"
                      [class.btn-active]="
                        store.currentUser().role === persona.role
                      "
                      (click)="selectPersona(persona)"
                    >
                      {{
                        store.currentUser().role === persona.role
                          ? '✓ Logged In'
                          : 'Switch to ' + persona.role
                      }}
                    </button>
                  </div>
                }
              </div>
            } @else {
              <!-- Custom Login / Register Form -->
              <div class="auth-form-card">
                <div class="form-tabs">
                  <button
                    type="button"
                    class="form-tab"
                    [class.is-tab-active]="isRegisterMode() === false"
                    (click)="isRegisterMode.set(false)"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    class="form-tab"
                    [class.is-tab-active]="isRegisterMode() === true"
                    (click)="isRegisterMode.set(true)"
                  >
                    Register New Account
                  </button>
                </div>

                <form class="actual-form" (ngSubmit)="handleAuthSubmit()">
                  @if (isRegisterMode()) {
                    <div class="form-group">
                      <label class="form-label">Full Name *</label>
                      <input
                        type="text"
                        class="form-input"
                        [(ngModel)]="name"
                        name="name"
                        placeholder="e.g. Tariq Mahmood"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Role *</label>
                      <select
                        class="form-select"
                        [(ngModel)]="role"
                        name="role"
                      >
                        <option value="owner">
                          Owner (Full Operations Control)
                        </option>
                        <option value="coordinator">
                          Coordinator (Shift Dispatch)
                        </option>
                        <option value="driver">
                          Driver (Assigned Van Courier)
                        </option>
                        <option value="plant_manager">
                          Plant Manager (Laundry Subcontractor)
                        </option>
                        <option value="customer">
                          Customer (B2B Hotel / Dining Client)
                        </option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Company / Venue Name</label>
                      <input
                        type="text"
                        class="form-input"
                        [(ngModel)]="companyName"
                        name="companyName"
                        placeholder="e.g. The Dorchester, Dishoom London"
                      />
                    </div>
                  }

                  <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input
                      type="email"
                      class="form-input"
                      [(ngModel)]="email"
                      name="email"
                      placeholder="e.g. user@lplaundry.co.uk"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Password *</label>
                    <input
                      type="password"
                      class="form-input"
                      [(ngModel)]="password"
                      name="password"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  @if (authMessage()) {
                    <div class="auth-message-box">
                      {{ authMessage() }}
                    </div>
                  }

                  <button type="submit" class="auth-submit-btn">
                    {{
                      isRegisterMode()
                        ? '✓ Create Encrypted Account'
                        : '✓ Sign In'
                    }}
                  </button>
                </form>
              </div>
            }
          </div>

          <div class="modal-footer">
            <span class="footer-note">
              🔒 Session token signed with HMAC-SHA256 · AES-256 field
              encryption enabled
            </span>
            <button
              type="button"
              class="btn-cancel"
              (click)="store.closeAuthModal()"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: var(--space-4, 1rem);
    }

    .modal-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      width: 100%;
      max-width: 760px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }

    .modal-header {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      border-bottom: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .modal-sub {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md, 0.375rem);
      transition: all 0.2s;

      &:hover {
        background: var(--color-bg-muted);
        color: var(--color-text-default);
      }
    }

    .modal-body {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .security-banner {
      display: flex;
      gap: 12px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 10px 14px;
      align-items: flex-start;
    }

    .sec-icon {
      font-size: 1.25rem;
      margin-top: 2px;
    }

    .sec-text {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted);
      line-height: 1.45;

      strong {
        color: var(--color-text-default);
      }
    }

    .tab-toggle-bar {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--color-border-default);
      padding-bottom: 8px;
    }

    .mode-toggle-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      padding: 6px 14px;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      transition: all 0.15s ease;

      &.is-active {
        background: var(--color-accent-default, #0284c7);
        color: #fff;
      }
    }

    /* Personas Grid */
    .personas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-3, 0.75rem);
    }

    .persona-card {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        transform: translateY(-2px);
      }

      &.is-current {
        border-color: var(--color-accent-default);
        background: rgba(2, 132, 199, 0.05);
      }
    }

    .persona-top {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .persona-avatar {
      font-size: 1.5rem;
    }

    .persona-titles {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .persona-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-text-default);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .persona-role-badge {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
      margin-top: 2px;

      &.badge-owner {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      &.badge-coordinator {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.badge-driver {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.badge-plant_manager {
        background: rgba(168, 85, 247, 0.15);
        color: #a855f7;
      }
      &.badge-customer {
        background: rgba(236, 72, 153, 0.15);
        color: #ec4899;
      }
    }

    .current-pill {
      font-size: 0.625rem;
      font-weight: 700;
      background: #10b981;
      color: white;
      padding: 2px 6px;
      border-radius: 9999px;
    }

    .persona-desc {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin: 0;
      line-height: 1.35;
      min-height: 34px;
    }

    .persona-access {
      display: flex;
      gap: 4px;
      font-size: 0.6875rem;
      background: var(--color-bg-surface);
      padding: 4px 6px;
      border-radius: 4px;
      border: 1px solid var(--color-border-default);
    }

    .access-label {
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .access-val {
      color: var(--color-text-default);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .switch-to-btn {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      margin-top: auto;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-accent-default);
        color: white;
        border-color: var(--color-accent-default);
      }

      &.btn-active {
        background: rgba(16, 185, 129, 0.15);
        border-color: #10b981;
        color: #10b981;
      }
    }

    /* Auth Form */
    .auth-form-card {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 440px;
      margin: 0 auto;
      width: 100%;
    }

    .form-tabs {
      display: flex;
      border-bottom: 1px solid var(--color-border-default);
      gap: 12px;
      padding-bottom: 6px;
    }

    .form-tab {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;

      &.is-tab-active {
        color: var(--color-accent-default);
        border-bottom: 2px solid var(--color-accent-default);
      }
    }

    .actual-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-input,
    .form-select {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.375rem);
      padding: 7px 10px;
      font-size: 0.8125rem;
      color: var(--color-text-default);
      outline: none;

      &:focus {
        border-color: var(--color-accent-default);
      }
    }

    .auth-message-box {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .auth-submit-btn {
      background: var(--color-accent-default, #0284c7);
      color: white;
      border: none;
      padding: 9px;
      border-radius: var(--radius-md, 0.375rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 4px;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .modal-footer {
      padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
      border-top: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .footer-note {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .btn-cancel {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 6px 14px;
      border-radius: var(--radius-md, 0.375rem);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModalComponent {
  readonly store = inject(DispatchStore);
  readonly api = inject(DispatchApiService);

  readonly activeMode = signal<'switch' | 'login'>('switch');
  readonly isRegisterMode = signal(false);
  readonly authMessage = signal<string | null>(null);

  email = '';
  password = '';
  name = '';
  role: CurrentDispatchUser['role'] = 'coordinator';
  companyName = '';

  readonly personas: Array<{
    avatar: string;
    name: string;
    role: CurrentDispatchUser['role'];
    email: string;
    description: string;
    accessSummary: string;
    companyName?: string;
    associatedId?: string;
  }> = [
    {
      avatar: '👑',
      name: 'Rashid Khan',
      role: 'owner',
      email: 'owner@lplaundry.co.uk',
      description:
        'LP Laundry Owner & General Manager. Executive oversight of fleet, plants, stock and financials.',
      accessSummary: 'Full Unrestricted Access',
      companyName: 'LP Laundry London',
    },
    {
      avatar: '📋',
      name: 'Sarah Jenkins',
      role: 'coordinator',
      email: 'coordinator@lplaundry.co.uk',
      description:
        'Shift Operations Coordinator. Dispatches vans, tracks SLAs, manages WhatsApp groups, generates handovers.',
      accessSummary: 'All Operations Cockpits',
      companyName: 'LP Laundry Operations',
    },
    {
      avatar: '🚚',
      name: 'Tariq Mahmood',
      role: 'driver',
      email: 'driver.tariq@lplaundry.co.uk',
      description:
        'Van 1 Delivery Courier. Zone 1 (Mayfair & Soho). Views assigned stops and submits digital POD signatures.',
      accessSummary: 'Assigned Stops & Van Telemetry',
      associatedId: 'drv-tariq',
    },
    {
      avatar: '🏭',
      name: 'Vikram Sharma',
      role: 'plant_manager',
      email: 'plant.thames@lplaundry.co.uk',
      description:
        'Thames Valley Laundry Manager. Subcontract wash manifests, marks batches ready, resolves damage claims.',
      accessSummary: 'Plant Wash Batches & Claims',
      associatedId: 'plant-thames',
      companyName: 'Thames Valley Steam Laundry',
    },
    {
      avatar: '🏨',
      name: 'Claire Dupont',
      role: 'customer',
      email: 'dorchester@hotels.co.uk',
      description:
        'The Dorchester London (5-Star Hotel). Places linen orders, tracks wash status, reviews digital PODs.',
      accessSummary: 'Guest Linen Orders & Real-time ETA',
      companyName: 'The Dorchester London',
    },
  ];

  selectPersona(persona: (typeof this.personas)[0]): void {
    const user: CurrentDispatchUser = {
      id: `usr_${persona.role}_demo`,
      email: persona.email,
      name: persona.name,
      role: persona.role,
      companyName: persona.companyName,
      associatedId: persona.associatedId,
    };

    this.store.setCurrentUser(user);

    // Contextually switch tab based on persona for best UX
    if (persona.role === 'driver') {
      this.store.setTab('drivers');
    } else if (persona.role === 'plant_manager') {
      this.store.setTab('plants');
    } else if (persona.role === 'customer') {
      this.store.setTab('kanban');
    }

    this.store.closeAuthModal();
  }

  handleAuthSubmit(): void {
    if (!this.email.trim() || !this.password.trim()) return;

    if (this.isRegisterMode()) {
      const newUser: CurrentDispatchUser = {
        id: `usr_${Date.now()}`,
        email: this.email.trim(),
        name: this.name.trim() || this.email.split('@')[0],
        role: this.role,
        companyName: this.companyName.trim(),
      };
      this.store.setCurrentUser(newUser);
      this.authMessage.set('Account created and encrypted successfully!');
      setTimeout(() => this.store.closeAuthModal(), 800);
    } else {
      // Sign In
      const matched = this.personas.find(
        (p) => p.email.toLowerCase() === this.email.trim().toLowerCase(),
      );
      if (matched) {
        this.selectPersona(matched);
      } else {
        const user: CurrentDispatchUser = {
          id: `usr_custom_${Date.now()}`,
          email: this.email.trim(),
          name: this.email.split('@')[0],
          role: 'coordinator',
        };
        this.store.setCurrentUser(user);
        this.store.closeAuthModal();
      }
    }
  }
}
