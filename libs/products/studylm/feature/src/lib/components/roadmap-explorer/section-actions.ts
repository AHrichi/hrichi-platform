import type { RoadmapSection } from '@ah/products/studylm/domain';
import type { SectionActionMenuItem } from '../section-actions-menu/section-actions-menu';

/** Action ids performed for a roadmap section card. */
export type SectionActionKind =
  | 'open-lesson'
  | 'write-lesson'
  | 'study-cards'
  | 'generate-cards'
  | 'take-quiz'
  | 'generate-quiz'
  | 'approve';

export interface PrimarySectionAction {
  readonly id: string;
  readonly kind: SectionActionKind;
  readonly label: string;
  readonly variant: 'primary' | 'secondary' | 'ghost';
  readonly disabled: boolean;
}

export interface SectionActionGroups {
  readonly primary: readonly PrimarySectionAction[];
  readonly overflow: readonly (Omit<SectionActionMenuItem, 'action'> & {
    readonly kind: SectionActionKind;
  })[];
}

export interface SectionActionState {
  readonly section: Pick<
    RoadmapSection,
    'id' | 'approved' | 'flashcardsStatus' | 'quizStatus'
  >;
  readonly lessonSaved: boolean;
  readonly lessonStatus: string | null;
  readonly cardCount: number;
  readonly quizCount: number;
  readonly generatingCards: boolean;
  readonly generatingQuiz: boolean;
  readonly aiReady: boolean;
}

export interface SectionActionCopy {
  readonly approveSection: string;
  readonly generatingCards: string;
  readonly regenerateFlashcards: string;
  readonly retryFlashcards: string;
  readonly generateFlashcards: string;
  readonly generatingQuiz: string;
  readonly regenerateQuiz: string;
  readonly retryQuiz: string;
  readonly generateQuiz: string;
  readonly writingLesson: string;
  readonly openLesson: string;
  readonly rewriteLesson: string;
  readonly writeLesson: string;
  readonly studyCards: string;
  readonly takeQuiz: string;
}

interface ResourceSlotLabels {
  readonly generating: string;
  readonly retry: string;
  readonly regenerate: string;
  readonly generate: string;
  readonly consume: string;
}

function addResourceSlot(
  primary: PrimarySectionAction[],
  overflow: Array<
    Omit<SectionActionMenuItem, 'action'> & { readonly kind: SectionActionKind }
  >,
  opts: {
    key: 'cards' | 'quiz';
    status: RoadmapSection['flashcardsStatus'];
    count: number;
    generating: boolean;
    aiReady: boolean;
    labels: ResourceSlotLabels;
  },
): void {
  const consumeKind: SectionActionKind =
    opts.key === 'cards' ? 'study-cards' : 'take-quiz';
  const generateKind: SectionActionKind =
    opts.key === 'cards' ? 'generate-cards' : 'generate-quiz';
  const consumeLabel = `${opts.labels.consume} (${opts.count})`;
  const regenLabel =
    opts.status === 'ready' ? opts.labels.regenerate : opts.labels.generate;

  if (opts.generating) {
    primary.push({
      id: `primary-${generateKind}`,
      kind: generateKind,
      label: opts.labels.generating,
      variant: 'secondary',
      disabled: true,
    });
    if (opts.count > 0 && opts.status === 'ready') {
      overflow.push({
        id: `overflow-${generateKind}`,
        kind: generateKind,
        label: regenLabel,
        icon: 'refresh',
        disabled: true,
      });
    }
    return;
  }

  if (opts.count > 0 && opts.status !== 'error') {
    primary.push({
      id: `primary-${consumeKind}`,
      kind: consumeKind,
      label: consumeLabel,
      variant: 'secondary',
      disabled: false,
    });
    overflow.push({
      id: `overflow-${generateKind}`,
      kind: generateKind,
      label: regenLabel,
      icon: 'refresh',
      disabled: !opts.aiReady,
    });
    return;
  }

  const label =
    opts.status === 'error'
      ? opts.labels.retry
      : opts.status === 'ready'
        ? opts.labels.regenerate
        : opts.labels.generate;

  primary.push({
    id: `primary-${generateKind}`,
    kind: generateKind,
    label,
    variant: 'secondary',
    disabled: !opts.aiReady,
  });

  if (opts.count > 0) {
    overflow.push({
      id: `overflow-${consumeKind}`,
      kind: consumeKind,
      label: consumeLabel,
      icon: 'open',
      disabled: false,
    });
  }
}

/**
 * Splits a roadmap section's actions so the card keeps one primary CTA plus
 * study/next-step actions upfront while overwrite/regeneration actions live
 * in the overflow menu.
 */
export function partitionSectionActions(
  state: SectionActionState,
  copy: SectionActionCopy,
): SectionActionGroups {
  const primary: PrimarySectionAction[] = [];
  const overflow: Array<
    Omit<SectionActionMenuItem, 'action'> & { readonly kind: SectionActionKind }
  > = [];

  const writing =
    state.lessonStatus === 'planning' || state.lessonStatus === 'writing';

  if (writing) {
    primary.push({
      id: 'primary-lesson',
      kind: 'open-lesson',
      label: copy.writingLesson,
      variant: 'secondary',
      disabled: false,
    });
  } else if (state.lessonSaved) {
    primary.push({
      id: 'primary-lesson',
      kind: 'open-lesson',
      label: copy.openLesson,
      variant: 'primary',
      disabled: false,
    });
    overflow.push({
      id: 'overflow-rewrite-lesson',
      kind: 'write-lesson',
      label: copy.rewriteLesson,
      icon: 'refresh',
      disabled: false,
    });
  } else {
    primary.push({
      id: 'primary-lesson',
      kind: 'write-lesson',
      label: copy.writeLesson,
      variant: 'primary',
      disabled: false,
    });
  }

  addResourceSlot(primary, overflow, {
    key: 'cards',
    status: state.section.flashcardsStatus,
    count: state.cardCount,
    generating: state.generatingCards,
    aiReady: state.aiReady,
    labels: {
      generating: copy.generatingCards,
      retry: copy.retryFlashcards,
      regenerate: copy.regenerateFlashcards,
      generate: copy.generateFlashcards,
      consume: copy.studyCards,
    },
  });

  addResourceSlot(primary, overflow, {
    key: 'quiz',
    status: state.section.quizStatus,
    count: state.quizCount,
    generating: state.generatingQuiz,
    aiReady: state.aiReady,
    labels: {
      generating: copy.generatingQuiz,
      retry: copy.retryQuiz,
      regenerate: copy.regenerateQuiz,
      generate: copy.generateQuiz,
      consume: copy.takeQuiz,
    },
  });

  if (!state.section.approved) {
    primary.push({
      id: 'primary-approve',
      kind: 'approve',
      label: copy.approveSection,
      variant: 'ghost',
      disabled: false,
    });
  }

  return { primary, overflow };
}
