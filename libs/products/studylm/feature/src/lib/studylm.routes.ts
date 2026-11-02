import { Routes } from '@angular/router';
import { StudyLmShellComponent } from './components/studylm-shell/studylm-shell.component';

/** Each screen is its own lazy chunk with its own URL, like Basecamp's. */
export const studyLmRoutes: Routes = [
  {
    path: '',
    component: StudyLmShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'roadmap' },
      {
        path: 'roadmap',
        title: 'Roadmap · StudyLM',
        loadComponent: () =>
          import('./components/roadmap-explorer/roadmap-explorer.component').then(
            (m) => m.RoadmapExplorerComponent,
          ),
      },
      {
        path: 'flashcards',
        title: 'Flashcards · StudyLM',
        loadComponent: () =>
          import('./components/flashcard-deck/flashcard-deck.component').then(
            (m) => m.FlashcardDeckComponent,
          ),
      },
      {
        path: 'quiz',
        title: 'Quiz · StudyLM',
        loadComponent: () =>
          import('./components/quiz-arena/quiz-arena.component').then(
            (m) => m.QuizArenaComponent,
          ),
      },
      {
        path: 'sources',
        title: 'Reference docs · StudyLM',
        loadComponent: () =>
          import('./components/source-manager/source-manager.component').then(
            (m) => m.SourceManagerComponent,
          ),
      },
      {
        path: 'stats',
        title: 'Progress · StudyLM',
        loadComponent: () =>
          import('./components/study-stats/study-stats.component').then(
            (m) => m.StudyStatsComponent,
          ),
      },
      { path: '**', redirectTo: 'roadmap' },
    ],
  },
];
