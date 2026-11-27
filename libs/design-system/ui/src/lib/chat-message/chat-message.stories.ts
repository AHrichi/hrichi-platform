import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { ChatMessage } from './chat-message';

/** One message in a conversation, as plain text. */
const meta: Meta<ChatMessage> = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 26rem">${story}</div>`,
    ),
  ],
  args: {
    from: 'assistant',
    text: 'Your peak heating load is 322 kW for the Kebili house, at a 0 °C design night.',
    meta: 'Groq (openai/gpt-oss-120b)',
  },
};
export default meta;

type Story = StoryObj<ChatMessage>;

export const FromTheAssistant: Story = {};

export const FromTheReader: Story = {
  args: {
    from: 'user',
    text: 'How much heat does the house need on the coldest night?',
    meta: null,
  },
};

/** A model's answer with light formatting: lists, bold, italic, code. */
export const FormattedAnswer: Story = {
  args: {
    format: 'rich',
    text: [
      'Water does four jobs in a greenhouse:',
      '',
      '1. **Crop irrigation**: drip lines, sized on what the crop *transpires*.',
      '2. **Fertigation**: nutrients with the water; keep the drain EC under `6`.',
      '3. **Cooling** and **humidity**: fog or wet pads on hot days.',
    ].join('\n'),
  },
};

/** Something the app did or couldn't do. */
export const Notice: Story = {
  args: { from: 'notice', text: 'Sunlight mode is on.', meta: null },
};

export const Failure: Story = {
  args: {
    from: 'notice',
    tone: 'error',
    text: 'The assistant is busy. Try again in 20 seconds.',
    meta: null,
  },
};

/** Waiting for an answer: three dots, announced once. */
export const Typing: Story = {
  tags: ['animated'],
  args: { typing: true, meta: null },
};

/** Arabic text reads right to left in the bubble, numbers and units kept. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator(
      (story) => `<div dir="rtl" lang="ar">${story}</div>`,
    ),
  ],
  args: {
    text: 'حمل التدفئة الأقصى 322 kW لبيت قبلي، عند ليلة تصميم 0 °C.',
    meta: null,
  },
};
