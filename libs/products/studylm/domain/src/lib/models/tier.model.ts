export type CompetencyTier = 'beginner' | 'intermediate' | 'expert';

export interface TierInfo {
  tier: CompetencyTier;
  label: string;
  badgeVariant: 'success' | 'warning' | 'accent';
  description: string;
  targetAudience: string;
  icon: string;
}

export const COMPETENCY_TIERS: Record<CompetencyTier, TierInfo> = {
  beginner: {
    tier: 'beginner',
    label: 'Beginner',
    badgeVariant: 'success',
    description: 'Core mental models, fundamental vocabulary, syntax, and foundational primitives.',
    targetAudience: 'Getting started & building rock-solid conceptual grounding.',
    icon: '🌱',
  },
  intermediate: {
    tier: 'intermediate',
    label: 'Intermediate',
    badgeVariant: 'warning',
    description: 'Real-world architecture patterns, state propagation, performance trade-offs, and idioms.',
    targetAudience: 'Production engineering & pragmatic decision-making.',
    icon: '⚡',
  },
  expert: {
    tier: 'expert',
    label: 'Expert',
    badgeVariant: 'accent',
    description: 'Deep runtime mechanics, compiler transforms, microtask queuing, memory leaks, and distributed edge cases.',
    targetAudience: 'Staff/Principal architects & high-throughput systems engineers.',
    icon: '🔥',
  },
};
