import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { AhAlert, AhButton, AhModal } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import type { StudyLmJsonImport } from '@ah/products/studylm/domain';

interface JsonImportFormModel {
  jsonText: string;
}

const SAMPLE_SCHEMA = `{
  "subject": "Modern Angular Architecture",
  "domain": "frontend-web",
  "flashcards": [
    {
      "tier": "beginner",
      "front": "What is zoneless change detection in Angular?",
      "back": "A runtime model where Angular relies on signals and component notifications rather than monkey-patching async APIs with Zone.js.",
      "codeSnippet": "bootstrapApplication(AppComponent, {\\n  providers: [provideZonelessChangeDetection()]\\n});",
      "codeLanguage": "typescript",
      "category": "Change Detection",
      "sourceCitation": "Angular.dev Docs"
    }
  ],
  "quiz": [
    {
      "tier": "intermediate",
      "question": "Which signal function creates a memoized derived value in Angular?",
      "options": ["computed()", "effect()", "signal()", "untracked()"],
      "correctIndex": 0,
      "explanation": "computed() declares a memoized, reactive derived state that only re-evaluates when tracked dependencies change.",
      "sourceCitation": "Angular Signals Reference"
    }
  ]
}`;

@Component({
  selector: 'ah-json-import-modal',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, AhModal, AhButton, AhAlert],
  templateUrl: './json-import-modal.component.html',
  styleUrl: './json-import-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonImportModalComponent {
  readonly store = inject(StudyLmStore);
  readonly sampleSchema = SAMPLE_SCHEMA;

  readonly model = signal<JsonImportFormModel>({
    jsonText: '',
  });

  readonly errorStatus = signal<string | null>(null);

  readonly importForm = form(this.model, (path) => {
    required(path.jsonText, { message: 'JSON payload is required' });
  });

  loadSample(): void {
    this.model.set({ jsonText: SAMPLE_SCHEMA });
    this.errorStatus.set(null);
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.model.set({ jsonText: reader.result });
        this.errorStatus.set(null);
      }
    };
    reader.readAsText(file);
  }

  submitImport(): void {
    const jsonStr = this.model().jsonText.trim();
    if (!jsonStr) {
      this.errorStatus.set('Please provide JSON text or upload a file.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      this.errorStatus.set(`JSON Parse Error: ${msg}`);
      return;
    }
    const checked = checkImport(parsed);
    if ('error' in checked) {
      this.errorStatus.set(checked.error);
      return;
    }
    this.store.importFromJson(checked.data);
    if (checked.skipped > 0) {
      // Stay open so the learner sees what was left out.
      this.errorStatus.set(
        `Imported the rest; skipped ${checked.skipped} incomplete card${checked.skipped === 1 ? '' : 's'} or question${checked.skipped === 1 ? '' : 's'}.`,
      );
      return;
    }
    this.errorStatus.set(null);
    this.close();
  }

  close(): void {
    this.store.setShowJsonImportModal(false);
  }
}

/**
 * Keeps only what StudyLM can use: complete cards and questions, and a
 * roadmap whose branches are a list. Anything else is reported, not guessed.
 */
function checkImport(
  value: unknown,
): { data: StudyLmJsonImport; skipped: number } | { error: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'The file must hold one JSON object, like the sample.' };
  }
  const data = value as StudyLmJsonImport;
  if (data.roadmap && !Array.isArray(data.roadmap.branches)) {
    return { error: 'roadmap.branches must be a list.' };
  }
  const givenCards = Array.isArray(data.flashcards) ? data.flashcards : [];
  const givenQuiz = Array.isArray(data.quiz) ? data.quiz : [];
  const cards = givenCards.filter((c) => filled(c?.front) && filled(c?.back));
  const quiz = givenQuiz.filter(
    (q) =>
      filled(q?.question) &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every(filled) &&
      Number.isInteger(q.correctIndex) &&
      (q.correctIndex as number) >= 0 &&
      (q.correctIndex as number) <= 3,
  );
  if (!data.roadmap && !data.overview && cards.length + quiz.length === 0) {
    return {
      error: 'Nothing to import: no complete cards, questions or roadmap.',
    };
  }
  return {
    data: { ...data, flashcards: cards, quiz },
    skipped: givenCards.length + givenQuiz.length - cards.length - quiz.length,
  };
}

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
