import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SegmentedControl } from './segmented-control';

/** A radio group with one tab stop; the arrow keys move and select. */
const meta: Meta<SegmentedControl<string>> = {
  title: 'Navigation/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: 'View this site as',
    value: 'recruiter',
    options: [
      { value: 'recruiter', label: 'Recruiter' },
      { value: 'engineer', label: 'Engineer' },
      { value: 'client', label: 'Client' },
    ],
  },
};
export default meta;

export const Audience: StoryObj<SegmentedControl<string>> = {};
export const SimulationSpeed: StoryObj<SegmentedControl<string>> = {
  args: {
    label: 'Simulation speed',
    value: '1',
    options: [
      { value: '1', label: 'Live' },
      { value: '60', label: '×60' },
      { value: '600', label: '×600' },
    ],
  },
};
