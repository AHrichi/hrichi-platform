import type { ReviewEvent, ReviewSession, TeachBack } from '../records';
import { type MasteryTier, type MemoryState, tierOf } from './memory';

/**
 * Milestones and the cosmetics they unlock (design §3). Computed from the
 * events like everything else, so nothing can be bought or lost; rewards
 * change how the garden looks, never what is reviewed.
 */
export interface Milestone {
  id: string;
  title: string;
  /** What earns it, for the ones still ahead. */
  how: string;
  earned: boolean;
}

export interface Progress {
  events: readonly ReviewEvent[];
  sessions: readonly ReviewSession[];
  memory: ReadonlyMap<string, MemoryState>;
  longestStreak: number;
  level: number;
  teachBacks?: readonly TeachBack[];
}

function tierCount(
  memory: ReadonlyMap<string, MemoryState>,
  tiers: MasteryTier[],
): number {
  return [...memory.values()].filter((state) => tiers.includes(tierOf(state)))
    .length;
}

export function milestonesOf(progress: Progress): Milestone[] {
  const finished = progress.sessions.filter(
    (session) => session.completedAt && session.planned.length,
  ).length;
  const reviews = progress.events.length;
  const strong = tierCount(progress.memory, ['leaf', 'bloom', 'golden']);
  const golden = tierCount(progress.memory, ['golden']);
  const bloom = tierCount(progress.memory, ['bloom', 'golden']);
  return [
    {
      id: 'first-set',
      title: 'First set',
      how: 'Finish a Daily Set.',
      earned: finished >= 1,
    },
    {
      id: 'week',
      title: 'A week',
      how: 'Reach a 7-day streak.',
      earned: progress.longestStreak >= 7,
    },
    {
      id: 'hundred',
      title: '100 answers',
      how: 'Answer 100 cards.',
      earned: reviews >= 100,
    },
    {
      id: 'ten-leaves',
      title: 'Ten leaves',
      how: 'Get 10 concepts to Leaf.',
      earned: strong >= 10,
    },
    {
      id: 'first-bloom',
      title: 'First bloom',
      how: 'Get a concept to Bloom.',
      earned: bloom >= 1,
    },
    {
      id: 'crystal-clear',
      title: 'Crystal clear',
      how: 'Teach a concept back clearly.',
      earned: (progress.teachBacks ?? []).some(
        (teachBack) => teachBack.clarity === 'clear',
      ),
    },
    {
      id: 'month',
      title: 'A month',
      how: 'Reach a 30-day streak.',
      earned: progress.longestStreak >= 30,
    },
    {
      id: 'golden',
      title: 'Golden',
      how: 'Get a concept to Golden.',
      earned: golden >= 1,
    },
  ];
}

export const GARDEN_THEMES = ['meadow', 'autumn', 'night', 'aurora'] as const;
export type GardenTheme = (typeof GARDEN_THEMES)[number];

export interface ThemeUnlock {
  theme: GardenTheme;
  title: string;
  how: string;
  unlocked: boolean;
}

/** Garden looks, unlocked by levels and milestones. */
export function themesOf(progress: Progress): ThemeUnlock[] {
  const earned = new Set(
    milestonesOf(progress)
      .filter((milestone) => milestone.earned)
      .map((milestone) => milestone.id),
  );
  return [
    {
      theme: 'meadow',
      title: 'Meadow',
      how: 'From the start.',
      unlocked: true,
    },
    {
      theme: 'autumn',
      title: 'Autumn',
      how: 'Reach level 3.',
      unlocked: progress.level >= 3,
    },
    {
      theme: 'night',
      title: 'Night',
      how: 'Reach a 7-day streak.',
      unlocked: earned.has('week'),
    },
    {
      theme: 'aurora',
      title: 'Aurora',
      how: 'Get a concept to Golden.',
      unlocked: earned.has('golden'),
    },
  ];
}
