import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-whatsapp-hub',
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './whatsapp-hub.component.html',
  styleUrl: './whatsapp-hub.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppHubComponent {
  readonly store = inject(DispatchStore);

  readonly chatModel = signal({
    messageText: '',
  });

  readonly chatForm = form(
    this.chatModel,
    (schema) => {
      required(schema.messageText, { message: 'Message text is required.' });
    },
    {
      submission: {
        action: async () => this.sendMessage(),
      },
    },
  );

  async sendMessage(): Promise<undefined> {
    const text = this.chatModel().messageText.trim();
    if (!text) return undefined;

    this.store.sendWhatsAppMessage(
      this.store.activeWhatsAppChannel(),
      text,
      true,
      `${this.store.activeCoordinator().name} (Coordinator)`,
    );
    this.chatModel.set({ messageText: '' });
    return undefined;
  }

  sendQuickReply(text: string): void {
    this.store.sendWhatsAppMessage(
      this.store.activeWhatsAppChannel(),
      text,
      true,
      `${this.store.activeCoordinator().name} (Coordinator)`,
    );
  }

  convertThirdSpaceOrder(): void {
    this.store.createOrderFromMessage(
      'Third Space Luxury Health Club',
      'spa_gym',
      '67-71 Brewer St, London W1F 9US',
      '16:30',
    );
  }

  addQuickDemoOrder(): void {
    const clients = [
      {
        name: 'The Ritz London (Rivoli Bar)',
        sector: 'hotel' as const,
        address: '150 Piccadilly, W1J 9BR',
      },
      {
        name: 'Flat Iron Steak Soho',
        sector: 'restaurant' as const,
        address: '17 Beak St, W1F 9RW',
      },
      {
        name: 'Mayfair Townhouse Airbnb',
        sector: 'airbnb' as const,
        address: '27 Half Moon St, W1J 7BG',
      },
    ];
    const pick = clients[Math.floor(Math.random() * clients.length)];
    this.store.sendWhatsAppMessage(
      'customers',
      `Urgent request from ${pick.name}: We need an express collection of 3 hampers of soiled linen and dinner napkins by 15:45 please.`,
      false,
      pick.name,
    );
  }
}
