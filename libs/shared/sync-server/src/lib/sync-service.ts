import {
  ClaimRequestSchema,
  CreateSpaceRequestSchema,
  formatPairingCode,
  hashPairingCode,
  incomingWins,
  jsonBytes,
  newPairingCode,
  normalizePairingCode,
  recordId,
  signSyncToken,
  SYNC_LIMITS,
  type SyncAppSpec,
  type SyncDevices,
  type SyncDone,
  type SyncErrorCode,
  type SyncFailure,
  type SyncJoined,
  type SyncPairing,
  type SyncRejection,
  SyncRequestSchema,
  type SyncResult,
  verifySyncToken,
} from '@ah/shared/sync';
import * as v from 'valibot';
import type {
  DeviceRow,
  StoredVersion,
  SyncRepository,
  WriteRecord,
} from './repository';

/** An answer for the host to send: its HTTP status and body. */
export interface SyncOutcome<T> {
  readonly status: number;
  readonly body: T | SyncFailure;
}

export interface SyncServiceOptions {
  readonly repository: SyncRepository;
  /** Signs device tokens: at least 32 characters, kept secret. */
  readonly secret: string;
  /** The apps this server syncs for, and what each syncs. */
  readonly specs: readonly SyncAppSpec[];
  readonly now?: () => Date;
  readonly newId?: () => string;
  /** What one space may hold (`SYNC_LIMITS` unless set, as in tests). */
  readonly quota?: { readonly records?: number; readonly bytes?: number };
}

const DAY_MS = 86_400_000;
/** A device's `lastSeenAt` is written at most this often. */
const SEEN_EVERY_MS = 10 * 60_000;

interface Authed {
  readonly spaceId: string;
  readonly device: DeviceRow;
  readonly expiresAt: Date;
}

/**
 * Sync spaces, host-agnostic: the Worker calls it with D1, a test with
 * memory, and another host (a Nest controller) could do the same.
 *
 * A space is created by one device and joined by others with a one-use
 * code from a device already in it. No accounts, no email: a device holds
 * a signed token for its space. Records follow the app's spec; the server
 * keeps the version that wins (the later edit), counts what a space holds,
 * and hands back what changed after the device's cursor.
 */
export class SyncService {
  private readonly repo: SyncRepository;
  private readonly specs: ReadonlyMap<string, SyncAppSpec>;
  private readonly now: () => Date;
  private readonly newId: () => string;
  private readonly maxRecords: number;
  private readonly maxBytes: number;

  constructor(private readonly options: SyncServiceOptions) {
    this.repo = options.repository;
    this.maxRecords = options.quota?.records ?? SYNC_LIMITS.spaceRecords;
    this.maxBytes = options.quota?.bytes ?? SYNC_LIMITS.spaceBytes;
    this.specs = new Map(options.specs.map((spec) => [spec.app, spec]));
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }

  /** `POST /v1/spaces`: a new space, with this device in it. */
  async createSpace(body: unknown): Promise<SyncOutcome<SyncJoined>> {
    const parsed = v.safeParse(CreateSpaceRequestSchema, body);
    if (!parsed.success) return fail(400, 'BAD_REQUEST', issue(parsed.issues));
    if (!this.specs.has(parsed.output.app)) {
      return fail(400, 'BAD_REQUEST', `Unknown app "${parsed.output.app}"`);
    }
    const at = this.now().toISOString();
    const spaceId = this.newId();
    const device = this.deviceRow(spaceId, parsed.output.deviceName, at);
    await this.repo.createSpace(
      { id: spaceId, app: parsed.output.app, createdAt: at, lastSeenAt: at },
      device,
    );
    return this.joined(spaceId, device.id);
  }

  /** `POST /v1/pairings`: a code for another device to join with. */
  async startPairing(token: string | null): Promise<SyncOutcome<SyncPairing>> {
    const auth = await this.authenticate(token);
    if ('status' in auth) return auth;
    const code = newPairingCode();
    const expiresAt = new Date(this.now().getTime() + SYNC_LIMITS.pairingMs);
    await this.repo.addPairing({
      codeHash: await hashPairingCode(code),
      spaceId: auth.spaceId,
      createdBy: auth.device.id,
      expiresAt: expiresAt.toISOString(),
    });
    return {
      status: 200,
      body: {
        v: 1,
        ok: true,
        code: formatPairingCode(code),
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  /** `POST /v1/pairings/claim`: join a space with a code. */
  async claim(body: unknown): Promise<SyncOutcome<SyncJoined>> {
    const parsed = v.safeParse(ClaimRequestSchema, body);
    if (!parsed.success) return fail(400, 'BAD_REQUEST', issue(parsed.issues));
    const code = normalizePairingCode(parsed.output.code);
    if (!code) return fail(400, 'CODE_INVALID', 'That isn’t a code');
    const at = this.now().toISOString();
    const claimed = await this.repo.claimPairing(
      await hashPairingCode(code),
      at,
    );
    const space = claimed ? await this.repo.space(claimed.spaceId) : null;
    if (!space || space.app !== parsed.output.app) {
      return fail(400, 'CODE_INVALID', 'The code is wrong, used or expired');
    }
    const live = (await this.repo.devices(space.id)).filter(
      (d) => !d.revokedAt,
    );
    if (live.length >= SYNC_LIMITS.devicesPerSpace) {
      return fail(400, 'BAD_REQUEST', 'This space has too many devices');
    }
    const device = this.deviceRow(space.id, parsed.output.deviceName, at);
    await this.repo.addDevice(device);
    return this.joined(space.id, device.id);
  }

  /** `GET /v1/devices`: the space's devices still linked. */
  async devices(token: string | null): Promise<SyncOutcome<SyncDevices>> {
    const auth = await this.authenticate(token);
    if ('status' in auth) return auth;
    const devices = (await this.repo.devices(auth.spaceId))
      .filter((d) => !d.revokedAt)
      .map((d) => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
        lastSeenAt: d.lastSeenAt,
        current: d.id === auth.device.id,
      }));
    return { status: 200, body: { v: 1, ok: true, devices } };
  }

  /**
   * `DELETE /v1/devices/:id`: unlinks a device of the space (this one, to
   * turn sync off here). Its token stops working at once.
   */
  async revoke(
    token: string | null,
    deviceId: string,
  ): Promise<SyncOutcome<SyncDone>> {
    const auth = await this.authenticate(token);
    if ('status' in auth) return auth;
    const done = await this.repo.revoke(
      auth.spaceId,
      deviceId,
      this.now().toISOString(),
    );
    return done
      ? { status: 200, body: { v: 1, ok: true } }
      : fail(404, 'NOT_FOUND', 'No such device in this space');
  }

  /** `DELETE /v1/spaces/current`: the cloud copy, gone; devices keep theirs. */
  async deleteSpace(token: string | null): Promise<SyncOutcome<SyncDone>> {
    const auth = await this.authenticate(token);
    if ('status' in auth) return auth;
    await this.repo.deleteSpace(auth.spaceId);
    return { status: 200, body: { v: 1, ok: true } };
  }

  /** `POST /v1/sync`: keep what this device changed, return what others did. */
  async sync(
    token: string | null,
    body: unknown,
  ): Promise<SyncOutcome<SyncResult>> {
    const auth = await this.authenticate(token);
    if ('status' in auth) return auth;
    const parsed = v.safeParse(SyncRequestSchema, body);
    if (!parsed.success) return fail(400, 'BAD_REQUEST', issue(parsed.issues));
    const space = await this.repo.space(auth.spaceId);
    const spec = space && this.specs.get(space.app);
    if (!spec) return fail(401, 'UNAUTHORIZED', 'This space is gone');

    const now = this.now();
    const rejected: {
      kind: string;
      key: string;
      updatedAt: string;
      reason: SyncRejection;
    }[] = [];
    const refuse = (
      record: { kind: string; key: string; updatedAt: string },
      reason: SyncRejection,
    ) =>
      rejected.push({
        kind: record.kind,
        key: record.key,
        updatedAt: record.updatedAt,
        reason,
      });

    const candidates: WriteRecord[] = [];
    for (const record of parsed.output.push) {
      const kind = spec.kinds[record.kind];
      const isObject =
        typeof record.data === 'object' &&
        record.data !== null &&
        !Array.isArray(record.data);
      if (
        !kind ||
        record.by !== auth.device.id ||
        (record.deleted ? record.data !== undefined : !isObject)
      ) {
        refuse(record, 'invalid');
        continue;
      }
      if (
        Date.parse(record.updatedAt) >
        now.getTime() + SYNC_LIMITS.clockSkewMs
      ) {
        refuse(record, 'clock_ahead');
        continue;
      }
      const bytes = record.deleted ? 0 : jsonBytes(record.data);
      if (bytes > kind.maxBytes) {
        refuse(record, 'too_large');
        continue;
      }
      const { deleted, data, ...rest } = record;
      // One way of writing a time, so stores may compare them as text.
      const updatedAt = new Date(record.updatedAt).toISOString();
      candidates.push(
        deleted
          ? { ...rest, updatedAt, deleted: true, bytes }
          : { ...rest, updatedAt, data, bytes },
      );
    }

    const stored = await this.repo.versions(auth.spaceId, candidates);
    let { records, bytes } = await this.repo.usage(auth.spaceId);
    const winners: WriteRecord[] = [];
    for (const candidate of candidates) {
      const id = recordId(candidate);
      const current: StoredVersion | undefined = stored.get(id);
      if (!incomingWins(current, candidate)) {
        refuse(candidate, 'stale');
        continue;
      }
      const nextRecords = records + (current ? 0 : 1);
      const nextBytes = bytes - (current?.bytes ?? 0) + candidate.bytes;
      // A deletion always fits: it frees room.
      if (
        !candidate.deleted &&
        (nextRecords > this.maxRecords || nextBytes > this.maxBytes)
      ) {
        refuse(candidate, 'quota');
        continue;
      }
      records = nextRecords;
      bytes = nextBytes;
      stored.set(id, candidate);
      winners.push(candidate);
    }
    if (winners.length > 0) await this.repo.write(auth.spaceId, winners);

    const pull = await this.repo.pull(
      auth.spaceId,
      parsed.output.cursor,
      SYNC_LIMITS.pullRecords,
    );
    if (now.getTime() - Date.parse(auth.device.lastSeenAt) > SEEN_EVERY_MS) {
      await this.repo.seen(auth.spaceId, auth.device.id, now.toISOString());
    }
    const renew =
      auth.expiresAt.getTime() - now.getTime() <
      SYNC_LIMITS.renewWithinDays * DAY_MS;
    return {
      status: 200,
      body: {
        v: 1,
        ok: true,
        cursor: pull.length ? pull[pull.length - 1].seq : parsed.output.cursor,
        pull,
        more: pull.length === SYNC_LIMITS.pullRecords,
        rejected,
        usage: {
          records,
          bytes,
          maxRecords: this.maxRecords,
          maxBytes: this.maxBytes,
        },
        ...(renew
          ? { token: await this.token(auth.spaceId, auth.device.id) }
          : {}),
      },
    };
  }

  /** The daily clean-up: spent codes, and spaces idle for a year. */
  sweep(): Promise<{ pairings: number; spaces: number }> {
    const now = this.now();
    const idleBefore = new Date(
      now.getTime() - SYNC_LIMITS.idleSpaceDays * DAY_MS,
    );
    return this.repo.sweep(now.toISOString(), idleBefore.toISOString());
  }

  private async authenticate(
    token: string | null,
  ): Promise<Authed | SyncOutcome<never>> {
    const claims = token
      ? await verifySyncToken(this.options.secret, token, this.now())
      : null;
    if (!claims) return fail(401, 'UNAUTHORIZED', 'Sign in to the space again');
    const device = await this.repo.device(claims.deviceId);
    if (!device || device.spaceId !== claims.spaceId) {
      return fail(401, 'UNAUTHORIZED', 'This device isn’t in a space');
    }
    if (device.revokedAt) {
      return fail(401, 'REVOKED', 'This device was removed from its space');
    }
    return { spaceId: claims.spaceId, device, expiresAt: claims.expiresAt };
  }

  private deviceRow(spaceId: string, name: string, at: string): DeviceRow {
    return {
      id: this.newId(),
      spaceId,
      name,
      createdAt: at,
      lastSeenAt: at,
      revokedAt: null,
    };
  }

  private async joined(
    spaceId: string,
    deviceId: string,
  ): Promise<SyncOutcome<SyncJoined>> {
    return {
      status: 200,
      body: {
        v: 1,
        ok: true,
        spaceId,
        deviceId,
        token: await this.token(spaceId, deviceId),
      },
    };
  }

  private token(spaceId: string, deviceId: string): Promise<string> {
    return signSyncToken(this.options.secret, {
      spaceId,
      deviceId,
      expiresAt: new Date(
        this.now().getTime() + SYNC_LIMITS.tokenDays * DAY_MS,
      ),
    });
  }
}

function fail(
  status: number,
  code: SyncErrorCode,
  message: string,
): SyncOutcome<never> {
  return { status, body: { v: 1, ok: false, code, message } };
}

function issue(issues: readonly v.BaseIssue<unknown>[]): string {
  const first = issues[0];
  const where = first?.path?.map((p) => String(p.key)).join('.') ?? '';
  return where
    ? `${where}: ${first.message}`
    : (first?.message ?? 'Bad request');
}
