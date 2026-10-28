import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { ProgressBar } from './progress-bar';

/**
 * Progress bar with ARIA progressbar semantics, responsive sizes, and
 * theme-compatible semantic tokens.
 */
const meta: Meta<ProgressBar> = {
  title: 'Display/ProgressBar',
  component: ProgressBar,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size: 24rem">
        <ah-progress-bar
          [value]="value"
          [max]="max"
          [label]="label"
          [variant]="variant"
          [size]="size"
          [showValue]="showValue"
          [showDetails]="showDetails"
          [striped]="striped"
        />
      </div>
    `,
  }),
  args: {
    value: 65,
    max: 100,
    label: 'Database Capacity Quota',
    variant: 'primary',
    size: 'md',
    showValue: true,
    showDetails: true,
    striped: false,
  },
};
export default meta;

export const Default: StoryObj<ProgressBar> = {};

export const SuccessVariant: StoryObj<ProgressBar> = {
  args: {
    value: 92,
    max: 100,
    label: 'SLA Hospitality Compliance',
    variant: 'success',
    size: 'lg',
    showValue: true,
  },
};

export const OverBudgetWarning: StoryObj<ProgressBar> = {
  args: {
    value: 88,
    max: 100,
    label: 'Monthly Expense Forecast',
    variant: 'warning',
    size: 'md',
    showValue: true,
  },
};

export const CriticalExceeded: StoryObj<ProgressBar> = {
  args: {
    value: 100,
    max: 100,
    label: 'Free Cluster Document Ceiling',
    variant: 'danger',
    size: 'lg',
    showValue: true,
    striped: true,
  },
};

export const SmallSubtle: StoryObj<ProgressBar> = {
  args: {
    value: 40,
    max: 100,
    label: undefined,
    variant: 'accent',
    size: 'sm',
    showValue: false,
  },
};
