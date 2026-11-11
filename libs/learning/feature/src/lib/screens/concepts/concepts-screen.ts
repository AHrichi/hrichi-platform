import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { RouterLink } from '@angular/router';
import {
  type ConceptDraft,
  type ConceptLink,
  describeLink,
  LIMITS,
  LINK_RELATIONS,
  type LinkRelation,
} from '@ah/learning/domain';
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

const RELATION_LABELS: Record<LinkRelation, string> = {
  similar: 'Easy to mix up',
  contrasts: 'Opposites or alternatives',
  prerequisite: 'This one comes first',
  example_of: 'This is an example of it',
  causes: 'This one leads to it',
};

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
  imports: [AhButton, AhEmptyState, FormField, FormRoot, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concepts-screen.html',
  styleUrl: './concepts-screen.scss',
})
export class ConceptsScreen {
  protected readonly store = inject(LearningStore);
  protected readonly fields = FIELDS;
  protected readonly adding = signal(false);
  protected readonly relations = LINK_RELATIONS.map((value) => ({
    value,
    label: RELATION_LABELS[value],
  }));
  /** Confirmed links, per concept, as sentences. */
  private readonly links = computed(() => {
    const titles = new Map(
      this.store.library().map((concept) => [concept.id, concept.title]),
    );
    const byConcept = new Map<string, { link: ConceptLink; text: string }[]>();
    for (const link of this.store.links()) {
      const a = titles.get(link.from);
      const b = titles.get(link.to);
      if (!link.confirmed || link.deletedAt || !a || !b) continue;
      const entry = { link, text: describeLink(link.relation, a, b) };
      for (const id of [link.from, link.to]) {
        byConcept.set(id, [...(byConcept.get(id) ?? []), entry]);
      }
    }
    return byConcept;
  });
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

  protected linksOf(conceptId: string): { link: ConceptLink; text: string }[] {
    return this.links().get(conceptId) ?? [];
  }

  protected link(from: string, to: string, relation: string): void {
    const known = LINK_RELATIONS.find((value) => value === relation);
    if (!to || !known) return;
    void this.store.addLink(from, to, known);
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
