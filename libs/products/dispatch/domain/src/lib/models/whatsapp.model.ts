export type WhatsAppChannelType = 'customers' | 'drivers' | 'production';

export interface WhatsAppSuggestedAction {
  type:
    'create_order' | 'reassign_driver' | 'emergency_courier' | 'quality_claim';
  label: string;
  payload: Record<string, unknown>;
}

export interface WhatsAppMessage {
  id: string;
  channel: WhatsAppChannelType;
  senderName: string;
  senderPhone?: string;
  senderRole: string; // e.g. "General Manager · The Savoy", "Driver · Central", "Plant Manager · Thames Valley"
  timestamp: string; // e.g. "11:42"
  text: string;
  isCoordinator: boolean;
  orderIdRef?: string;
  suggestedAction?: WhatsAppSuggestedAction;
}
