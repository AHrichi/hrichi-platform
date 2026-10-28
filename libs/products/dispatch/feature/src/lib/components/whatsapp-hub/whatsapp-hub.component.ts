import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { WhatsAppChannelType } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-whatsapp-hub',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="whatsapp-card">
      <div class="whatsapp-layout">
        <!-- Sidebar: 3 Channels -->
        <aside class="channels-sidebar">
          <div class="sidebar-header">
            <div class="wa-brand">
              <span class="wa-icon">💬</span>
              <div>
                <span class="wa-title">WhatsApp Business Hub</span>
                <span class="wa-sub">3 Managed Team Groups</span>
              </div>
            </div>
          </div>

          <div class="channel-list" role="tablist">
            <!-- Channel 1: Customers -->
            <button
              type="button"
              class="channel-item"
              [class.is-active]="store.activeWhatsAppChannel() === 'customers'"
              (click)="store.setWhatsAppChannel('customers')"
            >
              <div class="channel-avatar cust-avatar">🏨</div>
              <div class="channel-meta">
                <div class="channel-row">
                  <span class="channel-name">Customer Group</span>
                  <span class="channel-time">12:30</span>
                </div>
                <p class="channel-preview">The Savoy, Dishoom, Rosewood...</p>
              </div>
            </button>

            <!-- Channel 2: Drivers -->
            <button
              type="button"
              class="channel-item"
              [class.is-active]="store.activeWhatsAppChannel() === 'drivers'"
              (click)="store.setWhatsAppChannel('drivers')"
            >
              <div class="channel-avatar drv-avatar">🚚</div>
              <div class="channel-meta">
                <div class="channel-row">
                  <span class="channel-name">Drivers Fleet</span>
                  <span class="channel-time">12:16</span>
                </div>
                <p class="channel-preview">Tariq, Liam, Harpreet, Carlos...</p>
              </div>
            </button>

            <!-- Channel 3: Production -->
            <button
              type="button"
              class="channel-item"
              [class.is-active]="store.activeWhatsAppChannel() === 'production'"
              (click)="store.setWhatsAppChannel('production')"
            >
              <div class="channel-avatar prod-avatar">🏭</div>
              <div class="channel-meta">
                <div class="channel-row">
                  <span class="channel-name">Production Subcontractors</span>
                  <span class="channel-time">12:05</span>
                </div>
                <p class="channel-preview">Thames Valley, Apex Clean...</p>
              </div>
            </button>
          </div>

          <!-- Coordinator Notice -->
          <div class="coordinator-tip">
            <span class="tip-icon">💡</span>
            <p>
              Incoming WhatsApp order requests can be converted into active jobs
              with 1-click.
            </p>
          </div>
        </aside>

        <!-- Main Chat Area -->
        <main class="chat-area">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="active-contact-info">
              <span class="active-avatar">
                {{
                  store.activeWhatsAppChannel() === 'customers'
                    ? '🏨'
                    : store.activeWhatsAppChannel() === 'drivers'
                      ? '🚚'
                      : '🏭'
                }}
              </span>
              <div>
                <h2 class="active-title">
                  {{
                    store.activeWhatsAppChannel() === 'customers'
                      ? 'London Hospitality & B2B Customers'
                      : store.activeWhatsAppChannel() === 'drivers'
                        ? 'London Fleet Dispatch & Drivers'
                        : 'Subcontractor Laundry Plant Managers'
                  }}
                </h2>
                <span class="online-indicator">
                  <span class="green-dot"></span> Online · Coordinator
                  {{ store.activeCoordinator().name }} active
                </span>
              </div>
            </div>

            <div class="chat-header-actions">
              <button
                type="button"
                class="quick-action-pill"
                (click)="addQuickDemoOrder()"
              >
                + Simulate New Customer Order
              </button>
            </div>
          </div>

          <!-- Message Stream -->
          <div class="messages-viewport" #scrollViewport>
            @for (msg of store.channelMessages(); track msg.id) {
              <div
                class="message-wrapper"
                [class.is-coordinator]="msg.isCoordinator"
              >
                <div
                  class="message-bubble"
                  [class.is-coord-bubble]="msg.isCoordinator"
                >
                  <div class="msg-header">
                    <span class="msg-sender">{{ msg.senderName }}</span>
                    <span class="msg-role">{{ msg.senderRole }}</span>
                    <span class="msg-time">{{ msg.timestamp }}</span>
                  </div>

                  <p class="msg-text">{{ msg.text }}</p>

                  <!-- Embedded Action Card (If present) -->
                  @if (msg.suggestedAction; as action) {
                    <div class="action-card">
                      <div class="action-card-header">
                        <span class="action-card-icon">⚡</span>
                        <span class="action-card-title"
                          >Coordinator Action Suggested:</span
                        >
                      </div>

                      @if (action.type === 'create_order') {
                        <p class="action-desc">
                          Emergency Top-Up requested for
                          <strong>Third Space Soho</strong>. Convert this
                          WhatsApp request to a confirmed job in the Kanban.
                        </p>
                        <button
                          type="button"
                          class="action-btn-convert"
                          (click)="convertThirdSpaceOrder()"
                        >
                          ✓ Convert to Live Job & Assign Standby Driver
                        </button>
                      }

                      @if (action.type === 'emergency_courier') {
                        <p class="action-desc">
                          Rosewood VIP check-in at risk due to vehicle
                          breakdown.
                        </p>
                        <button
                          type="button"
                          class="action-btn-emergency"
                          (click)="
                            store.dispatchEmergencyCourier(
                              'ORD-8403',
                              'Gophr London Rapid Courier'
                            )
                          "
                        >
                          🚨 Book Emergency Courier (Gophr - 25m ETA)
                        </button>
                      }

                      @if (action.type === 'reassign_driver') {
                        <p class="action-desc">
                          Van 3 broken down on A40 Western Ave.
                        </p>
                        <button
                          type="button"
                          class="action-btn-convert"
                          (click)="
                            store.reassignStops('drv-harpreet', 'drv-carlos')
                          "
                        >
                          🔄 Reroute Stops to Standby Carlos
                        </button>
                      }

                      @if (action.type === 'quality_claim') {
                        <p class="action-desc">
                          8 burnt/damaged napkins from Gymkhana reported by Apex
                          plant.
                        </p>
                        <button
                          type="button"
                          class="action-btn-claim"
                          (click)="
                            store.logQualityClaim(
                              'plant-apex',
                              'Gymkhana Restaurant',
                              'TAB-NAP-WHT',
                              8,
                              'torn_damaged'
                            )
                          "
                        >
                          📝 Log Damage Claim & Credit Note (£28.00)
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-chat-state">
                <span class="empty-chat-icon">💬</span>
                <h4 class="empty-chat-title">
                  No messages in this WhatsApp group
                </h4>
                <p class="empty-chat-desc">
                  Broadcast a dispatch update, use canned coordinator replies
                  below, or simulate an incoming customer order message.
                </p>
                <button
                  type="button"
                  class="empty-sim-btn"
                  (click)="addQuickDemoOrder()"
                >
                  + Simulate Incoming Customer Message
                </button>
              </div>
            }
          </div>

          <!-- Quick Reply Chips -->
          <div class="quick-replies-bar">
            <span class="replies-label">Quick Responses:</span>
            <button
              type="button"
              class="reply-chip"
              (click)="
                sendQuickReply(
                  'Driver is en-route, ETA approximately 12 minutes.'
                )
              "
            >
              "Driver 12m away"
            </button>
            <button
              type="button"
              class="reply-chip"
              (click)="
                sendQuickReply(
                  'Order confirmed for pickup. Assigned to driver manifest.'
                )
              "
            >
              "Order confirmed"
            </button>
            <button
              type="button"
              class="reply-chip"
              (click)="
                sendQuickReply(
                  'Linen is currently in the drying cycle at the plant. Expected ready by 14:00.'
                )
              "
            >
              "Plant status: Drying"
            </button>
            <button
              type="button"
              class="reply-chip"
              (click)="
                sendQuickReply(
                  'Signed Proof of Delivery received and logged in system.'
                )
              "
            >
              "POD logged"
            </button>
          </div>

          <!-- Message Input Bar -->
          <form class="chat-input-bar" (ngSubmit)="sendMessage()">
            <input
              type="text"
              class="chat-input"
              [(ngModel)]="newMessageText"
              name="messageText"
              placeholder="Type message to {{
                store.activeWhatsAppChannel()
              }} group as {{ store.activeCoordinator().name }}..."
            />
            <button
              type="submit"
              class="send-btn"
              [disabled]="!newMessageText.trim()"
            >
              Send ➤
            </button>
          </form>
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .whatsapp-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .whatsapp-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      min-height: 620px;
    }

    /* Channels Sidebar */
    .channels-sidebar {
      background: var(--color-bg-canvas);
      border-right: 1px solid var(--color-border-default);
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border-default);
    }

    .wa-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .wa-icon {
      font-size: 1.5rem;
    }

    .wa-title {
      display: block;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .wa-sub {
      display: block;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .channel-list {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: var(--space-2, 0.5rem);
      gap: 4px;
    }

    .channel-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-lg, 0.75rem);
      border: 1px solid transparent;
      background: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-bg-surface);
      }

      &.is-active {
        background: var(--color-bg-surface);
        border-color: var(--color-accent-default);
      }
    }

    .channel-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.cust-avatar {
        background: rgba(16, 185, 129, 0.15);
      }
      &.drv-avatar {
        background: rgba(59, 130, 246, 0.15);
      }
      &.prod-avatar {
        background: rgba(245, 158, 11, 0.15);
      }
    }

    .channel-meta {
      flex: 1;
      min-width: 0;
    }

    .channel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .channel-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-default);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .channel-time {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .channel-preview {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .coordinator-tip {
      margin: var(--space-3, 0.75rem);
      padding: 10px 12px;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: var(--radius-md, 0.5rem);
      display: flex;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--color-text-muted);

      p {
        margin: 0;
        line-height: 1.4;
      }
    }

    /* Main Chat Area */
    .chat-area {
      display: flex;
      flex-direction: column;
      background: var(--color-bg-surface);
    }

    .chat-header {
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-bg-surface);
    }

    .active-contact-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .active-avatar {
      font-size: 1.75rem;
    }

    .active-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .online-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .green-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }

    .quick-action-pill {
      background: rgba(37, 99, 235, 0.1);
      border: 1px solid rgba(37, 99, 235, 0.3);
      color: var(--color-accent-default);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(37, 99, 235, 0.2);
      }
    }

    /* Messages Stream */
    .messages-viewport {
      flex: 1;
      padding: var(--space-4, 1rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      max-height: 440px;
    }

    .empty-chat-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: auto;
      text-align: center;
      max-width: 380px;
      padding: var(--space-6, 1.5rem);
    }

    .empty-chat-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-2, 0.5rem);
      opacity: 0.6;
    }

    .empty-chat-title {
      font-size: var(--text-base, 1rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .empty-chat-desc {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted);
      margin: var(--space-1, 0.25rem) 0 var(--space-3, 0.75rem);
      line-height: 1.4;
    }

    .empty-sim-btn {
      background: var(--color-accent-default, #0284c7);
      color: var(--color-accent-on, #fff);
      border: none;
      padding: 7px 14px;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--text-xs, 0.75rem);
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .message-wrapper {
      display: flex;
      justify-content: flex-start;

      &.is-coordinator {
        justify-content: flex-end;
      }
    }

    .message-bubble {
      max-width: 75%;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 10px 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      &.is-coord-bubble {
        background: rgba(37, 99, 235, 0.08);
        border-color: rgba(37, 99, 235, 0.3);
      }
    }

    .msg-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }

    .msg-sender {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .msg-role {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .msg-time {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin-left: auto;
    }

    .msg-text {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.45;
      color: var(--color-text-default);
    }

    /* Action Card in Bubble */
    .action-card {
      margin-top: 10px;
      padding: 10px 12px;
      background: var(--color-bg-surface);
      border: 1px dashed var(--color-accent-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .action-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .action-card-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-accent-default);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .action-desc {
      margin: 0 0 8px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .action-btn-convert,
    .action-btn-emergency,
    .action-btn-claim {
      width: 100%;
      border: none;
      padding: 8px 12px;
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .action-btn-convert {
      background: #10b981;
      color: white;
    }

    .action-btn-emergency {
      background: #ef4444;
      color: white;
    }

    .action-btn-claim {
      background: #f59e0b;
      color: white;
    }

    /* Quick Replies Bar */
    .quick-replies-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px var(--space-4, 1rem);
      background: var(--color-bg-canvas);
      border-top: 1px solid var(--color-border-default);
      overflow-x: auto;
      white-space: nowrap;
    }

    .replies-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .reply-chip {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: var(--color-text-default);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }

    /* Input Bar */
    .chat-input-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px var(--space-4, 1rem);
      border-top: 1px solid var(--color-border-default);
      background: var(--color-bg-surface);
    }

    .chat-input {
      flex: 1;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 10px 14px;
      font-size: 0.875rem;
      color: var(--color-text-default);

      &:focus {
        outline: none;
        border-color: var(--color-accent-default);
      }
    }

    .send-btn {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
      border: none;
      padding: 10px 18px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }
    }

    @media (max-width: 768px) {
      .whatsapp-layout {
        grid-template-columns: 1fr;
      }

      .channels-sidebar {
        border-right: none;
        border-bottom: 1px solid var(--color-border-default);
      }

      .channel-list {
        flex-direction: row;
        overflow-x: auto;
      }

      .channel-item {
        flex: 1;
        min-width: 220px;
      }

      .coordinator-tip {
        display: none;
      }

      .message-bubble {
        max-width: 90%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppHubComponent {
  readonly store = inject(DispatchStore);
  newMessageText = '';

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (!text) return;

    this.store.sendWhatsAppMessage(
      this.store.activeWhatsAppChannel(),
      text,
      true,
      `${this.store.activeCoordinator().name} (Coordinator)`,
    );
    this.newMessageText = '';
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
