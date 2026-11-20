/** Typed copy for the Learning Engine hand-off (ADR-0018, ADR-0024). */
export const LEARNING_COPY = {
  addToReviews: 'Add to my daily reviews',
  tryInDemo: 'Try in demo',
  standaloneHint: 'Standalone app, opens in a new tab',
  sentToReviews: 'In your reviews',
} as const;

export type LearningCopy = typeof LEARNING_COPY;
