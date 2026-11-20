/** A practice question. `step` names the lesson step to review after it. */
export type Check =
  | {
      id: string;
      kind: 'choice';
      prompt: string;
      /** 2–5 distinct options. */
      options: readonly string[];
      /** Index of the right option. */
      answer: number;
      explain: string;
      step?: string;
    }
  | {
      id: string;
      kind: 'numeric';
      prompt: string;
      unit: string;
      answer: number;
      /** Relative, 0.05–0.5: 0.25 accepts ±25%. */
      tolerance: number;
      explain: string;
      step?: string;
    }
  | {
      id: string;
      kind: 'order';
      prompt: string;
      /** In the correct order, 3–6 distinct items. */
      items: readonly string[];
      explain: string;
      step?: string;
    };

export type CheckKind = Check['kind'];

/** What a learner answered: an option index, a number, or items in order. */
export type CheckResponse = number | readonly string[];
