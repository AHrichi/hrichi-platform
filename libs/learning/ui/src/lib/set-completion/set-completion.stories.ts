import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import type { StreakSummary } from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import { SetCompletion, type TierMilestoneGain } from './set-completion';

const streak: StreakSummary = {
  current: 7,
  longest: 14,
  freezesBanked: 1,
  frozen: [],
  repaired: [],
  repairOffer: { missed: '2026-11-11', streakBefore: 5 },
  todayCounted: true,
  todayFull: true,
  mode: 'daily',
  weeklyTarget: 5,
  thisWeekCount: 5,
};

interface Args {
  hadCards: boolean;
  streak: StreakSummary;
  grewTo: TierMilestoneGain[];
  strongCount: number;
  xp: { level: number; into: number; span: number };
  tomorrow: number;
  tomorrowMinutes: number;
}

const meta: Meta<Args> = {
  title: 'Learning/Set completion',
  decorators: [moduleMetadata({ imports: [SetCompletion, AhButton] })],
  parameters: { layout: 'padded' },
  args: {
    hadCards: true,
    streak,
    grewTo: [{ title: 'Opportunity cost', tier: 'leaf' }],
    strongCount: 6,
    xp: { level: 3, into: 35, span: 100 },
    tomorrow: 5,
    tomorrowMinutes: 2,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 28rem;">
        <lrn-set-completion
          [hadCards]="hadCards"
          [streak]="streak"
          [grewTo]="grewTo"
          [strongCount]="strongCount"
          [xp]="xp"
          [tomorrow]="tomorrow"
          [tomorrowMinutes]="tomorrowMinutes"
        >
          <a actions ahButton="ghost" href="#">See the garden</a>
        </lrn-set-completion>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Finished: Story = {};
export const NothingDue: Story = {
  args: {
    hadCards: false,
    grewTo: [],
    streak: { ...streak, repairOffer: null },
  },
};
