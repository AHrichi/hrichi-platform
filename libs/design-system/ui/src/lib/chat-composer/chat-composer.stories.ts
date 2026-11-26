import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ChatComposer } from './chat-composer';

/** Where a message is written. Enter sends; Shift+Enter starts a line. */
const meta: Meta<ChatComposer> = {
  title: 'Chat/ChatComposer',
  component: ChatComposer,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 26rem">${story}</div>`,
    ),
  ],
  args: {
    label: 'Message the assistant',
    placeholder: 'Ask about your greenhouse…',
    hint: 'Your messages and the open project go to an AI service.',
    send: fn(),
    stop: fn(),
  },
};
export default meta;

type Story = StoryObj<ChatComposer>;

export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Message the assistant' }),
      'Create a project{Enter}',
    );
    await expect(args.send).toHaveBeenCalledWith('Create a project');
  },
};

/** While an answer is on its way, Send becomes Stop. */
export const Busy: Story = { args: { busy: true } };

export const Disabled: Story = {
  args: {
    disabled: true,
    hint: 'You’re offline: the assistant needs a connection.',
  },
};
