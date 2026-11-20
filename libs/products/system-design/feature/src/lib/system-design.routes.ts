import type { Routes } from '@angular/router';
import { GuideScreen } from './screens/guide/guide-screen';
import { LabHome } from './screens/lab/lab-home';
import { LabScreen } from './screens/lab/lab-screen';
import { LessonScreen } from './screens/lesson/lesson-screen';
import { CheatsheetIndex } from './screens/cheatsheets/cheatsheet-index';
import { CheatsheetScreen } from './screens/cheatsheets/cheatsheet-screen';
import {
  LessonPractice,
  MixedPractice,
  PracticeHome,
} from './screens/practice/practice-screens';
import { SystemDesignShell } from './shell/system-design-shell';

/**
 * Mounted under `/apps/system-design` in the portfolio and at `/` standalone
 * (technical-design §5). All paths are relative to the remote root.
 */
export const SYSTEM_DESIGN_ROUTES: Routes = [
  {
    path: '',
    component: SystemDesignShell,
    title: 'System Design',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'learn' },
      {
        path: 'learn',
        component: LessonScreen,
        title: 'Learn · System Design',
      },
      {
        path: 'learn/:lessonId',
        component: LessonScreen,
        title: 'Learn · System Design',
      },
      {
        path: 'learn/:lessonId/:step',
        component: LessonScreen,
        title: 'Learn · System Design',
      },
      {
        path: 'practice',
        component: PracticeHome,
        title: 'Practice · System Design',
      },
      {
        path: 'practice/mix',
        component: MixedPractice,
        title: 'Mixed Practice · System Design',
      },
      {
        path: 'practice/:lessonId',
        component: LessonPractice,
        title: 'Practice · System Design',
      },
      {
        path: 'lab',
        component: LabHome,
        title: 'Design Lab · System Design',
      },
      {
        path: 'lab/:challengeId',
        component: LabScreen,
        title: 'Design Lab · System Design',
      },
      {
        path: 'cheatsheets',
        component: CheatsheetIndex,
        title: 'Cheatsheets · System Design',
      },
      {
        path: 'cheatsheets/:module',
        component: CheatsheetScreen,
        title: 'Cheatsheets · System Design',
      },
      {
        path: 'guide',
        component: GuideScreen,
        title: 'Guide · System Design',
      },
      { path: '**', redirectTo: 'learn' },
    ],
  },
];
