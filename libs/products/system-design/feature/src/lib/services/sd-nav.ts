import { inject, Injectable } from '@angular/core';
import {
  type ActivatedRoute,
  type NavigationExtras,
  Router,
} from '@angular/router';

/**
 * Navigates relative to the System Design shell route (technical-design §5).
 * Works identically when mounted at `/apps/system-design` inside the portfolio
 * and at `/` standalone.
 */
@Injectable({ providedIn: 'root' })
export class SdNav {
  private readonly router = inject(Router);
  private shellRoute: ActivatedRoute | null = null;

  /** Called by `SystemDesignShell` on creation to anchor relative navigation. */
  attach(route: ActivatedRoute): void {
    this.shellRoute = route;
  }

  go(
    commands: readonly (string | number)[],
    extras?: NavigationExtras,
  ): Promise<boolean> {
    const relativeTo = this.shellRoute ?? this.router.routerState.root;
    return this.router.navigate([...commands], {
      relativeTo,
      ...extras,
    });
  }

  goToLearnRoot(replaceUrl = false): Promise<boolean> {
    return this.go(['learn'], { replaceUrl });
  }

  /** `stepNumber` is 1-based (`learn/:lessonId/:step`). */
  goToLesson(
    lessonId: string,
    stepNumber = 1,
    replaceUrl = false,
  ): Promise<boolean> {
    return this.go(['learn', lessonId, Math.max(1, stepNumber)], {
      replaceUrl,
    });
  }

  goToPractice(lessonId?: string): Promise<boolean> {
    return lessonId ? this.go(['practice', lessonId]) : this.go(['practice']);
  }

  goToLab(challengeId?: string): Promise<boolean> {
    return challengeId ? this.go(['lab', challengeId]) : this.go(['lab']);
  }

  goToCheatsheet(moduleId?: string): Promise<boolean> {
    return moduleId
      ? this.go(['cheatsheets', moduleId])
      : this.go(['cheatsheets']);
  }

  goToGuide(): Promise<boolean> {
    return this.go(['guide']);
  }
}
