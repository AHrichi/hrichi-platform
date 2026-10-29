import type { Meta, StoryObj } from '@storybook/angular';
import { Select } from './select';

const meta: Meta<Select> = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    label: 'Select Software Track',
    placeholder: 'Choose a track...',
    size: 'md',
    disabled: false,
    options: [
      { value: 'js', label: 'JavaScript & V8 Internals', icon: '⚡', hint: 'Event loop, microtasks, memory' },
      { value: 'ng', label: 'Angular Signals & Zoneless', icon: '🔴', hint: 'Signal forms, microfrontends' },
      { value: 'pg', label: 'PostgreSQL MVCC & B-Trees', icon: '🐘', hint: 'WAL, vacuum, index structures' },
      { value: 'dist', label: 'Distributed Systems & Raft', icon: '🌐', hint: 'Consensus, partition tolerance' },
      { value: 'legacy', label: 'Legacy Architecture', icon: '📦', disabled: true, hint: 'Deprecated track' },
    ],
    value: 'js',
  },
};

export default meta;
type Story = StoryObj<Select>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Filter by Section',
    placeholder: 'All Sections',
    value: 'ng',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Primary Subject Selector',
    value: 'pg',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'js',
  },
};
