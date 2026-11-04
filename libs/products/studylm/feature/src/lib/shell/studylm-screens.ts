import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, type NavigationExtras, Router } from '@angular/router';

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

export interface StudyLmNavigationOptions {
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  fragment?: string;
}

/**
 * Moves between screens from anywhere inside the app. Provided by the
 * shell, so it navigates relative to the shell's route, whether StudyLM runs
 * standalone at `/` or in the portfolio at `/apps/studylm`.
 */
@Injectable()
export class StudyLmScreens {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  go(
    screen: StudyLmScreen,
    ...args: (string | StudyLmNavigationOptions)[]
  ): Promise<boolean> {
    const segments: string[] = [screen];
    let extras: NavigationExtras = { relativeTo: this.route };

    for (const arg of args) {
      if (typeof arg === 'string') {
        segments.push(arg);
      } else if (arg && typeof arg === 'object') {
        extras = {
          ...extras,
          queryParams: arg.queryParams,
          fragment: arg.fragment,
        };
      }
    }

    return this.router.navigate(segments, extras);
  }

  goToSectionRoadmap(sectionId: string): Promise<boolean> {
    return this.go('roadmap', { queryParams: { section: sectionId } });
  }

  goToSectionFlashcards(sectionId: string): Promise<boolean> {
    return this.go('flashcards', { queryParams: { section: sectionId } });
  }

  goToSectionQuiz(sectionId: string): Promise<boolean> {
    return this.go('quiz', { queryParams: { section: sectionId } });
  }

  goToLesson(lessonId: string): Promise<boolean> {
    return this.go('learn', lessonId);
  }
}
