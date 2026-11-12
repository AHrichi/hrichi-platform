import type { LearningSourceRef } from './handoff';

/**
 * Shared data with host apps (design §9, "Linked hosts"). A host app such
 * as StudyLM runs on its own origin, so it can't open the engine's
 * database. Once linked, it talks to the engine's API with a host token:
 * it sends cards, reports answers and reads progress, and nothing else.
 *
 * Linking happens once per browser: the host opens the learning app at
 * `/connect#link=…`, the learner allows it there (on a paired device), and
 * the learning app sends the token back in the host's fragment
 * (`#learning-link=…`), only ever to the host's own origins.
 */
export const HOST_APPS = ['studylm'] as const;
export type HostApp = (typeof HOST_APPS)[number];

/** Display names, for the learning app's screens. */
export const HOST_APP_NAMES: Readonly<Record<HostApp, string>> = {
  studylm: 'StudyLM',
};

/**
 * Where each host runs standalone (tools/federation/remotes.json). The
 * learning app returns a token only to these, and the API's CORS lets them
 * in. Inside the portfolio a host runs as a demo and never links.
 */
export const HOST_ORIGINS: Readonly<Record<HostApp, readonly string[]>> = {
  studylm: [
    'https://product-studylm.ahmed-hrichi.workers.dev',
    'http://localhost:4307',
  ],
};

/** The learning app's fragment key: `/connect#link=…`. */
export const CONNECT_KEY = 'link';
/** The host's fragment key: `#learning-link=…`. */
export const LINK_KEY = 'learning-link';

export const HOST_LIMITS = {
  /** Cards per request. */
  captures: 20,
  /** Answers per request. */
  answers: 100,
  /** Items a state reply lists, newest first. */
  items: 1000,
  /** Answers older than this are not counted. */
  answerAgeDays: 30,
  /** A link's device name. */
  name: 40,
} as const;

export function isHostApp(value: unknown): value is HostApp {
  return (HOST_APPS as readonly unknown[]).includes(value);
}

/** Every host's origins, for the API's CORS allowlist. */
export function hostOrigins(): string[] {
  return HOST_APPS.flatMap((app) => [...HOST_ORIGINS[app]]);
}

/**
 * `returnTo` without its fragment when it is one of the host's own
 * addresses; null for anything else, so a token never leaves for another
 * site.
 */
export function hostReturnUrl(app: HostApp, returnTo: string): string | null {
  let url: URL;
  try {
    url = new URL(returnTo);
  } catch {
    return null;
  }
  if (!HOST_ORIGINS[app].includes(url.origin)) return null;
  url.hash = '';
  return url.href;
}

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

function fromBase64Url(text: string): unknown {
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function fragmentValue(fragment: string, key: string): string | null {
  const value = fragment.replace(/^#/, '');
  return value.startsWith(`${key}=`) ? value.slice(key.length + 1) : null;
}

/** What a host asks the learning app for. */
export interface ConnectRequest {
  app: HostApp;
  /** Where the learning app sends the learner back, with the link. */
  returnTo: string;
}

export function encodeConnect(request: ConnectRequest): string {
  return toBase64Url(JSON.stringify({ v: 1, ...request }));
}

/**
 * The request in a `#link=…` fragment, or null. The return address must be
 * one of the host's own: the fragment could have come from any page.
 */
export function decodeConnect(fragment: string): ConnectRequest | null {
  const value = fragmentValue(fragment, CONNECT_KEY);
  const parsed = value ? fromBase64Url(value) : null;
  if (!parsed || typeof parsed !== 'object') return null;
  const { app, returnTo } = parsed as Record<string, unknown>;
  if (!isHostApp(app) || typeof returnTo !== 'string') return null;
  const safe = hostReturnUrl(app, returnTo);
  return safe ? { app, returnTo: safe } : null;
}

/** A host's link to the engine: a token for the host routes only. */
export interface HostLink {
  token: string;
  /** ISO timestamp; sync-like calls renew it in its last 30 days. */
  expiresAt: string;
}

const TOKEN_FORMAT = /^v1\.[0-9a-f-]{36}\.\d{1,12}\.[A-Za-z0-9_-]{16,128}$/i;

function readLink(value: unknown): HostLink | null {
  if (!value || typeof value !== 'object') return null;
  const { token, expiresAt } = value as Record<string, unknown>;
  if (typeof token !== 'string' || !TOKEN_FORMAT.test(token)) return null;
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) {
    return null;
  }
  return { token, expiresAt };
}

export function encodeLink(link: HostLink): string {
  return toBase64Url(JSON.stringify({ v: 1, ...link }));
}

/** The link in a `#learning-link=…` fragment, or null. */
export function decodeLink(fragment: string): HostLink | null {
  const value = fragmentValue(fragment, LINK_KEY);
  return value ? readLink(fromBase64Url(value)) : null;
}

/** A stored link (localStorage), or null when it is missing or malformed. */
export function parseLink(raw: string | null): HostLink | null {
  if (!raw) return null;
  try {
    return readLink(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** `POST /learning/hosts`, from a paired device. */
export interface HostLinkRequest {
  app: HostApp;
  /** How the Devices screen names it, e.g. "StudyLM on Chrome on Windows". */
  name: string;
}

/** The reply: the link, and its id on the Devices screen. */
export interface HostLinked extends HostLink {
  hostId: string;
}

/** A card a host sends (`POST /learning/host/captures`). */
export interface HostCaptureItem {
  text: string;
  /** Required: it is the card's identity. The API sets `app` from the token. */
  source: LearningSourceRef;
}

export interface HostCapturesRequest {
  items: HostCaptureItem[];
}

export interface HostCapturesResult {
  /** New cards, now on their way to the digest. */
  stored: number;
  /** Cards the engine already had (or the learner removed). */
  known: number;
}

export type HostRating = 'again' | 'hard' | 'good' | 'easy';

/** An answer in the host app (`POST /learning/host/answers`). */
export interface HostAnswer {
  /** A UUID the host makes, so a retry counts once. */
  id: string;
  objectType: string;
  objectId: string;
  rating: HostRating;
  /** ISO timestamp of the answer. */
  at: string;
  /** Time from showing the question to answering it. */
  ms: number;
}

export interface HostAnswersRequest {
  /** The learner's time zone, for the day an answer counts for. */
  timeZone: string;
  answers: HostAnswer[];
}

export interface HostAnswersResult {
  /** Answers that became review events. */
  counted: number;
  /** Answers about cards that aren't in the reviews (yet), or too old. */
  skipped: number;
}

export type HostTier = 'seed' | 'sprout' | 'leaf' | 'bloom' | 'golden';
export const HOST_TIERS: readonly HostTier[] = [
  'seed',
  'sprout',
  'leaf',
  'bloom',
  'golden',
];

/**
 * Where a host's card is in the engine: waiting for the AI, a draft in the
 * digest (kept on its own after 48 hours), in the reviews, waiting for a
 * look, failed, or removed by the learner.
 */
export type HostItemStage =
  'waiting' | 'draft' | 'reviewing' | 'needs_look' | 'failed' | 'removed';

export interface HostItemState {
  objectType: string;
  objectId: string;
  stage: HostItemStage;
  /** The lowest tier of its concepts in review; null before that. */
  tier: HostTier | null;
  /** The learner's day it is next due, when reviewed. */
  due: string | null;
}

/** `GET /learning/host/state`: the engine's progress, for the host's stats. */
export interface HostState {
  /** The learner's day it describes (`YYYY-MM-DD`). */
  localDate: string;
  streak: { current: number; longest: number; todayCounted: boolean };
  /** Today's Daily Set, once a device started it. */
  today: { total: number; done: number; finished: boolean } | null;
  /** This host's concepts in review, by tier. */
  tiers: Record<HostTier, number>;
  /** Of those, how many are fading (recall below 80 %). */
  wilting: number;
  /** This host's cards, newest first. */
  items: HostItemState[];
  /** Every concept in review, from any app. */
  conceptsInReview: number;
  /** A fresh link when this one runs out within 30 days. */
  renewedToken: HostLink | null;
}

/**
 * A short, stable key for a card's text (FNV-1a, 32 bits), so an edited
 * card counts as a new one. Not for security: only to tell cards apart.
 */
export function textKey(text: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text.trim())) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
