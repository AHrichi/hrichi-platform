import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { type CaptureItem, decodeHandoff } from '@ah/learning/contracts';
import { type Capture, type Concept, describeLink } from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import { VoiceRecorder } from '../../capture/voice-recorder';
import { LearningStore } from '../../store/learning.store';
import { SwipeCard, type SwipeDirection } from '@ah/learning/ui';

/** Holding the mic longer than this means "record while held". */
const HOLD_MS = 350;

/** Friendly names for apps that send ideas. */
const APP_NAMES: Record<string, string> = { studylm: 'StudyLM' };

const STATUS_LABELS: Record<Capture['status'], string> = {
  queued: 'Waiting for the AI',
  processing: 'The AI is reading it…',
  ready: 'Ready',
  needs_look: 'Needs a quick look',
  failed: 'The AI couldn’t process it',
};

/**
 * Capture in seconds, then keep or discard what the AI made of it (design
 * §1): the capture bar, the digest of draft concepts as a swipeable card,
 * and the captures still on their way.
 */
@Component({
  selector: 'lrn-inbox-screen',
  imports: [AhButton, SwipeCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox-screen.html',
  styleUrl: './inbox-screen.scss',
})
export class InboxScreen {
  protected readonly store = inject(LearningStore);
  protected readonly recorder = inject(VoiceRecorder);
  protected readonly text = signal('');
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly describe = describeLink;
  protected readonly micMessage = signal<string | null>(null);

  /** The draft on top of the digest. */
  protected readonly top = computed<Concept | null>(
    () => this.store.drafts()[0] ?? null,
  );
  protected readonly sample = computed(
    () => this.top()?.prompts.find((prompt) => !prompt.retired) ?? null,
  );
  protected readonly revising = computed(() => {
    const top = this.top();
    return !!top && this.store.revising().includes(top.id);
  });

  /** Ideas waiting for a yes: from another app or the share sheet. */
  protected readonly incoming = signal<{
    items: CaptureItem[];
    from: string;
    modality: 'host' | 'share';
  } | null>(null);

  private pressedAt = 0;
  private readonly textBox =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('textBox');

  constructor() {
    // The home-screen shortcut "Capture an idea" opens /inbox?capture=1.
    const query = inject(ActivatedRoute).snapshot.queryParamMap;
    const capture = query.get('capture');
    this.readIncoming(query);
    afterNextRender(() => {
      if (capture) this.textBox().nativeElement.focus();
    });
  }

  /**
   * A hand-off (`#capture=…`, from LearningClient) or a share (`?text=…`
   * from the share sheet). Nothing is saved until the learner says so: the
   * link could have come from any page. The address is cleaned at once.
   */
  private readIncoming(query: { get(name: string): string | null }): void {
    const location = globalThis.location;
    if (!location) return;
    const handoff = decodeHandoff(location.hash);
    if (handoff) {
      const apps = [
        ...new Set(handoff.map((item) => item.source?.app).filter(Boolean)),
      ];
      this.incoming.set({
        items: handoff,
        from:
          apps.length === 1
            ? (APP_NAMES[apps[0] as string] ?? (apps[0] as string))
            : 'another app',
        modality: 'host',
      });
    } else {
      const shared = [query.get('title'), query.get('text'), query.get('url')]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join('\n');
      const url = query.get('url');
      if (shared) {
        this.incoming.set({
          items: [
            {
              text: shared.slice(0, 4000),
              source:
                url && /^https?:\/\//.test(url)
                  ? {
                      app: 'share',
                      objectType: 'link',
                      objectId: url.slice(0, 120),
                      deepLink: url,
                      excerpt: null,
                    }
                  : null,
            },
          ],
          from: 'the share sheet',
          modality: 'share',
        });
      }
    }
    if (this.incoming()) {
      globalThis.history?.replaceState(history.state, '', location.pathname);
    }
  }

  protected async acceptIncoming(): Promise<void> {
    const incoming = this.incoming();
    if (!incoming) return;
    this.incoming.set(null);
    await this.store.captureItems(incoming.items, incoming.modality);
  }

  protected dismissIncoming(): void {
    this.incoming.set(null);
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    const text = this.text().trim();
    if (!text) return;
    this.text.set('');
    await this.store.capture(text);
  }

  /** Ctrl/⌘ + Enter saves from the text box. */
  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      void this.save(event);
    }
  }

  /** Tap to start and tap again to save, or hold to record and release to save. */
  protected async micDown(event: PointerEvent): Promise<void> {
    if (event.button !== 0) return;
    this.micMessage.set(null);
    if (this.recorder.state() === 'recording') return;
    this.pressedAt = Date.now();
    await this.recorder.start();
    this.explainMic();
  }

  protected async micUp(): Promise<void> {
    if (this.recorder.state() !== 'recording') return;
    const held = Date.now() - this.pressedAt > HOLD_MS;
    if (held || this.pressedAt === 0) await this.finishRecording();
    this.pressedAt = 0;
  }

  /** Keyboard and screen readers: a plain toggle. */
  protected async micToggle(event: Event): Promise<void> {
    if ((event as PointerEvent).pointerType) return; // handled by down/up
    if (this.recorder.state() === 'recording') {
      await this.finishRecording();
    } else {
      this.micMessage.set(null);
      await this.recorder.start();
      this.explainMic();
    }
  }

  protected cancelRecording(): void {
    this.recorder.cancel();
  }

  protected decide(concept: Concept, direction: SwipeDirection): void {
    void (direction === 'right'
      ? this.store.keep(concept.id)
      : this.store.discard(concept.id));
  }

  private async finishRecording(): Promise<void> {
    const audio = await this.recorder.stop();
    if (audio) {
      await this.store.captureVoice(audio);
    } else {
      this.micMessage.set('That was too short to keep.');
    }
  }

  private explainMic(): void {
    const state = this.recorder.state();
    if (state === 'denied') {
      this.micMessage.set(
        'The microphone is blocked. Allow it for this site to capture by voice.',
      );
    } else if (state === 'unsupported') {
      this.micMessage.set('This browser can’t record audio. Type instead.');
    }
  }
}
