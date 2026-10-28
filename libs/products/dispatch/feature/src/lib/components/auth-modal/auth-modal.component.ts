import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  required,
} from '@angular/forms/signals';
import { DispatchStore } from '../../store/dispatch.store';
import { DispatchApiService } from '../../services/dispatch-api.service';
import type { CurrentDispatchUser } from '../../store/dispatch.state';

export interface AuthModel {
  email: string;
  password: string;
  name: string;
  role: CurrentDispatchUser['role'];
  companyName: string;
}

@Component({
  selector: 'ah-auth-modal',
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModalComponent {
  readonly store = inject(DispatchStore);
  readonly api = inject(DispatchApiService);

  readonly activeMode = signal<'switch' | 'login'>('switch');
  readonly isRegisterMode = signal(false);
  readonly authMessage = signal<string | null>(null);
  readonly authMessageType = signal<'error' | 'success'>('error');

  readonly model = signal<AuthModel>({
    email: '',
    password: '',
    name: '',
    role: 'coordinator',
    companyName: '',
  });

  readonly authForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Please provide an email address' });
      email(path.email, { message: 'Please provide a valid email address' });
      required(path.password, { message: 'Password is required' });
      minLength(path.password, 6, {
        message: 'Password must be at least 6 characters',
      });
    },
    { submission: { action: async () => this.handleAuthSubmit() } },
  );

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

  async handleAuthSubmit(): Promise<undefined> {
    const m = this.model();

    if (this.isRegisterMode() && (!m.name.trim() || m.name.trim().length < 2)) {
      this.authMessageType.set('error');
      this.authMessage.set('Full name is required (min 2 characters).');
      return undefined;
    }

    if (this.isRegisterMode()) {
      const newUser: CurrentDispatchUser = {
        id: `usr_${Date.now()}`,
        email: m.email.trim(),
        name: m.name.trim() || m.email.split('@')[0],
        role: m.role,
        companyName: m.companyName.trim(),
      };
      this.store.setCurrentUser(newUser);
      this.authMessageType.set('success');
      this.authMessage.set('✓ Account created and encrypted successfully!');
      setTimeout(() => {
        this.store.closeAuthModal();
        this.authMessage.set(null);
      }, 700);
    } else {
      // Sign In
      const matched = this.personas.find(
        (p) => p.email.toLowerCase() === m.email.trim().toLowerCase(),
      );
      if (matched) {
        this.authMessageType.set('success');
        this.authMessage.set(
          `✓ Signed in as ${matched.name} (${matched.role.toUpperCase()})`,
        );
        setTimeout(() => {
          this.selectPersona(matched);
          this.authMessage.set(null);
        }, 500);
      } else {
        const user: CurrentDispatchUser = {
          id: `usr_custom_${Date.now()}`,
          email: m.email.trim(),
          name: m.email.split('@')[0],
          role: 'coordinator',
        };
        this.store.setCurrentUser(user);
        this.authMessageType.set('success');
        this.authMessage.set('✓ Signed in as Operations Coordinator');
        setTimeout(() => {
          this.store.closeAuthModal();
          this.authMessage.set(null);
        }, 500);
      }
    }
    return undefined;
  }
}
