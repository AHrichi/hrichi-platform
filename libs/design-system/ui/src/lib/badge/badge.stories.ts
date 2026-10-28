import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { Badge } from './badge';

/**
 * Status badges communicate state, lifecycle phase, or operational alerts
 * with semantic color tokens and optional animated status dots.
 */
const meta: Meta<Badge> = {
  title: 'Display/Badge',
  component: Badge,
  render: (args) => ({
    props: args,
    template: `
      <div class="ah-cluster" style="--gap: var(--space-3)">
        <ah-badge
          [variant]="variant"
          [dot]="dot"
          [pulse]="pulse"
          [size]="size"
        >
          {{ label }}
        </ah-badge>
      </div>
    `,
  }),
  args: {
    label: '🟢 Cloud Active',
    variant: 'success',
    dot: true,
    pulse: true,
    size: 'md',
  },
};
export default meta;

export const Default: StoryObj<Badge & { label: string }> = {};

export const VariantsGallery: StoryObj<Badge> = {
  render: () => ({
    template: `
      <div class="ah-cluster" style="--gap: var(--space-2); flex-wrap: wrap;">
        <ah-badge variant="neutral" [dot]="true">Offline</ah-badge>
        <ah-badge variant="success" [dot]="true" [pulse]="true">Live / In Transit</ah-badge>
        <ah-badge variant="warning" [dot]="true">Approaching SLA</ah-badge>
        <ah-badge variant="danger" [dot]="true" [pulse]="true">Critical Delay</ah-badge>
        <ah-badge variant="info" [dot]="true">At Wash Plant</ah-badge>
        <ah-badge variant="accent" [dot]="true">Encrypted (AES-256)</ah-badge>
      </div>
    `,
  }),
};

export const SmallSizes: StoryObj<Badge> = {
  render: () => ({
    template: `
      <div class="ah-cluster" style="--gap: var(--space-2)">
        <ah-badge size="sm" variant="success" [dot]="true">Clean Ready</ah-badge>
        <ah-badge size="sm" variant="warning">Pending POD</ah-badge>
        <ah-badge size="sm" variant="danger">Damaged Linen</ah-badge>
      </div>
    `,
  }),
};
