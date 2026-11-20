import type { Routes } from '@angular/router';
import { GuideScreen } from './screens/guide/guide-screen';
import { LessonScreen } from './screens/lesson/lesson-screen';
import {
  CheatsheetsPlaceholderScreen,
  LabPlaceholderScreen,
  PracticePlaceholderScreen,
} from './screens/placeholders';
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
        component: PracticePlaceholderScreen,
        title: 'Practice · System Design',
      },
      {
        path: 'practice/mix',
        component: PracticePlaceholderScreen,
        title: 'Mixed Practice · System Design',
      },
      {
        path: 'practice/:lessonId',
        component: PracticePlaceholderScreen,
        title: 'Practice · System Design',
      },
      {
        path: 'lab',
        component: LabPlaceholderScreen,
        title: 'Design Lab · System Design',
      },
      {
        path: 'lab/:challengeId',
        component: LabPlaceholderScreen,
        title: 'Design Lab · System Design',
      },
      {
        path: 'cheatsheets',
        component: CheatsheetsPlaceholderScreen,
        title: 'Cheatsheets · System Design',
      },
      {
        path: 'cheatsheets/:module',
        component: CheatsheetsPlaceholderScreen,
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
