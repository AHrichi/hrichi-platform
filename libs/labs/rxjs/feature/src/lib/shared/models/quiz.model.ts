// src/app/shared/models/quiz.model.ts
export type QuestionType =
  'multiple-choice' | 'fill-in-the-blank' | 'code-completion';
export type Difficulty = 'Beginner' | 'Mid-level' | 'Senior';

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  difficulty: Difficulty;
  text: string;
  options?: string[]; // For multiple-choice
  answer: string | string[];
  relatedRoute: string; // Route to the relevant exercise
  codeSnippet?: string; // For code-completion
}
