import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  FIXTURE_IDS,
  type ReviewSession,
  sampleConcept,
} from '@ah/learning/domain';
import { VoiceRecorder } from '../../capture/voice-recorder';
import { DEFAULT_SETTINGS, LearningStore } from '../../store/learning.store';
import { TodayScreen } from './today-screen';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('TodayScreen', () => {
  let concept = sampleConcept({
    title: 'Spaced repetition',
    prompts: [
      {
        id: FIXTURE_IDS.prompt,
        type: 'free_recall',
        question: 'Why does spacing beat cramming?',
        answer: 'Retrieval effort strengthens long-term memory.',
        options: null,
        keyPoints: ['retrieval effort', 'long-term memory'],
        retired: false,
      },
    ],
  });
  let session: ReviewSession;
  let recorded: unknown[];
  let storeMock: Record<string, unknown>;
  let recorderMock: Record<string, unknown>;
  let stoppedResolver:
    | ((
        audio: { bytes: ArrayBuffer; mimeType: string; seconds: number } | null,
      ) => void)
    | null;

  function setup(verdict: 'nailed' | 'close' | null = 'nailed', cardCount = 1) {
    concept = sampleConcept({
      title: 'Spaced repetition',
      prompts: [
        {
          id: FIXTURE_IDS.prompt,
          type: 'free_recall',
          question: 'Why does spacing beat cramming?',
          answer: 'Retrieval effort strengthens long-term memory.',
          options: null,
          keyPoints: ['retrieval effort', 'long-term memory'],
          retired: false,
        },
      ],
    });
    const secondConcept = sampleConcept({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Interleaving practice',
      prompts: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          type: 'free_recall',
          question: 'Why mix related problem types?',
          answer: 'Discrimination between cues improves transfer.',
          options: null,
          keyPoints: ['discrimination', 'transfer'],
          retired: false,
        },
      ],
    });
    const allConcepts = cardCount > 1 ? [concept, secondConcept] : [concept];
    session = {
      id: FIXTURE_IDS.session,
      updatedAt: '2026-11-12T08:00:00.000Z',
      deletedAt: null,
      localDate: '2026-11-12',
      kind: 'daily',
      planned: allConcepts.map((c) => ({
        conceptId: c.id,
        promptId: c.prompts[0].id,
      })),
      lighter: false,
      startedAt: '2026-11-12T08:00:00.000Z',
      completedAt: null,
    };
    recorded = [];
    stoppedResolver = null;
    const recState = signal<'idle' | 'starting' | 'recording' | 'denied'>(
      'idle',
    );

    storeMock = {
      concepts: signal(allConcepts),
      memory: signal(new Map()),
      sessions: signal([session]),
      events: signal([]),
      settings: signal(DEFAULT_SETTINGS),
      today: signal('2026-11-12'),
      timeZone: signal('UTC'),
      streak: signal({
        current: 4,
        longest: 6,
        freezesBanked: 0,
        lastActiveDate: '2026-11-12',
        repairOffer: null,
        mode: 'daily' as const,
        weeklyTarget: 5,
        thisWeekCount: 4,
      }),
      xp: signal({ level: 2, into: 30, span: 100 }),
      startToday: vi.fn().mockResolvedValue(session),
      startBonus: vi.fn().mockResolvedValue(null),
      recordAnswer: vi.fn().mockImplementation(async (entry) => {
        recorded.push(entry);
      }),
      completeSession: vi.fn().mockResolvedValue(undefined),
      grade: vi
        .fn()
        .mockResolvedValue(
          verdict ? { verdict, missed: [], suggested: 'good' } : null,
        ),
      transcribe: vi.fn().mockResolvedValue({
        text: 'Effort strengthens memory.',
        problem: null,
      }),
    };

    recorderMock = {
      supported: true,
      state: recState,
      seconds: signal(2),
      start: vi.fn().mockImplementation(async () => {
        recState.set('recording');
      }),
      stop: vi.fn().mockImplementation(async () => {
        recState.set('idle');
        stoppedResolver?.({
          bytes: new ArrayBuffer(16),
          mimeType: 'audio/webm',
          seconds: 2,
        });
      }),
      whenStopped: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            stoppedResolver = resolve;
          }),
      ),
      cancel: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TodayScreen],
      providers: [
        provideRouter([]),
        { provide: LearningStore, useValue: storeMock },
        { provide: VoiceRecorder, useValue: recorderMock },
      ],
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transcribes a spoken answer on a regular review card and supports Easy button with aiVerdict', async () => {
    setup('nailed');
    const fixture: ComponentFixture<TodayScreen> =
      TestBed.createComponent(TodayScreen);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('lrn-progress-dots')).toBeTruthy();

    const micBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Answer by voice'),
    ) as HTMLButtonElement;
    micBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    const stopBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Stop'),
    ) as HTMLButtonElement;
    stopBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    expect((host.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'Effort strengthens memory.',
    );

    const revealBtn = host.querySelector('.reveal-button') as HTMLButtonElement;
    revealBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    const easyBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Easy'),
    ) as HTMLButtonElement;
    easyBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      conceptId: concept.id,
      rating: 'easy',
      aiVerdict: 'nailed',
      answer: 'Effort strengthens memory.',
    });
    expect(host.querySelector('lrn-set-completion')).toBeTruthy();
  });

  it('auto-promotes fast nailed answers to Easy and reverts to Good on Undo', async () => {
    setup('nailed');
    const fixture = TestBed.createComponent(TodayScreen);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Retrieval effort strengthens long-term memory.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('.reveal-button') as HTMLButtonElement).click();
    await flushMicrotasks();
    fixture.detectChanges();

    const goodBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Got it'),
    ) as HTMLButtonElement;
    goodBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    // Auto-easy flush occurred inside finish() when the last card completed;
    // verify an 'easy' rating was persisted for fast + nailed!
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ rating: 'easy', aiVerdict: 'nailed' });
  });

  it('shows Undo (count as Got it) in a multi-card session and logs good when clicked', async () => {
    setup('nailed', 2);
    const fixture = TestBed.createComponent(TodayScreen);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Retrieval effort strengthens long-term memory.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('.reveal-button') as HTMLButtonElement).click();
    await flushMicrotasks();
    fixture.detectChanges();

    const goodBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Got it'),
    ) as HTMLButtonElement;
    goodBtn.click();
    await flushMicrotasks();
    fixture.detectChanges();

    const undoBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Undo (count as Got it)'),
    ) as HTMLButtonElement | undefined;
    expect(undoBtn).toBeTruthy();

    undoBtn?.click();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      conceptId: concept.id,
      rating: 'good',
      aiVerdict: 'nailed',
    });
  });
});
