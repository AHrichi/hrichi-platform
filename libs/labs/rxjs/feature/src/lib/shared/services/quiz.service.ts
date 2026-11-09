import { Injectable } from '@angular/core';
import type { SiteLanguage } from '@ah/shared/state';
import { QuizQuestion, Difficulty } from '../models/quiz.model';
import { getRxjsLabCopy } from '../../i18n/rxjs-lab-copy';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  getQuestionsByDifficulty(
    difficulty: Difficulty,
    lang: SiteLanguage = 'en',
  ): QuizQuestion[] {
    return getRxjsLabCopy(lang).quiz.questions.filter(
      (q) => q.difficulty === difficulty,
    );
  }
}
