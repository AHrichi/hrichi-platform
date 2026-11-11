import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  required,
} from '@angular/forms/signals';
import { type ConceptDraft, LIMITS } from '@ah/learning/domain';
import { AhButton, AhEmptyState } from '@ah/ui';
import { LearningStore } from '../../store/learning.store';

interface DraftField {
  key: keyof ConceptDraft;
  label: string;
  hint: string;
  multiline: boolean;
}

const FIELDS: readonly DraftField[] = [
  {
    key: 'title',
    label: 'Concept',
    hint: 'Opportunity cost',
    multiline: false,
  },
  {
    key: 'essence',
    label: 'The idea in one line',
    hint: 'What you give up by choosing one option over the next best.',
    multiline: true,
  },
  {
    key: 'question',
    label: 'A question to recall it',
    hint: 'What is the opportunity cost of studying tonight?',
    multiline: true,
  },
  {
    key: 'answer',
    label: 'The answer',
    hint: 'Whatever else I would have done with the evening.',
    multiline: true,
  },
];

const emptyDraft = (): ConceptDraft => ({
  title: '',
  essence: '',
  question: '',
  answer: '',
});

/**
 * Concepts on this device, and a form to add one by hand. Phase L2
 * replaces typing with capture: a sentence or a voice note in, a Feynman
 * explanation and questions out.
 */
@Component({
  selector: 'lrn-concepts-screen',
  imports: [AhButton, AhEmptyState, FormField, FormRoot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concepts-screen.html',
  styleUrl: './concepts-screen.scss',
})
export class ConceptsScreen {
  protected readonly store = inject(LearningStore);
  protected readonly fields = FIELDS;
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);

  protected readonly draft = signal<ConceptDraft>(emptyDraft());
  protected readonly form = form(
    this.draft,
    (path) => {
      required(path.title, { message: 'Give the concept a name.' });
      maxLength(path.title, LIMITS.conceptTitle);
      required(path.essence, { message: 'Say the idea in one line.' });
      maxLength(path.essence, LIMITS.essence);
      required(path.question, { message: 'Ask yourself one question.' });
      maxLength(path.question, LIMITS.question);
      required(path.answer, { message: 'Write the answer you expect.' });
      maxLength(path.answer, LIMITS.answer);
    },
    { submission: { action: () => this.save() } },
  );

  private async save(): Promise<undefined> {
    if (this.saving()) return undefined;
    this.saving.set(true);
    try {
      await this.store.addConcept(this.draft());
      this.form().reset(emptyDraft());
      this.adding.set(false);
    } finally {
      this.saving.set(false);
    }
    return undefined;
  }

  protected cancel(): void {
    this.form().reset(emptyDraft());
    this.adding.set(false);
  }

  protected remove(id: string, title: string): void {
    if (globalThis.confirm?.(`Delete “${title}” on every device?`)) {
      void this.store.deleteConcept(id);
    }
  }
}
