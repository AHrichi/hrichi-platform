import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Each screen has its own URL under the app (`/apps/studylm/<screen>`). */
export type StudyLmScreen =
  'roadmap' | 'learn' | 'flashcards' | 'quiz' | 'sources' | 'stats';

export interface StudyLmScreenInfo {
  readonly id: StudyLmScreen;
  readonly label: string;
  readonly icon: string;
}

export const SCREENS: readonly StudyLmScreenInfo[] = [
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { id: 'learn', label: 'Lessons', icon: '🧭' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'quiz', label: 'Quiz', icon: '🎯' },
  { id: 'sources', label: 'Reference docs', icon: '📚' },
  { id: 'stats', label: 'Progress', icon: '📊' },
];

/**
 * Moves between screens from anywhere inside the app. Provided by the
 * shell, so it navigates relative to the shell's route, whether StudyLM runs
 * standalone at `/` or in the portfolio at `/apps/studylm`.
 */
@Injectable()
export class StudyLmScreens {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  go(screen: StudyLmScreen, ...rest: string[]): Promise<boolean> {
    return this.router.navigate([screen, ...rest], { relativeTo: this.route });
  }
}
