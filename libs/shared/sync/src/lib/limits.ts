/**
 * The sync protocol's limits (ADR-0032). They keep a free D1 database and
 * a free Worker within their allowances, and every request small.
 */
export const SYNC_LIMITS = {
  /** Records one request may push; the rest wait for the next round. */
  pushRecords: 50,
  /** Records one reply carries; `more` asks for another round. */
  pullRecords: 200,
  /** A request body, read as it arrives. */
  bodyBytes: 1_048_576,
  /** One record's data, as JSON. */
  recordBytes: 131_072,
  /** What one space may hold. */
  spaceRecords: 5_000,
  spaceBytes: 20_000_000,
  /** A device's clock may run this far ahead before its edits are refused. */
  clockSkewMs: 5 * 60_000,
  /** How long a code to link a device lasts. */
  pairingMs: 10 * 60_000,
  /** How long a device's token lasts, and when a sync renews it. */
  tokenDays: 180,
  renewWithinDays: 30,
  /** A space nobody has synced for this long is deleted. */
  idleSpaceDays: 365,
  /** Devices one space may have. */
  devicesPerSpace: 20,
  /** A device's name, as its owner reads it in the list. */
  deviceNameChars: 60,
} as const;

/** The size of a value once sent as JSON, in bytes. */
export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value ?? null)).length;
}
