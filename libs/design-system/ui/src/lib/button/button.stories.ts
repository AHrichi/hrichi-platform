import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { AhButton, type ButtonSize, type ButtonVariant } from './button';

interface Args {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
}

/**
 * One directive styles both elements, so a control can always be the right
 * one: `<button>` for actions, `<a>` for navigation.
 */
const meta: Meta<Args> = {
  title: 'Actions/Button',
  decorators: [moduleMetadata({ imports: [AhButton] })],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
  args: { variant: 'primary', size: 'md', label: 'Book a call' },
  render: (args) => ({
    props: args,
    template: `
      <div class="ah-cluster">
        <button type="button" [ahButton]="variant" [size]="size">{{ label }}</button>
        <a href="#" [ahButton]="variant" [size]="size">{{ label }} (link)</a>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Small: Story = { args: { size: 'sm' } };
