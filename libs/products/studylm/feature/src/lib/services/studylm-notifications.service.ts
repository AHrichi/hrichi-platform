import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  type LocalNotification,
  PushRelayClient,
  type PushTarget,
  WebPush,
} from '@ah/platform/web-push';
import { SiteConfigService } from '@ah/shared/site-config';
import { StudyLmStore } from '../store/studylm.store';
import { BulkGenerationService } from './bulk-generation.service';
import {
  type LessonJob,
  LessonGenerationService,
} from './lesson-generation.service';
import { lessonIdFor } from './lesson-generator';
import { StudyLmStorageService } from './studylm-storage.service';
import { StudyLmSyncService } from './studylm-sync.service';

/** Per-device notification choices, kept in localStorage. */
export interface StudyLmNotifySettings {
  /** "HH:MM" for the daily study reminder; null for none. */
  reminderAt: string | null;
  /** Tell me when AI work finishes while StudyLM is in the background. */
  aiDone: boolean;
}

const SETTINGS_KEY = 'studylm.notifications';
const DEFAULTS: StudyLmNotifySettings = { reminderAt: '18:00', aiDone: true };

/** What the edge Worker needs for the reminder (`StudyReminderStateSchema`). */
export interface StudyReminderPayload {
  timeZone: string;
  at: string | null;
  studiedDate: string | null;
  next: { title: string; url: string; minutes: number | null } | null;
  shakyCards: number;
}

/** Why this device can't turn push on, when it can't. */
export type StudyLmPushBlocker = 'demo' | 'no-edge' | 'unpaired' | null;

function localDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * StudyLM's notifications:
 * - **Study reminder** (push, through the Learning Engine's edge Worker): at
 *   the chosen time, when nothing was studied today, "Next up: …".
 * - **AI work finished** (local): a lesson, flashcards, a quiz, a roadmap or
 *   a bulk run that finishes while StudyLM is in the background.
 */
@Injectable({ providedIn: 'root' })
export class StudyLmNotifications {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  private readonly siteConfig = inject(SiteConfigService, { optional: true });
  private readonly sync = inject(StudyLmSyncService, { optional: true });
  private readonly store = inject(StudyLmStore);
  private readonly storage = inject(StudyLmStorageService);
  private readonly lessons = inject(LessonGenerationService);
  private readonly bulk = inject(BulkGenerationService);
  readonly push = inject(WebPush);

  readonly settings = signal<StudyLmNotifySettings>(this.readSettings());
  readonly blocker = signal<StudyLmPushBlocker>(null);
  readonly showPanel = signal(false);
  /** Shown as a dot on the bell until push is on. */
  readonly needsAttention = computed(
    () =>
      !this.push.subscribed() &&
      this.push.support() === 'ready' &&
      this.push.permission() !== 'denied',
  );

  private started = false;
  private stateTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (!this.browser) return;
    this.watchGeneration();
    // Leaving the app is when the day's study is most likely done: tell the
    // Worker, so tonight's reminder knows.
    const onHide = () => {
      if (this.document.visibilityState === 'hidden') void this.sendState();
    };
    this.document.addEventListener('visibilitychange', onHide);
    inject(DestroyRef).onDestroy(() =>
      this.document.removeEventListener('visibilitychange', onHide),
    );
  }

  /** Called once by the shell. */
  start(): void {
    if (this.started || !this.browser) return;
    this.started = true;
    void this.refresh();
  }

  async refresh(): Promise<void> {
    await this.push.refresh();
    const target = await this.target();
    if (target) {
      await this.push.resync(target);
      this.scheduleState(0);
    }
  }

  open(): void {
    this.showPanel.set(true);
    void this.refresh();
  }

  async enable(): Promise<void> {
    const target = await this.target();
    if (target && (await this.push.enable(target))) this.scheduleState(0);
  }

  async disable(): Promise<void> {
    const target = await this.target();
    if (target) await this.push.disable(target);
  }

  async test(): Promise<void> {
    const target = await this.target();
    if (target) await this.push.test(target);
  }

  update(patch: Partial<StudyLmNotifySettings>): void {
    this.settings.update((current) => ({ ...current, ...patch }));
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings()));
    } catch {
      // Private mode: the choice lasts for this visit.
    }
    if (patch.aiDone) void this.push.allowLocal();
    if ('reminderAt' in patch) this.scheduleState(0);
  }

  private scheduleState(delay: number): void {
    if (!this.browser) return;
    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.stateTimer = setTimeout(() => void this.sendState(), delay);
  }

  private async sendState(): Promise<void> {
    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.stateTimer = null;
    if (!this.push.subscribed()) return;
    const target = await this.target();
    if (!target) return;
    await target.relay.putState(
      '/studylm/state',
      await this.reminderState(),
      target.token,
    );
  }

  /** The reminder's state, from what's on this device. */
  async reminderState(): Promise<StudyReminderPayload> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const subject = this.store.activeSubject();
    const sections = this.store.allSections();
    const [generated, progress] = await Promise.all([
      this.storage.listGeneratedLessons(),
      this.storage.getAllLessonProgress(),
    ]);
    const progressOf = new Map(progress.map((p) => [p.lessonId, p]));
    const lessonsOf = new Map(
      generated
        .filter((record) => record.subjectId === subject?.id)
        .map((record) => [record.sectionId, record]),
    );

    let next: StudyReminderPayload['next'] = null;
    if (subject) {
      for (const section of sections) {
        const record = lessonsOf.get(section.id);
        const id = record?.id ?? lessonIdFor(subject.id, section.id);
        if (progressOf.get(id)?.completedAt) continue;
        const title = clip(`${section.code} ${section.title}`, 140);
        next = record
          ? {
              title,
              url: `/learn/${encodeURIComponent(id)}`,
              minutes: record.lesson?.minutes ?? null,
            }
          : {
              title,
              url: `/roadmap?section=${encodeURIComponent(section.id)}`,
              minutes: null,
            };
        break;
      }
    }

    const moments = [
      ...progress.map((p) => p.updatedAt),
      ...this.store
        .flashcards()
        .map((card) => card.lastReviewedAt)
        .filter((at): at is string => !!at),
    ].sort();
    const last = moments.at(-1);
    return {
      timeZone,
      at: this.settings().reminderAt,
      studiedDate: last ? localDate(last, timeZone) : null,
      next,
      shakyCards: this.store
        .flashcards()
        .filter(
          (card) => card.lastRating === 'again' || card.lastRating === 'hard',
        ).length,
    };
  }

  private async target(): Promise<PushTarget | null> {
    if (!this.standalone) {
      this.blocker.set('demo');
      return null;
    }
    const config = await this.siteConfig?.load().catch(() => null);
    const edgeUrl = config?.learningEdgeUrl;
    if (!edgeUrl) {
      this.blocker.set('no-edge');
      return null;
    }
    const session = this.sync?.device();
    if (!session) {
      this.blocker.set('unpaired');
      return null;
    }
    this.blocker.set(null);
    return {
      app: 'studylm',
      relay: new PushRelayClient(edgeUrl),
      token: session.token,
    };
  }

  // -------------------------------------------------------------------------
  // "AI work finished" while the app is in the background

  private notifyDone(message: LocalNotification): void {
    if (!this.settings().aiDone) return;
    if (this.document.visibilityState === 'visible') return;
    void this.push.notify(message);
  }

  private sectionTitle(id: string): string {
    const section = this.store.allSections().find((s) => s.id === id);
    return section ? `${section.code} ${section.title}` : 'a section';
  }

  private watchGeneration(): void {
    // Lessons: a job moving to ready or failed. During a bulk run only the
    // run's summary is sent.
    let jobs: Record<string, LessonJob> = this.lessons.jobs();
    effect(() => {
      const now = this.lessons.jobs();
      untracked(() => {
        if (!this.bulk.isGenerating()) {
          for (const [id, job] of Object.entries(now)) {
            const before = jobs[id]?.status;
            const busy = before === 'planning' || before === 'writing';
            if (!busy) continue;
            if (job.status === 'ready') {
              this.notifyDone({
                title: 'Lesson ready',
                body: job.lesson?.title ?? 'Your new lesson is written.',
                url: `/learn/${encodeURIComponent(id)}`,
                tag: `studylm-lesson-${id}`.slice(0, 60),
              });
            } else if (job.status === 'failed') {
              this.notifyDone({
                title: 'A lesson couldn’t be written',
                body: job.error ?? 'Open StudyLM to try again.',
                url: '/learn',
                tag: 'studylm-lesson-failed',
              });
            }
          }
        }
        jobs = now;
      });
    });

    let bulkWasRunning = this.bulk.isGenerating();
    effect(() => {
      const running = this.bulk.isGenerating();
      untracked(() => {
        if (bulkWasRunning && !running) {
          const done = this.bulk.succeededCount();
          const failed = this.bulk.failedItems().length;
          this.notifyDone({
            title: 'Bulk generation finished',
            body: `${done} lesson${done === 1 ? '' : 's'} written${failed ? `, ${failed} failed` : ''}.`,
            url: '/learn',
            tag: 'studylm-bulk',
          });
        }
        bulkWasRunning = running;
      });
    });

    this.watchSet(
      () => this.store.generatingFlashcardSectionIds(),
      (id) => ({
        title: 'Flashcards ready',
        body: this.sectionTitle(id),
        url: `/flashcards?section=${encodeURIComponent(id)}`,
        tag: 'studylm-flashcards',
      }),
    );
    this.watchSet(
      () => this.store.generatingQuizSectionIds(),
      (id) => ({
        title: 'Quiz ready',
        body: this.sectionTitle(id),
        url: `/quiz?section=${encodeURIComponent(id)}`,
        tag: 'studylm-quiz',
      }),
    );

    let roadmapWasRunning = this.store.isGeneratingRoadmap();
    effect(() => {
      const running = this.store.isGeneratingRoadmap();
      untracked(() => {
        if (roadmapWasRunning && !running) {
          const error =
            this.store.roadmapError() ?? this.store.roadmapRejectionReason();
          this.notifyDone(
            error
              ? {
                  title: 'The roadmap couldn’t be written',
                  body: clip(error, 120),
                  url: '/roadmap',
                  tag: 'studylm-roadmap',
                }
              : {
                  title: 'Roadmap ready',
                  body:
                    this.store.activeSubject()?.title ??
                    'Your roadmap is ready.',
                  url: '/roadmap',
                  tag: 'studylm-roadmap',
                },
          );
        }
        roadmapWasRunning = running;
      });
    });
  }

  /** Notifies for each id that leaves a "generating" list. */
  private watchSet(
    read: () => readonly string[],
    message: (id: string) => LocalNotification,
  ): void {
    let before = new Set(read());
    effect(() => {
      const now = new Set(read());
      untracked(() => {
        for (const id of before) {
          if (!now.has(id)) this.notifyDone(message(id));
        }
        before = now;
      });
    });
  }

  private readSettings(): StudyLmNotifySettings {
    try {
      const raw = globalThis.localStorage?.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULTS;
      const parsed = JSON.parse(raw) as Partial<StudyLmNotifySettings>;
      return {
        reminderAt:
          parsed.reminderAt === null ||
          (typeof parsed.reminderAt === 'string' &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.reminderAt))
            ? parsed.reminderAt
            : DEFAULTS.reminderAt,
        aiDone:
          typeof parsed.aiDone === 'boolean' ? parsed.aiDone : DEFAULTS.aiDone,
      };
    } catch {
      return DEFAULTS;
    }
  }
}
