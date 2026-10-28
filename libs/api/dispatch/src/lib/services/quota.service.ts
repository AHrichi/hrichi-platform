import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Collection } from 'mongodb';

export const DISPATCH_QUOTAS = {
  MAX_ORDERS: 50,
  MAX_DRIVERS: 10,
  MAX_PLANTS: 8,
  MAX_STOCK_SKUS: 30,
  MAX_MESSAGES_PER_CHANNEL: 30,
  MAX_HANDOVERS: 20,
  MAX_PAYLOAD_BYTES: 64 * 1024, // 64 KB per document
} as const;

export interface QuotaStatus {
  orders: { current: number; max: number; pct: number };
  drivers: { current: number; max: number; pct: number };
  plants: { current: number; max: number; pct: number };
  stock: { current: number; max: number; pct: number };
  messages: { current: number; max: number; pct: number };
  status: 'safe' | 'warning' | 'near_limit';
}

@Injectable()
export class DispatchQuotaService {
  /**
   * Validates document size to prevent oversized payloads from clogging MongoDB Atlas free tier.
   */
  validatePayloadSize(data: unknown): void {
    const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (size > DISPATCH_QUOTAS.MAX_PAYLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Payload size (${Math.round(size / 1024)}KB) exceeds cluster protection limit of 64KB.`,
      );
    }
  }

  /**
   * Enforces order quota. If orders reach MAX_ORDERS, either prunes oldest delivered orders or warns.
   */
  async checkOrderQuota(
    collection: Collection,
    autoPruneDelivered = true,
  ): Promise<void> {
    const count = await collection.countDocuments();
    if (count >= DISPATCH_QUOTAS.MAX_ORDERS) {
      if (autoPruneDelivered) {
        // Prune the 5 oldest delivered orders to make space
        const delivered = await collection
          .find({ status: 'delivered' })
          .sort({ createdAt: 1 })
          .limit(5)
          .toArray();

        if (delivered.length > 0) {
          const idsToDelete = delivered.map((d) => d['id']);
          await collection.deleteMany({ id: { $in: idsToDelete } });
          return;
        }
      }

      throw new BadRequestException(
        `Database Quota Reached: Maximum limit of ${DISPATCH_QUOTAS.MAX_ORDERS} active orders reached to protect free cluster storage. Please delete or archive existing orders.`,
      );
    }
  }

  async checkDriverQuota(collection: Collection): Promise<void> {
    const count = await collection.countDocuments();
    if (count >= DISPATCH_QUOTAS.MAX_DRIVERS) {
      throw new BadRequestException(
        `Database Quota Reached: Maximum ${DISPATCH_QUOTAS.MAX_DRIVERS} fleet vehicles allowed. Please delete inactive drivers to add new ones.`,
      );
    }
  }

  async checkPlantQuota(collection: Collection): Promise<void> {
    const count = await collection.countDocuments();
    if (count >= DISPATCH_QUOTAS.MAX_PLANTS) {
      throw new BadRequestException(
        `Database Quota Reached: Maximum ${DISPATCH_QUOTAS.MAX_PLANTS} partner laundry facilities allowed on this tier.`,
      );
    }
  }

  async checkStockQuota(collection: Collection): Promise<void> {
    const count = await collection.countDocuments();
    if (count >= DISPATCH_QUOTAS.MAX_STOCK_SKUS) {
      throw new BadRequestException(
        `Database Quota Reached: Maximum ${DISPATCH_QUOTAS.MAX_STOCK_SKUS} linen SKUs allowed in inventory ledger.`,
      );
    }
  }

  /**
   * WhatsApp FIFO Ring Buffer: keeps only the latest N messages per channel.
   */
  async pruneChannelMessages(
    collection: Collection,
    channel: string,
  ): Promise<void> {
    const count = await collection.countDocuments({ channel });
    if (count > DISPATCH_QUOTAS.MAX_MESSAGES_PER_CHANNEL) {
      const excess = count - DISPATCH_QUOTAS.MAX_MESSAGES_PER_CHANNEL;
      const oldest = await collection
        .find({ channel })
        .sort({ createdAt: 1 })
        .limit(excess)
        .toArray();

      if (oldest.length > 0) {
        const ids = oldest.map((m) => m['_id']);
        await collection.deleteMany({ _id: { $in: ids } });
      }
    }
  }
}
