import { provideRouter } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { ActionLink } from './action-link';

/** A router link for site paths, a plain link for mailto: and external URLs. */
const meta: Meta<ActionLink> = {
  title: 'Actions/ActionLink',
  component: ActionLink,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
};
export default meta;

type Story = StoryObj<ActionLink>;

export const SitePath: Story = {
  args: { link: { label: 'See the work', href: '/work' } },
};

export const External: Story = {
  args: {
    link: {
      label: 'Source on GitHub',
      href: 'https://github.com/AHrichi/hrichi-platform',
      external: true,
    },
    variant: 'secondary',
  },
};
