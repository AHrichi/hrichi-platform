/**
 * What host apps hand the Learning Engine (design §9): one or more
 * captures, each with where it came from. It travels in the URL fragment
 * (`/inbox#capture=…`), which browsers never send to a server, and the
 * learning app asks before saving it.
 */
export interface LearningSourceRef {
  /** The host app, e.g. `studylm`. */
  app: string;
  /** e.g. `lesson`, `flashcard`, `link`. */
  objectType: string;
  objectId: string;
  /** Opens the source again; null when there is no stable address. */
  deepLink: string | null;
  excerpt: string | null;
}

export interface CaptureItem {
  text: string;
  source: LearningSourceRef | null;
}

export const HANDOFF_KEY = 'capture';
export const MAX_HANDOFF_ITEMS = 10;
export const MAX_HANDOFF_TEXT = 4000;

const LIMITS = {
  app: 40,
  objectType: 40,
  objectId: 120,
  deepLink: 2048,
  excerpt: 500,
};

function toBase64Url(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function fromBase64Url(text: string): string | null {
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** The fragment value for `#capture=…`. Items over the limits are cut. */
export function encodeHandoff(items: readonly CaptureItem[]): string {
  const clean = items
    .filter((item) => item.text.trim())
    .slice(0, MAX_HANDOFF_ITEMS)
    .map((item) => ({
      text: item.text.trim().slice(0, MAX_HANDOFF_TEXT),
      source: item.source,
    }));
  return toBase64Url(JSON.stringify({ v: 1, items: clean }));
}

function cleanString(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function cleanSource(value: unknown): LearningSourceRef | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const app = cleanString(record['app'], LIMITS.app);
  const objectType = cleanString(record['objectType'], LIMITS.objectType);
  const objectId = cleanString(record['objectId'], LIMITS.objectId);
  if (!app || !objectType || !objectId) return null;
  const link = cleanString(record['deepLink'], LIMITS.deepLink);
  return {
    app,
    objectType,
    objectId,
    // Only web links: a `javascript:` link would run when opened.
    deepLink: link && /^https?:\/\//.test(link) ? link : null,
    excerpt: cleanString(record['excerpt'], LIMITS.excerpt),
  };
}

/**
 * The captures in a `#capture=…` fragment, or null when it isn't one.
 * Everything is checked and trimmed: the fragment came from another page.
 */
export function decodeHandoff(fragment: string): CaptureItem[] | null {
  const prefix = `${HANDOFF_KEY}=`;
  const value = fragment.replace(/^#/, '');
  if (!value.startsWith(prefix)) return null;
  const json = fromBase64Url(value.slice(prefix.length));
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const items = (parsed as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;
  const clean = items
    .slice(0, MAX_HANDOFF_ITEMS)
    .map((item): CaptureItem | null => {
      if (!item || typeof item !== 'object') return null;
      const text = cleanString(
        (item as { text?: unknown }).text,
        MAX_HANDOFF_TEXT,
      );
      return text
        ? { text, source: cleanSource((item as { source?: unknown }).source) }
        : null;
    })
    .filter((item): item is CaptureItem => item !== null);
  return clean.length ? clean : null;
}
