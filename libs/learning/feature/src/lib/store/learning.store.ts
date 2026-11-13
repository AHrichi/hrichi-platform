import { computed, DestroyRef, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  type CaptureItem,
  type HostApp,
  type HostLinked,
  type LearningTodaySummary,
  TODAY_SUMMARY_KEY,
} from '@ah/learning/contracts';
import { LearningApiError, type SyncOutcome } from '@ah/learning/data-access';
import {
  type AiVerdict,
  type Capture,
  composeDailySet,
  type Topic,
  computeStreak,
  type Concept,
  type ConceptDraft,
  type ConceptFieldGroup,
  type ConceptLink,
  conceptFromDraft,
  countedDays,
  draftConceptFrom,
  DEFAULT_CAP,
  DEFAULT_NEW_PER_DAY,
  DEFAULT_WEEKLY_TARGET,
  type DeviceSummary,
  type GardenTheme,
  learnedMorning,
  levelOf,
  type LinkRelation,
  linkRecord,
  milestonesOf,
  themesOf,
  localDateOf,
  memoryOf,
  type RecallPrompt,
  type ReviewEvent,
  type ReviewSession,
  SERVER_WRITER,
  SETTINGS_RECORD_ID,
  LIMITS,
  PAIRING,
  type StreakMode,
  TEACH_BACK_MIN_CHARS,
  type TeachBack,
  type TeachBackFeedback,
  teachPoints,
  weekStats,
  withRevisedExplanation,
  xpOf,
} from '@ah/learning/domain';
import { demoDraftSource } from './demo';
import { LearningRuntime, type SyncUnavailable } from './learning-runtime';

export type SyncState =
  | 'starting'
  | 'unavailable'
  | 'unpaired'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'failed';

export interface PairingState {
  pairingId: string | null;
  deviceName: string;
  expiresAt: string | null;
  busy: boolean;
  error: string | null;
}

/** This device's learning settings (design §4.1 LearnerProfile). */
export interface LearnerSettings {
  dailyCap: 5 | 7 | 10;
  newPerDay: number;
  /** Daily streak vs. X days per Mon–Sun week (design §3, §5). */
  streakMode: StreakMode;
  weeklyTarget: number;
  /** "HH:MM", or null to learn it from when you usually study. */
  morning: string | null;
  /** "HH:MM", or null for no evening reminder. */
  evening: string | null;
  /** "YYYY-MM-DD": no nudges and no streak pressure until then. */
  vacationUntil: string | null;
  /** The garden's look; themes unlock with progress (design §3). */
  gardenTheme: GardenTheme;
  /** A short recap of the week on Telegram, Sunday evening (design §10). */
  weeklyRecap: boolean;
}

export const DEFAULT_SETTINGS: LearnerSettings = {
  dailyCap: DEFAULT_CAP as 7,
  newPerDay: DEFAULT_NEW_PER_DAY,
  streakMode: 'daily',
  weeklyTarget: DEFAULT_WEEKLY_TARGET,
  morning: null,
  evening: '20:30',
  vacationUntil: null,
  gardenTheme: 'meadow',
  weeklyRecap: true,
};

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export interface LearningState {
  ready: boolean;
  /** The database couldn't be opened (private mode, storage blocked). */
  fatal: string | null;
  concepts: Concept[];
  topics: Topic[];
  captures: Capture[];
  sessions: ReviewSession[];
  events: ReviewEvent[];
  teachBacks: TeachBack[];
  links: ConceptLink[];
  settings: LearnerSettings;
  /** Bumped by the clock so "today" moves on at the day boundary. */
  now: string;
  /** Concepts the server is rewriting ("make it simpler"). */
  revising: string[];
  /** A short confirmation for the live region ("Got it"). */
  notice: string | null;
  /** Local changes not yet on the server. */
  pending: number;
  device: { id: string; name: string } | null;
  unavailable: SyncUnavailable | null;
  sync: { state: SyncState; message: string | null; at: string | null };
  pairing: PairingState;
  devices: DeviceSummary[];
}

const initialState: LearningState = {
  ready: false,
  fatal: null,
  concepts: [],
  topics: [],
  captures: [],
  sessions: [],
  events: [],
  teachBacks: [],
  links: [],
  settings: DEFAULT_SETTINGS,
  now: new Date().toISOString(),
  revising: [],
  notice: null,
  pending: 0,
  device: null,
  unavailable: null,
  sync: { state: 'starting', message: null, at: null },
  pairing: {
    pairingId: null,
    deviceName: '',
    expiresAt: null,
    busy: false,
    error: null,
  },
  devices: [],
};

/** Local changes wait this long, so typing a few in a row syncs once. */
const SYNC_DELAY_MS = 1500;
/**
 * While the server is still turning a capture into concepts, sync again
 * after this long. Only then: there is no polling otherwise (design 4.3).
 */
const FOLLOW_UP_MS = 15_000;

const IN_FLIGHT: readonly Capture['status'][] = ['queued', 'processing'];

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const LearningStore = signalStore(
  { providedIn: 'root' },
  withState<LearningState>(initialState),
  withComputed(({ concepts, sessions, events, teachBacks, settings, now }) => {
    const timeZone = deviceTimeZone();
    const today = computed(() => localDateOf(new Date(now()), timeZone));
    const memory = computed(() => memoryOf(concepts(), events()));
    const days = computed(() => countedDays(events(), sessions()));
    return {
      timeZone: computed(() => timeZone),
      today,
      memory,
      streak: computed(() =>
        computeStreak(days().counted, days().full, today(), days().doubled, {
          mode: settings().streakMode,
          weeklyTarget: settings().weeklyTarget,
        }),
      ),
      xp: computed(() => levelOf(xpOf(events(), sessions(), teachBacks()))),
      xpTotal: computed(() => xpOf(events(), sessions(), teachBacks())),
      progress: computed(() => ({
        events: events(),
        sessions: sessions(),
        memory: memory(),
        longestStreak: computeStreak(
          days().counted,
          days().full,
          today(),
          days().doubled,
        ).longest,
        level: levelOf(xpOf(events(), sessions(), teachBacks())).level,
        teachBacks: teachBacks(),
      })),
      todaySet: computed(
        () =>
          sessions().find(
            (session) =>
              session.kind === 'daily' && session.localDate === today(),
          ) ?? null,
      ),
    };
  }),
  withComputed(({ progress }) => ({
    milestones: computed(() => milestonesOf(progress())),
    themes: computed(() => themesOf(progress())),
  })),
  withComputed(({ concepts, captures, links }) => ({
    /** The digest: drafts the AI wrote, waiting to be kept or discarded. */
    drafts: computed(() => concepts().filter((c) => c.status === 'draft')),
    /** The library: concepts the learner kept. */
    library: computed(() => concepts().filter((c) => c.status !== 'draft')),
    /**
     * The AI's link suggestions between concepts the learner kept; one to a
     * draft waits until the draft is kept.
     */
    linkSuggestions: computed(() => {
      const kept = new Map(
        concepts()
          .filter((c) => c.status !== 'draft' && !c.deletedAt)
          .map((c) => [c.id, c]),
      );
      return links()
        .filter(
          (link) =>
            !link.confirmed &&
            !link.deletedAt &&
            kept.has(link.from) &&
            kept.has(link.to),
        )
        .map((link) => ({
          link,
          from: kept.get(link.from) as Concept,
          to: kept.get(link.to) as Concept,
        }));
    }),
    /** Captures not yet turned into drafts, or that need the learner. */
    inProgress: computed(() =>
      captures().filter((capture) => capture.status !== 'ready'),
    ),
  })),
  withMethods((store) => {
    const runtime = inject(LearningRuntime);
    let timer: ReturnType<typeof setTimeout> | null = null;
    let followUp: ReturnType<typeof setTimeout> | null = null;
    let noticeTimer: ReturnType<typeof setTimeout> | null = null;

    function notify(notice: string): void {
      patchState(store, { notice });
      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => patchState(store, { notice: null }), 4000);
    }

    async function refresh(): Promise<void> {
      const { local, unavailable } = await runtime.open();
      const [
        concepts,
        topics,
        captures,
        pending,
        session,
        sessions,
        events,
        teachBacks,
        links,
        settingsRecord,
        legacySettings,
      ] = await Promise.all([
        local.concepts(),
        local.topics(),
        local.captures(),
        local.pendingCount(),
        local.session(),
        local.sessions(),
        local.events(),
        local.teachBacks(),
        local.links(),
        local.settingsRecord(),
        local.getMeta<Partial<LearnerSettings>>('learner'),
      ]);
      const settings: LearnerSettings = settingsRecord
        ? {
            dailyCap: settingsRecord.dailyCap,
            newPerDay: settingsRecord.newPerDay,
            streakMode: settingsRecord.streakMode,
            weeklyTarget: settingsRecord.weeklyTarget,
            morning: settingsRecord.morning,
            evening: settingsRecord.evening,
            vacationUntil: settingsRecord.vacationUntil,
            gardenTheme: settingsRecord.gardenTheme,
            weeklyRecap: settingsRecord.weeklyRecap,
          }
        : { ...DEFAULT_SETTINGS, ...legacySettings };
      patchState(store, {
        concepts,
        topics,
        captures,
        sessions,
        events,
        teachBacks,
        links,
        settings,
        now: new Date().toISOString(),
        pending,
        unavailable,
        device: session
          ? { id: session.deviceId, name: session.deviceName }
          : null,
      });
      publishTodaySummary();
    }

    /**
     * Today's set for host apps on this origin (the portfolio's chip), in
     * localStorage: a small public summary, never the database.
     */
    function publishTodaySummary(): void {
      const today = store.todaySet();
      const done = today
        ? new Set(
            store
              .events()
              .filter((event) => event.sessionId === today.id)
              .map((event) => event.conceptId),
          ).size
        : 0;
      const summary: LearningTodaySummary = {
        localDate: store.today(),
        total: today?.planned.length ?? 0,
        done,
        streak: store.streak().current,
        updatedAt: new Date().toISOString(),
      };
      try {
        globalThis.localStorage?.setItem(
          TODAY_SUMMARY_KEY,
          JSON.stringify(summary),
        );
      } catch {
        // Storage blocked: the chip simply doesn't show.
      }
    }

    function applyOutcome(outcome: SyncOutcome): void {
      const at = new Date().toISOString();
      switch (outcome.status) {
        case 'synced':
          patchState(store, {
            sync: {
              state: 'synced',
              at,
              message: outcome.rejected.length
                ? `${outcome.rejected.length} change(s) were refused: this device's clock is ahead. Check its date and time.`
                : null,
            },
          });
          return;
        case 'unpaired':
          patchState(store, {
            sync: { state: 'unpaired', at: null, message: null },
          });
          return;
        case 'failed':
          patchState(store, {
            sync: {
              state: outcome.offline ? 'offline' : 'failed',
              at: store.sync().at,
              message: outcome.message,
            },
          });
      }
    }

    async function syncNow(): Promise<void> {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const { client, unavailable } = await runtime.open();
      if (!client) {
        patchState(store, {
          unavailable,
          sync: { state: 'unavailable', at: null, message: null },
        });
        return;
      }
      patchState(store, { sync: { ...store.sync(), state: 'syncing' } });
      const prevSettings = store.settings();
      const outcome = await client.sync();
      applyOutcome(outcome);
      await refresh();
      if (
        outcome.status === 'synced' &&
        JSON.stringify(prevSettings) !== JSON.stringify(store.settings())
      ) {
        void pushNudgeState();
      }
      if (followUp) clearTimeout(followUp);
      followUp = null;
      const waiting = store
        .captures()
        .some((capture) => IN_FLIGHT.includes(capture.status));
      if (outcome.status === 'synced' && waiting) {
        followUp = setTimeout(() => void syncNow(), FOLLOW_UP_MS);
      }
    }

    /** Tells the edge Worker what it needs to time nudges (design §10). */
    async function pushNudgeState(): Promise<void> {
      const { edge, local } = await runtime.open();
      const session = await local.session();
      if (!edge || !session) return;
      const settings = store.settings();
      const today = store.todaySet();
      await edge.putNudgeState(
        {
          timeZone: store.timeZone(),
          morning:
            settings.morning ??
            learnedMorning(store.sessions(), store.timeZone()) ??
            '08:00',
          evening: settings.evening,
          setSize: today?.planned.length ?? settings.dailyCap,
          streak: store.streak().current,
          doneDate: today?.completedAt ? today.localDate : null,
          vacationUntil: settings.vacationUntil,
          recap: settings.weeklyRecap,
          week: weekStats({
            events: store.events(),
            concepts: store.concepts(),
            memory: store.memory(),
            teachBacks: store.teachBacks(),
            today: store.today(),
            timeZone: store.timeZone(),
          }),
        },
        session.token,
      );
    }

    function newCapture(fields: Partial<Capture>): Capture {
      const at = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        updatedAt: at,
        deletedAt: null,
        modality: 'text',
        text: null,
        hasAudio: false,
        transcript: null,
        source: null,
        status: 'queued',
        attempts: 0,
        error: null,
        force: false,
        conceptIds: [],
        capturedAt: at,
        ...fields,
      };
    }

    /**
     * The portfolio copy has no server: a capture turns at once into one
     * of the ready-made concepts, and says so (design §9).
     */
    async function demoProcess(capture: Capture): Promise<void> {
      const { local, unavailable } = await runtime.open();
      if (unavailable !== 'demo') return;
      const done = store.captures().filter((c) => c.status === 'ready').length;
      const golden = demoDraftSource(done);
      const draft = draftConceptFrom({
        title: golden.title,
        type: golden.type,
        topicId: null,
        span: golden.span,
        captureId: capture.id,
        explained: golden.explained,
        now: new Date(),
      });
      await local.saveConcept(draft);
      await local.saveCapture({
        ...capture,
        status: 'ready',
        conceptIds: [draft.id],
        error: 'Demo: the real app sends your words to the AI.',
      });
    }

    async function updateCapture(
      id: string,
      change: Partial<Capture>,
    ): Promise<void> {
      const { local } = await runtime.open();
      const capture = (await local.captures()).find((c) => c.id === id);
      if (!capture) return;
      await local.saveCapture({ ...capture, ...change });
      await refresh();
      syncSoon();
    }

    async function updateConcept(
      id: string,
      change: Partial<Concept>,
      groups?: readonly ConceptFieldGroup[],
    ): Promise<void> {
      const { local } = await runtime.open();
      const concept = (await local.concepts()).find((c) => c.id === id);
      if (!concept) return;
      const session = await local.session();
      const at = new Date().toISOString();
      const by = session?.deviceId ?? 'local';
      let next: Concept = { ...concept, ...change };
      const effectiveGroups = groups ? [...groups] : [];
      if (
        change.explanation &&
        JSON.stringify(change.explanation) !==
          JSON.stringify(concept.explanation)
      ) {
        const revised = withRevisedExplanation(
          concept,
          change.explanation,
          at,
          by,
        );
        next = {
          ...next,
          explanation: revised.explanation,
          explanationHistory: revised.explanationHistory,
          version: revised.version,
          fieldRevisions: revised.fieldRevisions,
        };
        if (!effectiveGroups.includes('explanation')) {
          effectiveGroups.push('explanation');
        }
      } else if (
        change.title !== undefined &&
        change.title !== concept.title &&
        !effectiveGroups.includes('explanation')
      ) {
        effectiveGroups.push('explanation');
      }
      await local.saveConcept(
        next,
        effectiveGroups.length ? effectiveGroups : undefined,
      );
      await refresh();
      syncSoon();
    }

    function syncSoon(): void {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), SYNC_DELAY_MS);
    }

    return {
      async load(): Promise<void> {
        try {
          await refresh();
          patchState(store, { ready: true });
          await syncNow();
          // Keeps the Worker's view of the day current, e.g. a new time zone.
          void pushNudgeState();
        } catch (error) {
          patchState(store, { ready: true, fatal: messageOf(error) });
        }
      },

      syncNow,
      syncSoon,

      /**
       * Today's Daily Set: the one already frozen for today (on any device),
       * or a new one composed now and saved, so it syncs.
       */
      async startToday(): Promise<ReviewSession> {
        const { local } = await runtime.open();
        await refresh();
        const existing = store.todaySet();
        if (existing) return existing;
        const now = new Date();
        const { planned, lighter } = composeDailySet({
          concepts: store.concepts(),
          memory: store.memory(),
          sessions: store.sessions(),
          events: store.events(),
          localDate: store.today(),
          now,
          timeZone: store.timeZone(),
          cap: store.settings().dailyCap,
          newPerDay: store.settings().newPerDay,
          teachBacks: store.teachBacks(),
          links: store.links(),
        });
        const session = await local.saveSession({
          id: crypto.randomUUID(),
          updatedAt: now.toISOString(),
          deletedAt: null,
          localDate: store.today(),
          kind: 'daily',
          planned,
          lighter,
          startedAt: now.toISOString(),
          // A day with nothing due still counts: the set is done at once.
          completedAt: planned.length ? null : now.toISOString(),
        });
        await refresh();
        syncSoon();
        return session;
      },

      /** More cards after the Daily Set, for those who want them. */
      async startBonus(): Promise<ReviewSession | null> {
        const { local } = await runtime.open();
        const inToday = new Set(
          store
            .sessions()
            .filter((session) => session.localDate === store.today())
            .flatMap((session) =>
              session.planned.map((item) => item.conceptId),
            ),
        );
        const now = new Date();
        const { planned } = composeDailySet({
          concepts: store.concepts(),
          memory: store.memory(),
          sessions: [],
          events: store.events(),
          localDate: store.today(),
          now,
          timeZone: store.timeZone(),
          cap: 5,
          newPerDay: 0,
          exclude: inToday,
        });
        if (!planned.length) return null;
        const session = await local.saveSession({
          id: crypto.randomUUID(),
          updatedAt: now.toISOString(),
          deletedAt: null,
          localDate: store.today(),
          kind: 'bonus',
          // A bonus round stays quick: no teach-back in it.
          planned: planned.map(({ conceptId, promptId }) => ({
            conceptId,
            promptId,
          })),
          lighter: false,
          startedAt: now.toISOString(),
          completedAt: null,
        });
        await refresh();
        syncSoon();
        return session;
      },

      /** One graded card (append-only, design §4.3). */
      async recordAnswer(input: {
        session: ReviewSession;
        conceptId: string;
        promptId: string;
        rating: ReviewEvent['rating'];
        answer: string | null;
        ms: number;
        aiVerdict?: AiVerdict | null;
      }): Promise<void> {
        const { local } = await runtime.open();
        const at = new Date();
        await local.appendEvent({
          id: crypto.randomUUID(),
          conceptId: input.conceptId,
          promptId: input.promptId,
          sessionId: input.session.id,
          at: at.toISOString(),
          localDate: localDateOf(at, store.timeZone()),
          rating: input.rating,
          answer: input.answer?.trim().slice(0, 1200) || null,
          ms: Math.min(3_600_000, Math.max(0, Math.round(input.ms))),
          ...(input.aiVerdict !== undefined
            ? { aiVerdict: input.aiVerdict }
            : {}),
        });
        await refresh();
      },

      async transcribe(
        audio: { bytes: ArrayBuffer; mimeType: string },
        budgetMs = 15_000,
      ): Promise<{ text: string | null; problem: string | null }> {
        const { api, local } = await runtime.open();
        const pairing = await local.session();
        if (!api || !pairing) {
          return {
            text: null,
            problem:
              'Hearing a voice answer needs this device paired. Type it instead, or reveal to rate yourself.',
          };
        }
        try {
          const res = await api.transcribe(
            audio,
            pairing.token,
            AbortSignal.timeout(budgetMs),
          );
          return { text: res.text.trim() || null, problem: null };
        } catch {
          return {
            text: null,
            problem:
              'The recording couldn’t be transcribed. Type it or reveal to rate yourself.',
          };
        }
      },

      async completeSession(session: ReviewSession): Promise<void> {
        const { local } = await runtime.open();
        await local.saveSession({
          ...session,
          completedAt: new Date().toISOString(),
        });
        await refresh();
        syncSoon();
        void pushNudgeState();
      },

      /**
       * AI feedback on a typed answer, within `budgetMs`; null when there is
       * no connection, no pairing, or no answer in time (design §6.3).
       */
      async grade(
        prompt: RecallPrompt,
        answer: string,
        budgetMs = 6000,
      ): Promise<{
        verdict: 'nailed' | 'close' | 'missed' | null;
        missed: string[];
        suggested: 'again' | 'hard' | 'good' | null;
      } | null> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session || !prompt.keyPoints.length || !answer.trim()) {
          return null;
        }
        try {
          return await api.grade(
            {
              question: prompt.question,
              expected: prompt.answer,
              keyPoints: prompt.keyPoints,
              answer,
            },
            session.token,
            AbortSignal.timeout(budgetMs),
          );
        } catch {
          return null;
        }
      },

      /**
       * A teach-back (design §6.3): the recording is transcribed, then the
       * explanation is judged by the concept's key points and clarity. It is
       * kept (and synced) whenever there is text, judged or not; feedback
       * is null without a pairing, a connection, or an answer in time.
       */
      async teachBack(input: {
        concept: Concept;
        sessionId: string | null;
        text?: string;
        audio?: { bytes: ArrayBuffer; mimeType: string };
        budgetMs?: number;
      }): Promise<{
        transcript: string | null;
        feedback: TeachBackFeedback | null;
        problem: string | null;
      }> {
        const { api, local } = await runtime.open();
        const pairing = await local.session();
        const budget = () => AbortSignal.timeout(input.budgetMs ?? 15_000);
        let transcript = input.text?.trim() || null;
        let problem: string | null = null;
        if (!transcript && input.audio) {
          if (!api || !pairing) {
            return {
              transcript: null,
              feedback: null,
              problem:
                'Hearing a recording needs this device paired. Type it instead, or rate yourself.',
            };
          }
          try {
            transcript =
              (await api.transcribe(input.audio, pairing.token, budget()))
                .text || null;
          } catch {
            problem = 'The recording couldn’t be transcribed. Rate yourself.';
          }
        }
        if (!transcript) {
          return { transcript: null, feedback: null, problem };
        }
        const points = teachPoints(input.concept);
        let feedback: TeachBackFeedback | null = null;
        if (api && pairing && transcript.length >= TEACH_BACK_MIN_CHARS) {
          try {
            feedback = await api.teachBack(
              { title: input.concept.title, points, transcript },
              pairing.token,
              budget(),
            );
          } catch {
            problem = 'No feedback this time. Compare with the key points.';
          }
        }
        const at = new Date();
        await local.appendTeachBack({
          id: crypto.randomUUID(),
          conceptId: input.concept.id,
          sessionId: input.sessionId,
          at: at.toISOString(),
          localDate: localDateOf(at, store.timeZone()),
          modality: input.audio && !input.text ? 'voice' : 'text',
          transcript: transcript.slice(0, LIMITS.teachBack),
          clarity: feedback?.clarity ?? null,
          covered: feedback?.covered ?? [],
          gaps: feedback?.gaps ?? [],
        });
        await refresh();
        syncSoon();
        return { transcript, feedback, problem };
      },

      /** "Yes, they're related": the link starts giving contrast cards. */
      async confirmLink(link: ConceptLink): Promise<void> {
        const { local } = await runtime.open();
        await local.saveLink({ ...link, confirmed: true });
        await refresh();
        syncSoon();
      },

      /** "Not really": the suggestion goes, on every device. */
      async dismissLink(link: ConceptLink): Promise<void> {
        const { local } = await runtime.open();
        await local.saveLink({ ...link, deletedAt: new Date().toISOString() });
        await refresh();
        syncSoon();
      },

      /** The learner's own link, confirmed at once. Replaces one between the same two. */
      async addLink(
        from: string,
        to: string,
        relation: LinkRelation,
      ): Promise<void> {
        if (from === to) return;
        const { local } = await runtime.open();
        const now = new Date();
        for (const old of store.links()) {
          const same =
            (old.from === from && old.to === to) ||
            (old.from === to && old.to === from);
          if (same) {
            await local.saveLink({ ...old, deletedAt: now.toISOString() });
          }
        }
        await local.saveLink(
          linkRecord({ from, to, relation, by: 'user', now }),
        );
        await refresh();
        syncSoon();
      },

      async saveSettings(change: Partial<LearnerSettings>): Promise<void> {
        const { local } = await runtime.open();
        const settings: LearnerSettings = { ...store.settings(), ...change };
        await Promise.all([
          local.saveSettingsRecord({
            id: SETTINGS_RECORD_ID,
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            ...settings,
          }),
          local.setMeta('learner', settings),
        ]);
        patchState(store, { settings });
        syncSoon();
        void pushNudgeState();
      },

      /** A typed capture: saved at once, processed by the server (design 1). */
      async capture(text: string): Promise<void> {
        const { local } = await runtime.open();
        const capture = await local.saveCapture(
          newCapture({ text: text.trim().slice(0, 4000) }),
        );
        await demoProcess(capture);
        await refresh();
        notify('Got it ✓');
        syncSoon();
      },

      /** Ideas another app or the share sheet sent, once the learner says yes. */
      async captureItems(
        items: readonly CaptureItem[],
        modality: 'host' | 'share',
      ): Promise<void> {
        const { local } = await runtime.open();
        for (const item of items) {
          const capture = await local.saveCapture(
            newCapture({
              modality,
              text: item.text.slice(0, 4000),
              source: item.source,
            }),
          );
          await demoProcess(capture);
        }
        await refresh();
        notify(items.length === 1 ? 'Got it ✓' : `Got ${items.length} ✓`);
        syncSoon();
      },

      /** A voice note: the audio waits on the device until the server has it. */
      async captureVoice(audio: {
        bytes: ArrayBuffer;
        mimeType: string;
      }): Promise<void> {
        const { local } = await runtime.open();
        await local.addVoiceCapture(
          newCapture({ modality: 'voice', hasAudio: true }),
          audio,
        );
        await refresh();
        notify('Got it ✓');
        syncSoon();
      },

      /** Try again after the AI failed three times. */
      retryCapture(id: string): Promise<void> {
        return updateCapture(id, {
          status: 'queued',
          attempts: 0,
          error: null,
        });
      },

      /** Triage thought it wasn't learnable; the learner disagrees. */
      processAnyway(id: string): Promise<void> {
        return updateCapture(id, {
          status: 'queued',
          force: true,
          attempts: 0,
          error: null,
        });
      },

      dismissCapture(id: string): Promise<void> {
        return updateCapture(id, { deletedAt: new Date().toISOString() });
      },

      /** Keep a draft: it joins the library and, from L3, the reviews. */
      async keep(id: string): Promise<void> {
        await updateConcept(
          id,
          {
            status: 'active',
            confirmedAt: new Date().toISOString(),
          },
          ['status'],
        );
        notify('Kept ✓');
      },

      async discard(id: string): Promise<void> {
        const { local } = await runtime.open();
        await local.deleteConcept(id);
        await refresh();
        syncSoon();
      },

      /** "Make it simpler": the server rewrites; offline, it says so. */
      async simpler(id: string): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) {
          notify('Rewriting needs a paired device and a connection.');
          return;
        }
        patchState(store, { revising: [...store.revising(), id] });
        try {
          // The server must have the draft before it can rewrite it.
          await syncNow();
          const expectedVersion = store
            .concepts()
            .find((c) => c.id === id)?.version;
          const concept = await api.revise(
            id,
            'simpler',
            session.token,
            expectedVersion,
          );
          await local.applyPull([
            { kind: 'concept', seq: 0, by: SERVER_WRITER, data: concept },
          ]);
          await refresh();
        } catch (error) {
          if (error instanceof LearningApiError && error.status === 409) {
            await syncNow();
            notify('This concept changed on another device — refreshed.');
          } else {
            notify(messageOf(error));
          }
        } finally {
          patchState(store, {
            revising: store.revising().filter((revising) => revising !== id),
          });
        }
      },

      updateConcept,

      async addTopic(name: string): Promise<Topic> {
        const trimmed = name.trim().slice(0, LIMITS.topicName);
        const existing = store
          .topics()
          .find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        const { local } = await runtime.open();
        const at = new Date().toISOString();
        const hue =
          Math.abs(
            [...trimmed].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7),
          ) % 360;
        const topic = await local.saveTopic({
          id: crypto.randomUUID(),
          updatedAt: at,
          deletedAt: null,
          name: trimmed,
          parentId: null,
          hue,
        });
        await refresh();
        syncSoon();
        return topic;
      },

      async addConcept(draft: ConceptDraft): Promise<void> {
        const { local } = await runtime.open();
        await local.saveConcept(conceptFromDraft(draft, new Date()));
        await refresh();
        syncSoon();
      },

      async deleteConcept(id: string): Promise<void> {
        const { local } = await runtime.open();
        await local.deleteConcept(id);
        await refresh();
        syncSoon();
      },

      setDeviceName(deviceName: string): void {
        patchState(store, { pairing: { ...store.pairing(), deviceName } });
      },

      /** Asks the server to send a code to the owner's Telegram. */
      async startPairing(): Promise<void> {
        const { api } = await runtime.open();
        const pairing = store.pairing();
        if (!api || pairing.busy) return;
        patchState(store, { pairing: { ...pairing, busy: true, error: null } });
        try {
          const started = await api.startPairing(pairing.deviceName);
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              pairingId: started.pairingId,
              expiresAt: started.expiresAt,
            },
          });
        } catch (error) {
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              error: messageOf(error),
            },
          });
        }
      },

      async confirmPairing(code: string): Promise<void> {
        const { api, local } = await runtime.open();
        const pairing = store.pairing();
        if (!api || !pairing.pairingId || pairing.busy) return;
        patchState(store, { pairing: { ...pairing, busy: true, error: null } });
        try {
          const paired = await api.confirmPairing(pairing.pairingId, code);
          await local.setSession({
            deviceId: paired.deviceId,
            deviceName: paired.deviceName,
            token: paired.token,
            expiresAt: paired.expiresAt,
          });
          patchState(store, { pairing: { ...initialState.pairing } });
          await refresh();
          await syncNow();
        } catch (error) {
          // An expired or spent pairing can't take more codes: start over.
          const gone =
            error instanceof LearningApiError && error.status === 404;
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              pairingId: gone ? null : pairing.pairingId,
              error: messageOf(error),
            },
          });
        }
      },

      cancelPairing(): void {
        patchState(store, {
          pairing: {
            ...initialState.pairing,
            deviceName: store.pairing().deviceName,
          },
        });
      },

      async loadDevices(): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) {
          patchState(store, { devices: [] });
          return;
        }
        try {
          patchState(store, { devices: await api.devices(session.token) });
        } catch (error) {
          if (
            error instanceof LearningApiError &&
            error.kind === 'unauthorized'
          ) {
            await local.clearSession();
            await refresh();
          }
          patchState(store, {
            sync: { ...store.sync(), message: messageOf(error) },
          });
        }
      },

      /**
       * Lets a host app in (design §9) from this paired device. Throws a
       * message to show when it can't: not paired, no server, refused.
       */
      async linkHost(app: HostApp, name: string): Promise<HostLinked> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) {
          throw new Error('Pair this device first, under Devices.');
        }
        try {
          return await api.linkHost(
            { app, name: name.slice(0, PAIRING.deviceName) },
            session.token,
          );
        } catch (error) {
          if (
            error instanceof LearningApiError &&
            error.kind === 'unauthorized'
          ) {
            await local.clearSession();
            await refresh();
          }
          throw error;
        }
      },

      async removeDevice(id: string): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) return;
        try {
          await api.revokeDevice(id, session.token);
          if (id === session.deviceId) {
            await local.clearSession();
            await refresh();
            patchState(store, {
              devices: [],
              sync: { state: 'unpaired', at: null, message: null },
            });
            return;
          }
          patchState(store, {
            devices: store.devices().filter((device) => device.id !== id),
          });
        } catch (error) {
          patchState(store, {
            sync: { ...store.sync(), message: messageOf(error) },
          });
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      if (typeof window === 'undefined') return;
      const onOnline = () => void store.syncNow();
      const onVisible = () => {
        if (document.visibilityState === 'visible') void store.syncNow();
      };
      window.addEventListener('online', onOnline);
      document.addEventListener('visibilitychange', onVisible);
      inject(DestroyRef).onDestroy(() => {
        window.removeEventListener('online', onOnline);
        document.removeEventListener('visibilitychange', onVisible);
      });
    },
  }),
);
