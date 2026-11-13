import { DatePipe } from '@angular/common';
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
  type Concept,
  type ConceptDraft,
  type ConceptFieldGroup,
  type ConceptLink,
  describeLink,
  LIMITS,
  LINK_RELATIONS,
  type LinkRelation,
  type RecallPrompt,
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

const LIBRARY_STATUSES = ['active', 'suspended', 'archived'] as const;
type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

const STATUS_LABELS: Record<LibraryStatus, string> = {
  active: 'Active',
  suspended: 'Paused',
  archived: 'Archived',
};

interface ConceptEditDraft {
  id: string;
  title: string;
  topicId: string;
  newTopic: string;
  status: LibraryStatus;
  essence: string;
  simple: string;
  analogy: string;
  misconception: string;
  ownWords: string;
  prompts: RecallPrompt[];
}

/**
 * Concepts on this device: search and filter, edit explanations and
 * recall prompts (keeping prior versions), organize by topic, or add by hand.
 */
@Component({
  selector: 'lrn-concepts-screen',
  imports: [AhButton, AhEmptyState, DatePipe, FormField, FormRoot, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concepts-screen.html',
  styleUrl: './concepts-screen.scss',
})
export class ConceptsScreen {
  protected readonly store = inject(LearningStore);
  protected readonly limits = LIMITS;
  protected readonly fields = FIELDS;
  protected readonly statuses = LIBRARY_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly adding = signal(false);
  protected readonly query = signal('');
  protected readonly topicFilter = signal<'all' | 'none' | string>('all');
  protected readonly statusFilter = signal<'all' | LibraryStatus>('all');
  protected readonly editing = signal<ConceptEditDraft | null>(null);
  protected readonly editError = signal<string | null>(null);
  protected readonly editSaving = signal(false);

  protected readonly topicNames = computed(
    () => new Map(this.store.topics().map((t) => [t.id, t.name])),
  );

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const topic = this.topicFilter();
    const status = this.statusFilter();
    return this.store.library().filter((concept) => {
      if (status !== 'all' && concept.status !== status) return false;
      if (topic === 'none' && concept.topicId !== null) return false;
      if (topic !== 'all' && topic !== 'none' && concept.topicId !== topic) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        concept.title,
        concept.explanation.essence,
        concept.explanation.simple ?? '',
        concept.explanation.analogy ?? '',
        concept.explanation.ownWords ?? '',
        ...concept.prompts.flatMap((p) => [p.question, p.answer]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

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

  protected clearFilters(): void {
    this.query.set('');
    this.topicFilter.set('all');
    this.statusFilter.set('all');
  }

  protected startEdit(concept: Concept): void {
    this.editError.set(null);
    this.editing.set({
      id: concept.id,
      title: concept.title,
      topicId: concept.topicId ?? '',
      newTopic: '',
      status: concept.status === 'draft' ? 'active' : concept.status,
      essence: concept.explanation.essence,
      simple: concept.explanation.simple ?? '',
      analogy: concept.explanation.analogy ?? '',
      misconception: concept.explanation.misconception ?? '',
      ownWords: concept.explanation.ownWords ?? '',
      prompts: concept.prompts.map((p) => ({
        ...p,
        keyPoints: [...p.keyPoints],
      })),
    });
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.editError.set(null);
  }

  protected patchEdit(patch: Partial<ConceptEditDraft>): void {
    this.editing.update((draft) => (draft ? { ...draft, ...patch } : null));
  }

  protected patchPrompt(index: number, patch: Partial<RecallPrompt>): void {
    this.editing.update((draft) => {
      if (!draft) return null;
      const prompts = draft.prompts.map((prompt, i) =>
        i === index ? { ...prompt, ...patch } : prompt,
      );
      return { ...draft, prompts };
    });
  }

  protected addPromptToEdit(): void {
    this.editing.update((draft) => {
      if (!draft || draft.prompts.length >= LIMITS.prompts) return draft;
      return {
        ...draft,
        prompts: [
          ...draft.prompts,
          {
            id: crypto.randomUUID(),
            type: 'free_recall',
            question: '',
            answer: '',
            options: null,
            keyPoints: [],
            retired: false,
          },
        ],
      };
    });
  }

  protected removePromptFromEdit(index: number): void {
    this.editing.update((draft) => {
      if (!draft || draft.prompts.length <= 1) return draft;
      return {
        ...draft,
        prompts: draft.prompts.filter((_, i) => i !== index),
      };
    });
  }

  protected async saveEdit(original: Concept): Promise<void> {
    const draft = this.editing();
    if (!draft || draft.id !== original.id || this.editSaving()) return;
    const title = draft.title.trim();
    const essence = draft.essence.trim();
    if (!title || title.length > LIMITS.conceptTitle) {
      this.editError.set(
        `Give the concept a title (1–${LIMITS.conceptTitle} characters).`,
      );
      return;
    }
    if (!essence || essence.length > LIMITS.essence) {
      this.editError.set(
        `Give a one-line essence (1–${LIMITS.essence} characters).`,
      );
      return;
    }
    const prompts = draft.prompts.map((prompt) => ({
      ...prompt,
      question: prompt.question.trim(),
      answer: prompt.answer.trim(),
    }));
    if (
      !prompts.length ||
      prompts.some(
        (p) =>
          !p.question ||
          p.question.length > LIMITS.question ||
          !p.answer ||
          p.answer.length > LIMITS.answer,
      )
    ) {
      this.editError.set(
        'Every question needs non-empty question and answer text within limits.',
      );
      return;
    }

    this.editError.set(null);
    this.editSaving.set(true);
    try {
      let topicId: string | null = draft.topicId || null;
      if (draft.topicId === '__new__' && draft.newTopic.trim()) {
        topicId = (await this.store.addTopic(draft.newTopic)).id;
      } else if (topicId === '__new__') {
        topicId = original.topicId;
      }

      const cleanOpt = (value: string) =>
        value.trim().slice(0, LIMITS.explanation) || null;
      const nextExplanation = {
        essence,
        simple: cleanOpt(draft.simple),
        analogy: cleanOpt(draft.analogy),
        misconception: cleanOpt(draft.misconception),
        ownWords: cleanOpt(draft.ownWords),
        by: original.explanation.by,
      };
      const explanationChanged =
        nextExplanation.essence !== original.explanation.essence ||
        nextExplanation.simple !== original.explanation.simple ||
        nextExplanation.analogy !== original.explanation.analogy ||
        nextExplanation.misconception !== original.explanation.misconception ||
        nextExplanation.ownWords !== original.explanation.ownWords;
      if (explanationChanged) {
        nextExplanation.by = 'user';
      }

      const groups: ConceptFieldGroup[] = [];
      if (title !== original.title || explanationChanged) {
        groups.push('explanation');
      }
      if (JSON.stringify(prompts) !== JSON.stringify(original.prompts)) {
        groups.push('prompts');
      }
      if (draft.status !== original.status) {
        groups.push('status');
      }
      if (topicId !== original.topicId) {
        groups.push('topic');
      }

      if (groups.length) {
        await this.store.updateConcept(
          original.id,
          {
            title,
            topicId,
            status: draft.status,
            explanation: nextExplanation,
            prompts,
          },
          groups,
        );
      }
      this.editing.set(null);
    } finally {
      this.editSaving.set(false);
    }
  }

  protected remove(id: string, title: string): void {
    if (globalThis.confirm?.(`Delete “${title}” on every device?`)) {
      void this.store.deleteConcept(id);
    }
  }
}
