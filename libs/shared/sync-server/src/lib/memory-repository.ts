import { incomingWins, recordId, type StoredRecord } from '@ah/shared/sync';
import type {
  DeviceRow,
  PairingRow,
  SpaceRow,
  StoredVersion,
  SyncRepository,
  WriteRecord,
} from './repository';

interface Held {
  record: StoredRecord;
  bytes: number;
}

interface Space {
  row: SpaceRow;
  seq: number;
  records: Map<string, Held>;
}

/** Sync spaces in memory: for tests, and the e2e's stand-in server. */
export class InMemorySyncRepository implements SyncRepository {
  private readonly spaces = new Map<string, Space>();
  private readonly deviceRows = new Map<string, DeviceRow>();
  private readonly pairings = new Map<
    string,
    PairingRow & { usedAt: string | null }
  >();

  async createSpace(space: SpaceRow, device: DeviceRow): Promise<void> {
    this.spaces.set(space.id, { row: space, seq: 0, records: new Map() });
    this.deviceRows.set(device.id, device);
  }

  async space(id: string): Promise<SpaceRow | null> {
    return this.spaces.get(id)?.row ?? null;
  }

  async addDevice(device: DeviceRow): Promise<void> {
    this.deviceRows.set(device.id, device);
  }

  async device(id: string): Promise<DeviceRow | null> {
    return this.deviceRows.get(id) ?? null;
  }

  async devices(spaceId: string): Promise<DeviceRow[]> {
    return [...this.deviceRows.values()]
      .filter((d) => d.spaceId === spaceId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async seen(spaceId: string, deviceId: string, at: string): Promise<void> {
    const device = this.deviceRows.get(deviceId);
    if (device?.spaceId === spaceId) {
      this.deviceRows.set(deviceId, { ...device, lastSeenAt: at });
    }
    const space = this.spaces.get(spaceId);
    if (space) space.row = { ...space.row, lastSeenAt: at };
  }

  async revoke(
    spaceId: string,
    deviceId: string,
    at: string,
  ): Promise<boolean> {
    const device = this.deviceRows.get(deviceId);
    if (!device || device.spaceId !== spaceId) return false;
    this.deviceRows.set(deviceId, {
      ...device,
      revokedAt: device.revokedAt ?? at,
    });
    return true;
  }

  async addPairing(pairing: PairingRow): Promise<void> {
    this.pairings.set(pairing.codeHash, { ...pairing, usedAt: null });
  }

  async claimPairing(
    codeHash: string,
    now: string,
  ): Promise<{ spaceId: string } | null> {
    const pairing = this.pairings.get(codeHash);
    if (!pairing || pairing.usedAt || pairing.expiresAt <= now) return null;
    pairing.usedAt = now;
    return { spaceId: pairing.spaceId };
  }

  async versions(
    spaceId: string,
    records: readonly { kind: string; key: string }[],
  ): Promise<Map<string, StoredVersion>> {
    const held = this.spaces.get(spaceId)?.records;
    const found = new Map<string, StoredVersion>();
    for (const wanted of records) {
      const id = recordId(wanted);
      const one = held?.get(id);
      if (one) {
        found.set(id, {
          updatedAt: one.record.updatedAt,
          by: one.record.by,
          bytes: one.bytes,
        });
      }
    }
    return found;
  }

  async write(spaceId: string, records: readonly WriteRecord[]): Promise<void> {
    const space = this.spaces.get(spaceId);
    if (!space) return;
    for (const { bytes, ...record } of records) {
      const id = recordId(record);
      const current = space.records.get(id)?.record;
      if (current && !incomingWins(current, record)) continue;
      space.seq += 1;
      space.records.set(id, {
        record: structuredClone({ ...record, seq: space.seq }),
        bytes,
      });
    }
  }

  async pull(
    spaceId: string,
    afterSeq: number,
    limit: number,
  ): Promise<StoredRecord[]> {
    const held = this.spaces.get(spaceId)?.records;
    if (!held) return [];
    return [...held.values()]
      .map((one) => one.record)
      .filter((record) => record.seq > afterSeq)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit)
      .map((record) => structuredClone(record));
  }

  async usage(spaceId: string): Promise<{ records: number; bytes: number }> {
    const held = [...(this.spaces.get(spaceId)?.records.values() ?? [])];
    return {
      records: held.length,
      bytes: held.reduce((sum, one) => sum + one.bytes, 0),
    };
  }

  async deleteSpace(spaceId: string): Promise<void> {
    this.spaces.delete(spaceId);
    for (const [id, device] of this.deviceRows) {
      if (device.spaceId === spaceId) this.deviceRows.delete(id);
    }
    for (const [hash, pairing] of this.pairings) {
      if (pairing.spaceId === spaceId) this.pairings.delete(hash);
    }
  }

  async sweep(
    now: string,
    idleBefore: string,
  ): Promise<{ pairings: number; spaces: number }> {
    let pairings = 0;
    for (const [hash, pairing] of this.pairings) {
      if (pairing.usedAt || pairing.expiresAt <= now) {
        this.pairings.delete(hash);
        pairings++;
      }
    }
    let spaces = 0;
    for (const [id, space] of this.spaces) {
      if (space.row.lastSeenAt < idleBefore) {
        await this.deleteSpace(id);
        spaces++;
      }
    }
    return { pairings, spaces };
  }
}
