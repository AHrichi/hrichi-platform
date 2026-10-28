import { Injectable, Logger } from '@nestjs/common';
import type { Db, Collection } from 'mongodb';
import { DispatchEncryptionService } from '../services/encryption.service';
import {
  DispatchQuotaService,
  DISPATCH_QUOTAS,
  type QuotaStatus,
} from '../services/quota.service';
import type { DispatchUser, UserSessionPayload } from '../models/user.model';
import type {
  Order,
  Driver,
  SubcontractorPlant,
  LinenSKU,
  WhatsAppMessage,
  ShiftHandoverReport,
  QualityClaim,
} from '@ah/products/dispatch/domain';
import {
  INITIAL_ORDERS,
  INITIAL_DRIVERS,
  INITIAL_SUBCONTRACTORS,
  INITIAL_STOCK,
  INITIAL_MESSAGES,
} from '@ah/products/dispatch/domain';

@Injectable()
export class MongoDispatchRepository {
  private readonly logger = new Logger(MongoDispatchRepository.name);

  readonly usersCollection: Collection;
  readonly ordersCollection: Collection;
  readonly driversCollection: Collection;
  readonly plantsCollection: Collection;
  readonly stockCollection: Collection;
  readonly messagesCollection: Collection;
  readonly handoversCollection: Collection;

  constructor(
    db: Db,
    private readonly encryption: DispatchEncryptionService,
    private readonly quota: DispatchQuotaService,
  ) {
    this.usersCollection = db.collection('dispatch_users');
    this.ordersCollection = db.collection('dispatch_orders');
    this.driversCollection = db.collection('dispatch_drivers');
    this.plantsCollection = db.collection('dispatch_plants');
    this.stockCollection = db.collection('dispatch_stock');
    this.messagesCollection = db.collection('dispatch_messages');
    this.handoversCollection = db.collection('dispatch_handovers');
  }

  async ensureIndexes(): Promise<void> {
    try {
      await this.usersCollection.createIndex({ email: 1 }, { unique: true });
      await this.ordersCollection.createIndex({ id: 1 }, { unique: true });
      await this.driversCollection.createIndex({ id: 1 }, { unique: true });
      await this.plantsCollection.createIndex({ id: 1 }, { unique: true });
      await this.stockCollection.createIndex({ sku: 1 }, { unique: true });
      await this.messagesCollection.createIndex({ channel: 1, createdAt: -1 });
      this.logger.log('Dispatch MongoDB indexes ensured.');
    } catch (err) {
      this.logger.warn(`Index initialization notice: ${err}`);
    }
  }

  // --- USERS & AUTH ---

  async createUser(user: DispatchUser): Promise<DispatchUser> {
    this.quota.validatePayloadSize(user);
    const doc = {
      ...user,
      phoneEncrypted: user.phoneEncrypted
        ? this.encryption.encryptField(user.phoneEncrypted)
        : undefined,
    };
    await this.usersCollection.insertOne(doc);
    return user;
  }

  async findUserByEmail(email: string): Promise<DispatchUser | null> {
    const doc = await this.usersCollection.findOne({
      email: email.trim().toLowerCase(),
    });
    if (!doc) return null;
    return {
      ...(doc as unknown as DispatchUser),
      phoneEncrypted: doc['phoneEncrypted']
        ? this.encryption.decryptField(doc['phoneEncrypted'])
        : undefined,
    };
  }

  async findUserById(id: string): Promise<DispatchUser | null> {
    const doc = await this.usersCollection.findOne({ id });
    if (!doc) return null;
    return {
      ...(doc as unknown as DispatchUser),
      phoneEncrypted: doc['phoneEncrypted']
        ? this.encryption.decryptField(doc['phoneEncrypted'])
        : undefined,
    };
  }

  // --- ORDERS ---

  async listOrders(user?: UserSessionPayload): Promise<Order[]> {
    let query: Record<string, unknown> = {};

    // Role-based data partition
    if (user && user.role === 'driver' && user.associatedId) {
      query = { assignedDriverId: user.associatedId };
    } else if (user && user.role === 'customer' && user.companyName) {
      query = { clientName: new RegExp(user.companyName, 'i') };
    } else if (user && user.role === 'plant_manager' && user.associatedId) {
      query = { assignedPlantId: user.associatedId };
    }

    const docs = await this.ordersCollection.find(query).toArray();
    return docs.map((doc) => this.decryptOrder(doc as unknown as Order));
  }

  async findOrderById(id: string): Promise<Order | null> {
    const doc = await this.ordersCollection.findOne({ id });
    if (!doc) return null;
    return this.decryptOrder(doc as unknown as Order);
  }

  async createOrder(order: Order): Promise<Order> {
    this.quota.validatePayloadSize(order);
    await this.quota.checkOrderQuota(this.ordersCollection, true);

    const docToInsert = this.encryptOrder(order);
    await this.ordersCollection.insertOne(docToInsert);
    return order;
  }

  async updateOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
    this.quota.validatePayloadSize(patch);
    const existing = await this.findOrderById(id);
    if (!existing) return null;

    const updated: Order = { ...existing, ...patch };
    const docToSave = this.encryptOrder(updated);

    await this.ordersCollection.updateOne({ id }, { $set: docToSave });
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const res = await this.ordersCollection.deleteOne({ id });
    return res.deletedCount > 0;
  }

  // --- DRIVERS ---

  async listDrivers(): Promise<Driver[]> {
    const docs = await this.driversCollection.find({}).toArray();
    return docs.map((doc) => {
      const d = doc as unknown as Driver;
      return {
        ...d,
        phone: this.encryption.decryptField(d.phone),
      };
    });
  }

  async findDriverById(id: string): Promise<Driver | null> {
    const doc = await this.driversCollection.findOne({ id });
    if (!doc) return null;
    const d = doc as unknown as Driver;
    return {
      ...d,
      phone: this.encryption.decryptField(d.phone),
    };
  }

  async createDriver(driver: Driver): Promise<Driver> {
    this.quota.validatePayloadSize(driver);
    await this.quota.checkDriverQuota(this.driversCollection);

    const doc = {
      ...driver,
      phone: this.encryption.encryptField(driver.phone),
    };
    await this.driversCollection.insertOne(doc);
    return driver;
  }

  async updateDriver(
    id: string,
    patch: Partial<Driver>,
  ): Promise<Driver | null> {
    this.quota.validatePayloadSize(patch);
    const existing = await this.findDriverById(id);
    if (!existing) return null;

    const merged = { ...existing, ...patch };
    const doc = {
      ...merged,
      phone: this.encryption.encryptField(merged.phone),
    };
    await this.driversCollection.updateOne({ id }, { $set: doc });
    return merged;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const res = await this.driversCollection.deleteOne({ id });
    return res.deletedCount > 0;
  }

  // --- SUBCONTRACTOR PLANTS ---

  async listPlants(): Promise<SubcontractorPlant[]> {
    const docs = await this.plantsCollection.find({}).toArray();
    return docs.map((doc) => {
      const p = doc as unknown as SubcontractorPlant;
      return {
        ...p,
        phone: this.encryption.decryptField(p.phone),
      };
    });
  }

  async findPlantById(id: string): Promise<SubcontractorPlant | null> {
    const doc = await this.plantsCollection.findOne({ id });
    if (!doc) return null;
    const p = doc as unknown as SubcontractorPlant;
    return {
      ...p,
      phone: this.encryption.decryptField(p.phone),
    };
  }

  async createPlant(plant: SubcontractorPlant): Promise<SubcontractorPlant> {
    this.quota.validatePayloadSize(plant);
    await this.quota.checkPlantQuota(this.plantsCollection);

    const doc = {
      ...plant,
      phone: this.encryption.encryptField(plant.phone),
    };
    await this.plantsCollection.insertOne(doc);
    return plant;
  }

  async updatePlant(
    id: string,
    patch: Partial<SubcontractorPlant>,
  ): Promise<SubcontractorPlant | null> {
    this.quota.validatePayloadSize(patch);
    const existing = await this.findPlantById(id);
    if (!existing) return null;

    const merged = { ...existing, ...patch };
    const doc = {
      ...merged,
      phone: this.encryption.encryptField(merged.phone),
    };
    await this.plantsCollection.updateOne({ id }, { $set: doc });
    return merged;
  }

  async deletePlant(id: string): Promise<boolean> {
    const res = await this.plantsCollection.deleteOne({ id });
    return res.deletedCount > 0;
  }

  async addPlantClaim(
    plantId: string,
    claim: QualityClaim,
  ): Promise<SubcontractorPlant | null> {
    const plant = await this.findPlantById(plantId);
    if (!plant) return null;

    const claims = [claim, ...(plant.claims || [])];
    return this.updatePlant(plantId, { claims });
  }

  // --- STOCK SKUS ---

  async listStock(): Promise<LinenSKU[]> {
    const docs = await this.stockCollection.find({}).toArray();
    return docs.map((doc) => doc as unknown as LinenSKU);
  }

  async findStockBySku(sku: string): Promise<LinenSKU | null> {
    const doc = await this.stockCollection.findOne({
      sku: sku.trim().toUpperCase(),
    });
    if (!doc) return null;
    return doc as unknown as LinenSKU;
  }

  async createStock(item: LinenSKU): Promise<LinenSKU> {
    this.quota.validatePayloadSize(item);
    await this.quota.checkStockQuota(this.stockCollection);

    await this.stockCollection.insertOne({ ...item });
    return item;
  }

  async updateStock(
    sku: string,
    patch: Partial<LinenSKU>,
  ): Promise<LinenSKU | null> {
    const existing = await this.findStockBySku(sku);
    if (!existing) return null;

    const updated = { ...existing, ...patch };
    await this.stockCollection.updateOne(
      { sku: sku.trim().toUpperCase() },
      { $set: updated },
    );
    return updated;
  }

  async deleteStock(sku: string): Promise<boolean> {
    const res = await this.stockCollection.deleteOne({
      sku: sku.trim().toUpperCase(),
    });
    return res.deletedCount > 0;
  }

  // --- WHATSAPP MESSAGES ---

  async listMessages(channel: string): Promise<WhatsAppMessage[]> {
    const docs = await this.messagesCollection
      .find({ channel })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map((doc) => doc as unknown as WhatsAppMessage);
  }

  async createMessage(msg: WhatsAppMessage): Promise<WhatsAppMessage> {
    this.quota.validatePayloadSize(msg);
    await this.messagesCollection.insertOne({ ...msg });
    await this.quota.pruneChannelMessages(this.messagesCollection, msg.channel);
    return msg;
  }

  // --- SHIFT HANDOVERS ---

  async saveHandover(
    report: ShiftHandoverReport,
  ): Promise<ShiftHandoverReport> {
    this.quota.validatePayloadSize(report);
    await this.handoversCollection.insertOne({ ...report });

    // Keep only last MAX_HANDOVERS
    const count = await this.handoversCollection.countDocuments();
    if (count > DISPATCH_QUOTAS.MAX_HANDOVERS) {
      const oldest = await this.handoversCollection
        .find({})
        .sort({ generatedAt: 1 })
        .limit(count - DISPATCH_QUOTAS.MAX_HANDOVERS)
        .toArray();
      if (oldest.length > 0) {
        await this.handoversCollection.deleteMany({
          _id: { $in: oldest.map((h) => h['_id']) },
        });
      }
    }

    return report;
  }

  async getLatestHandover(): Promise<ShiftHandoverReport | null> {
    const doc = await this.handoversCollection
      .find({})
      .sort({ generatedAt: -1 })
      .limit(1)
      .next();
    if (!doc) return null;
    return doc as unknown as ShiftHandoverReport;
  }

  // --- ADMIN & QUOTA STATS ---

  async getQuotaStatus(): Promise<QuotaStatus> {
    const [ordersCount, driversCount, plantsCount, stockCount, msgsCount] =
      await Promise.all([
        this.ordersCollection.countDocuments(),
        this.driversCollection.countDocuments(),
        this.plantsCollection.countDocuments(),
        this.stockCollection.countDocuments(),
        this.messagesCollection.countDocuments(),
      ]);

    const orderPct = Math.round(
      (ordersCount / DISPATCH_QUOTAS.MAX_ORDERS) * 100,
    );
    const driverPct = Math.round(
      (driversCount / DISPATCH_QUOTAS.MAX_DRIVERS) * 100,
    );
    const plantPct = Math.round(
      (plantsCount / DISPATCH_QUOTAS.MAX_PLANTS) * 100,
    );
    const stockPct = Math.round(
      (stockCount / DISPATCH_QUOTAS.MAX_STOCK_SKUS) * 100,
    );

    const maxPct = Math.max(orderPct, driverPct, plantPct, stockPct);
    const status: QuotaStatus['status'] =
      maxPct > 90 ? 'near_limit' : maxPct > 70 ? 'warning' : 'safe';

    return {
      orders: {
        current: ordersCount,
        max: DISPATCH_QUOTAS.MAX_ORDERS,
        pct: orderPct,
      },
      drivers: {
        current: driversCount,
        max: DISPATCH_QUOTAS.MAX_DRIVERS,
        pct: driverPct,
      },
      plants: {
        current: plantsCount,
        max: DISPATCH_QUOTAS.MAX_PLANTS,
        pct: plantPct,
      },
      stock: {
        current: stockCount,
        max: DISPATCH_QUOTAS.MAX_STOCK_SKUS,
        pct: stockPct,
      },
      messages: {
        current: msgsCount,
        max: DISPATCH_QUOTAS.MAX_MESSAGES_PER_CHANNEL * 3,
        pct: Math.round(
          (msgsCount / (DISPATCH_QUOTAS.MAX_MESSAGES_PER_CHANNEL * 3)) * 100,
        ),
      },
      status,
    };
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.ordersCollection.deleteMany({}),
      this.driversCollection.deleteMany({}),
      this.plantsCollection.deleteMany({}),
      this.stockCollection.deleteMany({}),
      this.messagesCollection.deleteMany({}),
      this.handoversCollection.deleteMany({}),
    ]);
  }

  async seedSampleData(): Promise<void> {
    await this.clearAllData();

    // Encrypt phone numbers & access instructions
    const encryptedDrivers = INITIAL_DRIVERS.map((d) => ({
      ...d,
      phone: this.encryption.encryptField(d.phone),
    }));

    const encryptedPlants = INITIAL_SUBCONTRACTORS.map((p) => ({
      ...p,
      phone: this.encryption.encryptField(p.phone),
    }));

    const encryptedOrders = INITIAL_ORDERS.map((o) => this.encryptOrder(o));

    await Promise.all([
      this.ordersCollection.insertMany(encryptedOrders),
      this.driversCollection.insertMany(encryptedDrivers),
      this.plantsCollection.insertMany(encryptedPlants),
      this.stockCollection.insertMany(INITIAL_STOCK),
      this.messagesCollection.insertMany(INITIAL_MESSAGES),
    ]);
  }

  // --- PRIVATE ENCRYPTION HELPERS ---

  private encryptOrder(order: Order): Order {
    const copy = { ...order };
    if (copy.specialInstructions) {
      // Encrypt sensitive instructions containing door access codes
      copy.specialInstructions = this.encryption.encryptField(
        copy.specialInstructions,
      );
    }
    if (copy.pod && copy.pod.signatureSvg) {
      // Encrypt POD digital signature SVG
      copy.pod = {
        ...copy.pod,
        signatureSvg: this.encryption.encryptField(copy.pod.signatureSvg),
      };
    }
    return copy;
  }

  private decryptOrder(order: Order): Order {
    const copy = { ...order };
    if (copy.specialInstructions) {
      copy.specialInstructions = this.encryption.decryptField(
        copy.specialInstructions,
      );
    }
    if (copy.pod && copy.pod.signatureSvg) {
      copy.pod = {
        ...copy.pod,
        signatureSvg: this.encryption.decryptField(copy.pod.signatureSvg),
      };
    }
    return copy;
  }
}
