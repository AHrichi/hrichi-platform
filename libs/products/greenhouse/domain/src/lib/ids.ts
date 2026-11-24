/**
 * A random v4 UUID, made on the device so a re-sent row is recognised and
 * never duplicated. `crypto.randomUUID` exists only in secure contexts
 * (HTTPS, localhost); a farm's LAN over plain HTTP gets the same thing
 * from `getRandomValues`.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** A copy of `list` with `item` replacing the entry of the same id, or added. */
export function upsertById<T extends { id: string }>(
  list: readonly T[],
  item: T,
): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

/** A copy of `list` without the entry of that id. */
export function withoutId<T extends { id: string }>(
  list: readonly T[],
  id: string,
): T[] {
  return list.filter((x) => x.id !== id);
}
