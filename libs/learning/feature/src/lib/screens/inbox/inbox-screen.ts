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
import type { Capture, Concept } from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import { VoiceRecorder } from '../../capture/voice-recorder';
import { LearningStore } from '../../store/learning.store';
import { SwipeCard, type SwipeDirection } from '../../ui/swipe-card';

/** Holding the mic longer than this means "record while held". */
const HOLD_MS = 350;

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

  private pressedAt = 0;
  private readonly textBox =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('textBox');

  constructor() {
    // The home-screen shortcut "Capture an idea" opens /inbox?capture=1.
    const capture =
      inject(ActivatedRoute).snapshot.queryParamMap.get('capture');
    afterNextRender(() => {
      if (capture) this.textBox().nativeElement.focus();
    });
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
