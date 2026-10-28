import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { MetricCard } from './metric-card';

/**
 * Metric cards display key performance indicators (KPIs) with status colors,
 * trend deltas, icons, and supporting contextual hints.
 */
const meta: Meta<MetricCard> = {
  title: 'Display/MetricCard',
  component: MetricCard,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size: 20rem">
        <ah-metric-card
          [label]="label"
          [value]="value"
          [unit]="unit"
          [icon]="icon"
          [hint]="hint"
          [trend]="trend"
          [variant]="variant"
          [elevation]="elevation"
        />
      </div>
    `,
  }),
  args: {
    label: 'On-Time Delivery Rate',
    value: '98.4%',
    icon: '⚡',
    hint: 'Target > 95% across all 4 daily dispatch shifts',
    trend: { direction: 'up', label: '+2.1% this week', positive: true },
    variant: 'default',
    elevation: 'flat',
  },
};
export default meta;

export const Default: StoryObj<MetricCard> = {};

export const RaisedWithTrend: StoryObj<MetricCard> = {
  args: {
    label: 'Monthly Net Worth',
    value: '£48,250',
    icon: '📈',
    hint: 'Calculated across cash, liquid investments, and liabilities',
    trend: { direction: 'up', label: '+£1,420 vs forecast', positive: true },
    elevation: 'raised',
    variant: 'success',
  },
};

export const CriticalAlert: StoryObj<MetricCard> = {
  args: {
    label: 'Subcontractor Linen Loss',
    value: '4.8%',
    icon: '⚠️',
    hint: 'Exceeds SLA threshold of 2.0% (Action Required)',
    trend: { direction: 'up', label: '+1.3% vs last shift', positive: false },
    variant: 'danger',
    elevation: 'raised',
  },
};

export const AccentVariant: StoryObj<MetricCard> = {
  args: {
    label: 'Total Active Drivers',
    value: '8',
    unit: 'vans en route',
    icon: '🚚',
    hint: 'Central London & Greater London corridors',
    trend: { direction: 'neutral', label: 'Capacity: 80%' },
    variant: 'accent',
  },
};
