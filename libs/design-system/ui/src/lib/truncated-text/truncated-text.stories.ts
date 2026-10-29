import type { Meta, StoryObj } from '@storybook/angular';
import { TruncatedText } from './truncated-text';

const meta: Meta<TruncatedText> = {
  title: 'Display/TruncatedText',
  component: TruncatedText,
  tags: ['autodocs'],
  argTypes: {
    lines: {
      control: 'number',
    },
    maxWidth: {
      control: 'text',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom'],
    },
    interactive: {
      control: 'boolean',
    },
  },
  args: {
    text: 'JavaScript Execution Context & Microtask Queue Pipeline Scheduling',
    maxWidth: '220px',
    lines: 1,
    position: 'top',
    interactive: true,
    tooltipTitle: 'Full Subject Title',
  },
};

export default meta;
type Story = StoryObj<TruncatedText>;

export const Default: Story = {};

export const Multiline: Story = {
  args: {
    text: 'A lexical closure is the combination of a function bundled together with references to its surrounding state. In V8, closures are preserved on the managed heap when escaping outer scopes.',
    maxWidth: '280px',
    lines: 2,
    tooltipTitle: 'V8 Closure Spec',
  },
};

export const BottomPopover: Story = {
  args: {
    text: 'PostgreSQL MVCC Multi-Version Concurrency Control Snapshot Read Engine',
    maxWidth: '180px',
    position: 'bottom',
    tooltipTitle: 'Engine Spec',
  },
};
