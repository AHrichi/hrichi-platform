import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { StudyLmStore } from '../../store/studylm.store';

@Component({
  selector: 'ah-audio-overview',
  imports: [],
  templateUrl: './audio-overview.component.html',
  styleUrl: './audio-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioOverviewComponent implements OnDestroy {
  readonly store = inject(StudyLmStore);

  readonly isPlaying = signal(false);
  readonly currentTurnIndex = signal(0);

  private speechSynth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  togglePlayback() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(turnIndex = this.currentTurnIndex()) {
    const turns = this.store.overview()?.audioOverviewScript ?? [];
    if (turns.length === 0) return;

    this.isPlaying.set(true);
    this.currentTurnIndex.set(turnIndex);

    if (this.speechSynth) {
      this.speechSynth.cancel();
      this.speakTurn(turnIndex);
    }
  }

  pause() {
    this.isPlaying.set(false);
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  }

  jumpToTurn(index: number) {
    this.play(index);
  }

  private speakTurn(index: number) {
    const turns = this.store.overview()?.audioOverviewScript ?? [];
    if (index >= turns.length || !this.isPlaying()) {
      this.isPlaying.set(false);
      this.currentTurnIndex.set(0);
      return;
    }

    this.currentTurnIndex.set(index);
    const turn = turns[index];

    if (!this.speechSynth) return;

    const utterance = new SpeechSynthesisUtterance(turn.text);
    // Alternate pitch/rate slightly for Host A vs Host B
    if (turn.speaker.includes('Host') || turn.speaker.includes('Sarah')) {
      utterance.pitch = 1.1;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    }

    utterance.onend = () => {
      if (this.isPlaying()) {
        this.speakTurn(index + 1);
      }
    };

    utterance.onerror = () => {
      this.isPlaying.set(false);
    };

    this.speechSynth.speak(utterance);
  }

  ngOnDestroy() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  }
}
