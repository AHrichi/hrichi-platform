import * as v from 'valibot';

/**
 * Pairing a device (design §11). The device asks for a code; the server
 * sends it to the owner's Telegram chat, never to the device; the owner
 * types it into the device, which then receives its token. Only someone
 * who can read the owner's Telegram can pair.
 */

export const PAIRING = {
  codeLength: 6,
  ttlMs: 10 * 60_000,
  maxAttempts: 5,
  tokenTtlMs: 180 * 24 * 60 * 60_000,
  deviceName: 40,
} as const;

export const PairingStartSchema = v.strictObject({
  deviceName: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(PAIRING.deviceName),
  ),
});

export const PairingConfirmSchema = v.strictObject({
  code: v.pipe(v.string(), v.regex(/^\d{6}$/)),
});

export type PairingStart = v.InferOutput<typeof PairingStartSchema>;
export type PairingConfirm = v.InferOutput<typeof PairingConfirmSchema>;

export interface PairingStarted {
  pairingId: string;
  expiresAt: string;
}

export interface DevicePaired {
  deviceId: string;
  deviceName: string;
  token: string;
  expiresAt: string;
}

export interface DeviceSummary {
  id: string;
  name: string;
  pairedAt: string;
  lastSeenAt: string | null;
  /** The device asking. */
  current: boolean;
}
