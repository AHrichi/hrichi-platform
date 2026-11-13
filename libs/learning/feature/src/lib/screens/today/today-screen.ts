import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  type AiVerdict,
  choosePrompt,
  CLARITY_LABELS,
  type Clarity,
  composeDailySet,
  type Concept,
  type MasteryTier,
  memoryOf,
  type PlannedItem,
  type PromptType,
  type RecallPrompt,
  type ReviewEvent,
  type ReviewSession,
  TEACH_BACK_SECONDS,
  type TeachBackFeedback,
  teachPoints,
  tierOf,
} from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import {
  type RecordedAudio,
  VoiceRecorder,
} from '../../capture/voice-recorder';
import { LearningStore } from '../../store/learning.store';
import {
  ProgressDots,
  SetCompletion,
  StreakFlame,
  SwipeCard,
  type SwipeDirection,
} from '@ah/learning/ui';

const TYPE_LABELS: Record<PromptType, string> = {
  free_recall: 'Explain',
  cloze: 'Fill the blank',
  why: 'Why?',
  apply: 'Apply it',
  contrast: 'Compare',
  spot_error: 'Spot the mistake',
  quick_fire: 'Quick',
};

const RATING_BY_SWIPE: Record<SwipeDirection, ReviewEvent['rating']> = {
  left: 'again',
  up: 'hard',
  right: 'good',
};

const TIER_ORDER: MasteryTier[] = ['seed', 'sprout', 'leaf', 'bloom', 'golden'];

interface Card {
  item: PlannedItem;
  concept: Concept;
  prompt: RecallPrompt;
  /** A missed card asked again at the end, with another prompt. */
  retry: boolean;
  /** Asked as a teach-back: explain it in your own words. */
  teach: boolean;
  /** What a teach-back is compared with. */
  points: string[];
  /** Asked as a contrast card: the linked concept to compare with. */
  contrast: Concept | null;
}

interface TeachResult {
  transcript: string | null;
  feedback: TeachBackFeedback | null;
  problem: string | null;
}

const VOICE_ANSWER_SECONDS = 60;
const AUTO_EASY_MS = 6000;
const AUTO_EASY_UNDO_MS = 3500;

interface PendingAutoEasy {
  payload: {
    session: ReviewSession;
    conceptId: string;
    promptId: string;
    answer: string | null;
    ms: number;
    aiVerdict?: AiVerdict | null;
  };
  timer: ReturnType<typeof setTimeout>;
}

/** Clarity bands in the verdict colours. */
const CLARITY_TONE: Record<Clarity, 'nailed' | 'close' | 'missed'> = {
  clear: 'nailed',
  partly: 'close',
  unclear: 'missed',
};

const CLARITY_VERDICT: Record<Clarity, AiVerdict> = {
  clear: 'nailed',
  partly: 'close',
  unclear: 'missed',
};

interface Feedback {
  verdict: 'nailed' | 'close' | 'missed' | null;
  missed: string[];
}

/**
 * The Daily Set (design §2): one card per screen, think, reveal, swipe.
 * Right is "got it", up is "shaky", left is "missed", and Easy is available
 * explicitly or auto-promoted on fast nailed answers with an undo toast.
 * A missed card comes back once at the end, asked another way.
 */
@Component({
  selector: 'lrn-today-screen',
  imports: [
    AhButton,
    ProgressDots,
    RouterLink,
    SetCompletion,
    StreakFlame,
    SwipeCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-screen.html',
  styleUrl: './today-screen.scss',
})
export class TodayScreen {
  protected readonly store = inject(LearningStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly recorder = inject(VoiceRecorder);
  protected readonly typeLabels = TYPE_LABELS;
  protected readonly clarityLabels = CLARITY_LABELS;
  protected readonly clarityTone = CLARITY_TONE;
  protected readonly teachSeconds = TEACH_BACK_SECONDS;
  /** A teach-back's recording, until it is checked. */
  protected readonly spoken = signal<RecordedAudio | null>(null);
  protected readonly teachResult = signal<TeachResult | null>(null);
  protected readonly transcribing = signal(false);
  protected readonly voiceProblem = signal<string | null>(null);
  protected readonly autoEasyTitle = signal<string | null>(null);

  protected readonly session = signal<ReviewSession | null>(null);
  protected readonly queue = signal<Card[]>([]);
  protected readonly done = signal(0);
  protected readonly revealed = signal(false);
  protected readonly answer = signal('');
  protected readonly picked = signal<string | null>(null);
  protected readonly checking = signal(false);
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly finished = signal(false);
  /** Tier changes this session, for the completion screen. */
  protected readonly grewTo = signal<{ title: string; tier: MasteryTier }[]>(
    [],
  );
  protected readonly busy = signal(false);

  protected readonly card = computed(() => this.queue()[0] ?? null);
  protected readonly total = computed(() => this.done() + this.queue().length);
  protected readonly tomorrow = computed(() => {
    const today = this.store.today();
    const next = new Date(`${today}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const localDate = next.toISOString().slice(0, 10);
    return composeDailySet({
      concepts: this.store.concepts(),
      memory: this.store.memory(),
      sessions: this.store.sessions(),
      events: this.store.events(),
      localDate,
      now: next,
      timeZone: this.store.timeZone(),
      cap: this.store.settings().dailyCap,
      newPerDay: this.store.settings().newPerDay,
    }).planned.length;
  });

  protected readonly tomorrowMinutes = computed(() =>
    this.tomorrow() ? Math.max(1, Math.round(this.tomorrow() * 0.4)) : 0,
  );

  private shownAt = Date.now();
  private retried = new Set<string>();
  private tiersBefore = new Map<string, MasteryTier>();
  private pendingEasy: PendingAutoEasy | null = null;

  constructor() {
    void this.start(() => this.store.startToday());
    inject(DestroyRef).onDestroy(() => {
      if (this.recorder.state() === 'recording') this.recorder.cancel();
      void this.flushPendingEasy();
    });
  }

  protected async startBonus(): Promise<void> {
    await this.flushPendingEasy();
    this.finished.set(false);
    await this.start(() => this.store.startBonus());
  }

  private async start(
    open: () => Promise<ReviewSession | null>,
  ): Promise<void> {
    await this.flushPendingEasy();
    this.busy.set(true);
    const session = await open();
    this.busy.set(false);
    this.session.set(session);
    this.retried = new Set();
    this.tiersBefore = new Map(
      [...this.store.memory()].map(([id, state]) => [id, tierOf(state)]),
    );
    if (!session) {
      this.finished.set(true);
      return;
    }
    const answered = new Set(
      this.store
        .events()
        .filter((event) => event.sessionId === session.id)
        .map((event) => event.conceptId),
    );
    const cards = session.planned
      .filter((item) => !answered.has(item.conceptId))
      .map((item) => this.cardFor(item, false))
      .filter((card): card is Card => card !== null);
    this.done.set(session.planned.length - cards.length);
    this.queue.set(cards);
    this.resetCard();
    if (!cards.length) await this.finish();
  }

  private cardFor(item: PlannedItem, retry: boolean): Card | null {
    const concept = this.store.concepts().find((c) => c.id === item.conceptId);
    const prompt = concept?.prompts.find((p) => p.id === item.promptId);
    if (!concept || !prompt || concept.deletedAt) return null;
    const other = item.contrastWith
      ? this.store
          .concepts()
          .find((c) => c.id === item.contrastWith && !c.deletedAt)
      : undefined;
    return {
      item,
      concept,
      prompt,
      retry,
      teach: !!item.teach && !retry,
      points: teachPoints(concept),
      contrast: !retry && other ? other : null,
    };
  }

  /** Records the explanation; it stops on its own after about a minute and a half. */
  protected async startTeach(): Promise<void> {
    const card = this.card();
    this.spoken.set(null);
    await this.recorder.start(TEACH_BACK_SECONDS);
    if (this.recorder.state() !== 'recording') return;
    const audio = await this.recorder.whenStopped();
    if (this.card() === card) this.spoken.set(audio);
  }

  protected stopTeach(): void {
    void this.recorder.stop();
  }

  /** Records a spoken answer on a regular review card and transcribes it into `answer`. */
  protected async startVoiceAnswer(): Promise<void> {
    const card = this.card();
    this.voiceProblem.set(null);
    await this.recorder.start(VOICE_ANSWER_SECONDS);
    if (this.recorder.state() !== 'recording') return;
    const audio = await this.recorder.whenStopped();
    if (!audio || this.card() !== card) return;
    await this.transcribeRecordedAnswer(card, audio);
  }

  protected stopVoiceAnswer(): void {
    void this.recorder.stop();
  }

  private async transcribeRecordedAnswer(
    card: Card,
    audio: RecordedAudio,
  ): Promise<string | null> {
    this.transcribing.set(true);
    const result = await this.store.transcribe(audio);
    if (this.card() !== card) return null;
    this.transcribing.set(false);
    if (result.text) {
      this.answer.set(result.text);
      this.voiceProblem.set(null);
      return result.text;
    }
    this.voiceProblem.set(result.problem);
    return null;
  }

  protected async revealTeach(card: Card): Promise<void> {
    if (this.recorder.state() === 'recording') {
      await this.recorder.stop();
      await this.recorder.whenStopped();
    }
    const text = this.answer().trim();
    const audio = this.spoken();
    this.revealed.set(true);
    if (!text && !audio) return;
    this.checking.set(true);
    const result = await this.store.teachBack({
      concept: card.concept,
      sessionId: this.session()?.id ?? null,
      ...(text ? { text } : audio ? { audio } : {}),
    });
    if (this.card() !== card) return;
    this.checking.set(false);
    this.teachResult.set(result);
  }

  protected async reveal(): Promise<void> {
    if (this.revealed()) return;
    const card = this.card();
    if (card?.teach) {
      await this.revealTeach(card);
      return;
    }
    if (card && this.recorder.state() === 'recording') {
      await this.recorder.stop();
      const audio = await this.recorder.whenStopped();
      if (audio && this.card() === card && !this.answer().trim()) {
        await this.transcribeRecordedAnswer(card, audio);
      }
    }
    if (this.card() !== card) return;
    this.revealed.set(true);
    const answer = this.answer().trim();
    // A comparison has no key points of its own to grade by.
    if (!card || !answer || card.contrast) return;
    if (card.prompt.type === 'quick_fire') return;
    this.checking.set(true);
    const grade = await this.store.grade(card.prompt, answer);
    // Ignore a late reply for a card that's gone.
    if (this.card() !== card) return;
    this.checking.set(false);
    if (grade?.verdict) this.feedback.set(grade);
  }

  /** Quick-fire: picking an option is the answer. */
  protected pick(option: string): void {
    if (this.revealed()) return;
    this.picked.set(option);
    const card = this.card();
    const right =
      !!card &&
      option.trim().toLowerCase() === card.prompt.answer.trim().toLowerCase();
    this.feedback.set({ verdict: right ? 'nailed' : 'missed', missed: [] });
    this.revealed.set(true);
  }

  protected grade(direction: SwipeDirection): Promise<void> {
    return this.submitRating(RATING_BY_SWIPE[direction]);
  }

  protected async submitRating(rating: ReviewEvent['rating']): Promise<void> {
    const card = this.card();
    const session = this.session();
    if (!card || !session || !this.revealed() || this.busy()) return;
    this.busy.set(true);
    await this.flushPendingEasy();

    const ms = Date.now() - this.shownAt;
    const textAnswer =
      this.picked() ??
      (this.teachResult()?.transcript || this.answer().trim() || null);
    const aiVerdict = this.verdictFor(card);
    const fastNailed =
      rating === 'good' &&
      !card.retry &&
      !card.teach &&
      aiVerdict === 'nailed' &&
      ms < AUTO_EASY_MS;

    const payload = {
      session,
      conceptId: card.concept.id,
      promptId: card.prompt.id,
      answer: textAnswer,
      ms,
      ...(aiVerdict ? { aiVerdict } : {}),
    };

    if (fastNailed) {
      const timer = setTimeout(() => {
        void this.flushPendingEasy();
      }, AUTO_EASY_UNDO_MS);
      this.pendingEasy = { payload, timer };
      this.autoEasyTitle.set(card.concept.title);
    } else {
      await this.store.recordAnswer({ ...payload, rating });
    }

    const rest = this.queue().slice(1);
    // A miss comes back once, at the end, asked another way.
    if (
      rating === 'again' &&
      !card.retry &&
      !this.retried.has(card.concept.id)
    ) {
      this.retried.add(card.concept.id);
      const state = this.store.memory().get(card.concept.id);
      const other = choosePrompt(card.concept, state, true) ?? card.prompt;
      rest.push({
        item: { conceptId: card.concept.id, promptId: other.id },
        concept: card.concept,
        prompt: other,
        retry: true,
        teach: false,
        points: card.points,
        contrast: null,
      });
    }
    if (!card.retry) this.done.update((n) => n + 1);
    this.queue.set(rest);
    this.resetCard();
    this.busy.set(false);
    if (!rest.length) await this.finish();
  }

  protected async undoAutoEasy(): Promise<void> {
    const pending = this.pendingEasy;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingEasy = null;
    this.autoEasyTitle.set(null);
    await this.store.recordAnswer({ ...pending.payload, rating: 'good' });
  }

  private async flushPendingEasy(): Promise<void> {
    const pending = this.pendingEasy;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingEasy = null;
    this.autoEasyTitle.set(null);
    await this.store.recordAnswer({ ...pending.payload, rating: 'easy' });
  }

  private verdictFor(card: Card): AiVerdict | null {
    const direct = this.feedback()?.verdict;
    if (direct) return direct;
    const clarity = card.teach ? this.teachResult()?.feedback?.clarity : null;
    return clarity ? CLARITY_VERDICT[clarity] : null;
  }

  protected async close(): Promise<void> {
    await this.flushPendingEasy();
    void this.router.navigate(['../inbox'], { relativeTo: this.route });
  }

  private async finish(): Promise<void> {
    await this.flushPendingEasy();
    const session = this.session();
    if (session && !session.completedAt) {
      await this.store.completeSession(session);
    }
    const after = memoryOf(this.store.concepts(), this.store.events());
    const grew: { title: string; tier: MasteryTier }[] = [];
    for (const item of session?.planned ?? []) {
      const state = after.get(item.conceptId);
      if (!state) continue;
      const before = this.tiersBefore.get(item.conceptId) ?? 'seed';
      const now = tierOf(state);
      if (TIER_ORDER.indexOf(now) > TIER_ORDER.indexOf(before)) {
        const title = this.store
          .concepts()
          .find((c) => c.id === item.conceptId)?.title;
        if (title) grew.push({ title, tier: now });
      }
    }
    this.grewTo.set(grew);
    this.finished.set(true);
    if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const { default: confetti } = await import('canvas-confetti');
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    }
  }

  private resetCard(): void {
    this.revealed.set(false);
    this.answer.set('');
    this.picked.set(null);
    this.feedback.set(null);
    this.checking.set(false);
    this.spoken.set(null);
    this.teachResult.set(null);
    this.transcribing.set(false);
    this.voiceProblem.set(null);
    this.shownAt = Date.now();
  }

  protected strongCount(): number {
    return [...this.store.memory().values()].filter((state) =>
      ['leaf', 'bloom', 'golden'].includes(tierOf(state)),
    ).length;
  }
}
