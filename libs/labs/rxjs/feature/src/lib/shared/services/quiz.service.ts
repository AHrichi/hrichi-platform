// src/app/shared/services/quiz.service.ts
import { Injectable } from '@angular/core';
import { QuizQuestion, Difficulty } from '../models/quiz.model';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private allQuestions: QuizQuestion[] = [
    // --- Beginner Questions ---
    {
      id: 1,
      type: 'multiple-choice',
      difficulty: 'Beginner',
      text: 'Which operator is used to handle errors in a stream and provide a fallback value?',
      options: ['retry', 'throwError', 'catchError', 'finalize'],
      answer: 'catchError',
      relatedRoute: '/error-handling',
    },
    {
      id: 2,
      type: 'fill-in-the-blank',
      difficulty: 'Beginner',
      text: 'A "cold" observable starts producing values only when a ____ subscribes to it.',
      answer: 'subscriber',
      relatedRoute: '/multicasting',
    },
    {
      id: 7,
      type: 'multiple-choice',
      difficulty: 'Beginner',
      text: 'Which function is used to pass data from a parent component to a child component?',
      options: ['output()', 'input()', 'signal()', 'effect()'],
      answer: 'input()',
      relatedRoute: '/sharing-data',
    },
    {
      id: 10,
      type: 'multiple-choice',
      difficulty: 'Beginner',
      text: 'What does the `$` suffix traditionally signify on a variable name in RxJS?',
      options: [
        'A Subject',
        'A final value',
        'An Observable',
        'A private property',
      ],
      answer: 'An Observable',
      relatedRoute: '/multicasting',
    },
    {
      id: 11,
      type: 'fill-in-the-blank',
      difficulty: 'Beginner',
      text: 'In Angular, the ____ function is used to create a derived value from one or more signals.',
      answer: 'computed',
      relatedRoute: '/signals',
    },

    // --- Mid-level Questions ---
    {
      id: 3,
      type: 'multiple-choice',
      difficulty: 'Mid-level',
      text: 'For a live search input, which higher-order mapping operator is best to prevent unnecessary network requests?',
      options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
      answer: 'switchMap',
      relatedRoute: '/transforming-streams',
    },
    {
      id: 4,
      type: 'code-completion',
      difficulty: 'Mid-level',
      text: 'Complete the code to run both API calls in parallel and get the results only when both are complete.',
      codeSnippet: `
const user$ = this.http.get('/api/user');
const permissions$ = this.http.get('/api/permissions');

____([user$, permissions$]).subscribe(([user, permissions]) => {
  // ...
});`,
      answer: 'forkJoin',
      relatedRoute: '/bulk-operations',
    },
    {
      id: 8,
      type: 'multiple-choice',
      difficulty: 'Mid-level',
      text: 'Which operator is ideal for caching and sharing the result of an HTTP request?',
      options: ['share', 'cache', 'shareReplay', 'multicast'],
      answer: 'shareReplay',
      relatedRoute: '/reactive-caching',
    },
    {
      id: 12,
      type: 'multiple-choice',
      difficulty: 'Mid-level',
      text: "Which Subject is best for storing a user's authentication status that new components can check upon creation?",
      options: ['Subject', 'AsyncSubject', 'BehaviorSubject', 'ReplaySubject'],
      answer: 'BehaviorSubject',
      relatedRoute: '/multicasting',
    },
    {
      id: 13,
      type: 'code-completion',
      difficulty: 'Mid-level',
      text: 'Fill in the blank to batch incoming data into arrays of 4.',
      codeSnippet: `
source$.pipe(
  ____(4)
).subscribe(batch => console.log(batch));`,
      answer: 'bufferCount',
      relatedRoute: '/bulk-operations',
    },

    // --- Senior Questions ---
    {
      id: 5,
      type: 'multiple-choice',
      difficulty: 'Senior',
      text: 'Which Subject type will give a new subscriber the last 3 emitted values?',
      options: [
        'Subject',
        'AsyncSubject',
        'BehaviorSubject(3)',
        'ReplaySubject(3)',
      ],
      answer: 'ReplaySubject(3)',
      relatedRoute: '/multicasting',
    },
    {
      id: 6,
      type: 'fill-in-the-blank',
      difficulty: 'Senior',
      text: 'To convert a "cold" observable into a "hot" one that starts emitting on the first subscription and shares its values, you can use the ____ operator.',
      answer: 'share()',
      relatedRoute: '/multicasting',
    },
    {
      id: 9,
      type: 'code-completion',
      difficulty: 'Senior',
      text: 'Fill in the blank to ensure the login request is ignored if one is already in progress.',
      codeSnippet: `
loginClick$.pipe(
  ____(() => this.authService.login(credentials))
).subscribe();`,
      answer: 'exhaustMap',
      relatedRoute: '/transforming-streams',
    },
    {
      id: 14,
      type: 'multiple-choice',
      difficulty: 'Senior',
      text: 'In RxJS marble testing, what does the character `|` signify?',
      options: [
        'An error',
        'A value emission',
        'Completion of the stream',
        'A subscription point',
      ],
      answer: 'Completion of the stream',
      relatedRoute: '/multicasting', // No specific testing page, linking to a related concept
    },
    {
      id: 15,
      type: 'code-completion',
      difficulty: 'Senior',
      text: 'Complete the code to convert an observable to a signal, providing a default value until the observable emits.',
      codeSnippet: `
const data$ = this.dataService.getData();
const data = toSignal(data$, { ____: 'Loading...' });`,
      answer: 'initialValue',
      relatedRoute: '/signals',
    },
    {
      id: 16,
      type: 'multiple-choice',
      difficulty: 'Mid-level',
      text: 'In Angular 22, which signal primitive creates a writable signal that resets to a computed default when its source changes?',
      options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
      answer: 'linkedSignal()',
      relatedRoute: '/signals',
    },
    {
      id: 17,
      type: 'multiple-choice',
      difficulty: 'Senior',
      text: 'In Angular 22, which function from @angular/core/rxjs-interop loads asynchronous data from an RxJS stream into declarative signals with automatic loading and reload capabilities?',
      options: [
        'toSignal()',
        'rxResource()',
        'toObservable()',
        'outputFromObservable()',
      ],
      answer: 'rxResource()',
      relatedRoute: '/signals',
    },
  ];

  getQuestionsByDifficulty(difficulty: Difficulty): QuizQuestion[] {
    return this.allQuestions.filter((q) => q.difficulty === difficulty);
  }
}
