import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import type { StreakSummary } from '@ah/learning/domain';
import { StreakFlame } from './streak-flame';

const daily: StreakSummary = {
  current: 14,
  longest: 21,
  freezesBanked: 2,
  frozen: [],
  repaired: [],
  repairOffer: null,
  todayCounted: true,
  todayFull: true,
  mode: 'daily',
  weeklyTarget: 5,
  thisWeekCount: 4,
};

interface Args {
  streak: StreakSummary;
  compact: boolean;
}

const meta: Meta<Args> = {
  title: 'Learning/Streak flame',
  decorators: [moduleMetadata({ imports: [StreakFlame] })],
  parameters: { layout: 'padded' },
  args: { streak: daily, compact: false },
  render: (args) => ({
    props: args,
    template: `<lrn-streak-flame [streak]="streak" [compact]="compact" />`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const DailyFull: Story = {};
export const DailyCompact: Story = { args: { compact: true } };
export const WeeklyMode: Story = {
  args: {
    streak: {
      ...daily,
      current: 4,
      mode: 'weekly',
      weeklyTarget: 5,
      thisWeekCount: 3,
    },
    compact: false,
  },
};
