import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import type { StreakSummary } from '@ah/learning/domain';
import { StreakFlame } from '../streak-flame/streak-flame';
import { ProgressDots } from './progress-dots';

const sampleStreak: StreakSummary = {
  current: 12,
  longest: 21,
  freezesBanked: 1,
  frozen: [],
  repaired: [],
  repairOffer: null,
  todayCounted: true,
  todayFull: false,
  mode: 'daily',
  weeklyTarget: 5,
  thisWeekCount: 3,
};

interface Args {
  total: number;
  done: number;
  label: string;
  streak: StreakSummary;
}

const meta: Meta<Args> = {
  title: 'Learning/Progress dots',
  decorators: [moduleMetadata({ imports: [ProgressDots, StreakFlame] })],
  parameters: { layout: 'padded' },
  args: {
    total: 7,
    done: 3,
    label: "Today's set",
    streak: sampleStreak,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 24rem;">
        <lrn-progress-dots [total]="total" [done]="done" [label]="label">
          <lrn-streak-flame [streak]="streak" [compact]="true" />
        </lrn-progress-dots>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const MidSet: Story = {};
export const AlmostDone: Story = { args: { total: 7, done: 6 } };
