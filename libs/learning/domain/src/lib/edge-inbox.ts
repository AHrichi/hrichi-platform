import * as v from 'valibot';
import { type Capture, LIMITS, SERVER_WRITER } from './records';

/**
 * Telegram capture (design §9): the owner sends or forwards text or a
 * voice note to the bot. The edge Worker checks the webhook secret and the
 * chat, stores the message in KV (a voice note as its Telegram `file_id`,
 * never the audio) and replies "Got it". The API pulls this inbox when it
 * wakes, turns each item into a capture, and acknowledges it.
 */

/** A voice note longer than this is refused, like in the app. */
export const TELEGRAM_VOICE_MAX_SECONDS = 120;
/** Items per pull, and per acknowledgement. */
export const EDGE_INBOX_PAGE = 50;
/** The API's token for the Worker lives this long. */
export const SERVER_TOKEN_TTL_MS = 5 * 60_000;
/**
 * Device tokens carry a device id; the API's token for the Worker carries
 * the server's writer id, which pairing never hands to a device.
 */
export const SERVER_TOKEN_SUBJECT = SERVER_WRITER;

export const EdgeInboxItemSchema = v.strictObject({
  /** The KV key, to acknowledge it with. */
  key: v.pipe(v.string(), v.startsWith('inbox:'), v.maxLength(64)),
  /** The capture's id, fixed when the message arrives (so pulls repeat safely). */
  id: v.pipe(v.string(), v.uuid()),
  updateId: v.pipe(v.number(), v.integer(), v.minValue(0)),
  at: v.pipe(v.string(), v.isoTimestamp()),
  text: v.nullable(v.pipe(v.string(), v.maxLength(LIMITS.captureText))),
  voice: v.nullable(
    v.strictObject({
      fileId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
      mimeType: v.pipe(v.string(), v.startsWith('audio/'), v.maxLength(64)),
      seconds: v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(TELEGRAM_VOICE_MAX_SECONDS),
      ),
    }),
  ),
});

export type EdgeInboxItem = v.InferOutput<typeof EdgeInboxItemSchema>;

export const EdgeInboxAckSchema = v.strictObject({
  keys: v.pipe(
    v.array(v.pipe(v.string(), v.startsWith('inbox:'), v.maxLength(64))),
    v.maxLength(EDGE_INBOX_PAGE),
  ),
});

export const EdgeDeviceSchema = v.strictObject({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  host: v.nullable(v.pipe(v.string(), v.maxLength(40))),
  pairedAt: v.pipe(v.string(), v.isoTimestamp()),
  lastSeenAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  revokedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
});
export type EdgeDevice = v.InferOutput<typeof EdgeDeviceSchema>;

export const EdgeDevicesSyncSchema = v.strictObject({
  devices: v.pipe(v.array(EdgeDeviceSchema), v.maxLength(100)),
});

export const EdgeRevocationSchema = v.strictObject({
  key: v.pipe(v.string(), v.startsWith('revoke:'), v.maxLength(64)),
  deviceId: v.pipe(v.string(), v.uuid()),
  revokedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type EdgeRevocation = v.InferOutput<typeof EdgeRevocationSchema>;

export const EdgeRevocationAckSchema = v.strictObject({
  keys: v.pipe(
    v.array(v.pipe(v.string(), v.startsWith('revoke:'), v.maxLength(64))),
    v.maxLength(100),
  ),
});

/** The KV key of a Telegram update: padded, so keys list in arrival order. */
export function inboxKey(updateId: number): string {
  return `inbox:${String(updateId).padStart(12, '0')}`;
}

/** The capture an inbox item becomes; a voice note waits for its audio. */
export function captureFromInbox(item: EdgeInboxItem, now: Date): Capture {
  return {
    id: item.id,
    updatedAt: now.toISOString(),
    deletedAt: null,
    modality: item.voice ? 'voice' : 'text',
    text: item.voice ? null : item.text?.trim() || null,
    hasAudio: !!item.voice,
    transcript: null,
    source: {
      app: 'telegram',
      objectType: 'message',
      objectId: String(item.updateId),
      deepLink: null,
      excerpt: item.voice ? (item.text?.trim().slice(0, 500) ?? null) : null,
    },
    status: 'queued',
    attempts: 0,
    error: null,
    force: false,
    conceptIds: [],
    capturedAt: item.at,
  };
}
