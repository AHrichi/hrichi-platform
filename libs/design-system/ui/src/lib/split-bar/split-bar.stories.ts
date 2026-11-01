import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { SplitBar } from './split-bar';

/**
 * Multi-segment proportional comparison bar with inline labels and legend.
 */
const meta: Meta<SplitBar> = {
  title: 'Display/SplitBar',
  component: SplitBar,
  args: {
    size: 'md',
    showLegend: true,
    segments: [
      {
        label: 'Ahmed',
        percentage: 54.2,
        value: '1,840 msgs',
        color: '#25D366',
      },
      {
        label: 'Yasmine',
        percentage: 45.8,
        value: '1,554 msgs',
        color: '#38BDF8',
      },
    ],
  },
};
export default meta;

export const Default: StoryObj<SplitBar> = {};

export const ThreeParticipants: StoryObj<SplitBar> = {
  args: {
    size: 'lg',
    segments: [
      { label: 'Ahmed', percentage: 48, value: '960 msgs', color: '#25D366' },
      { label: 'Sarah', percentage: 32, value: '640 msgs', color: '#38BDF8' },
      { label: 'Karim', percentage: 20, value: '400 msgs', color: '#F59E0B' },
    ],
  },
};
