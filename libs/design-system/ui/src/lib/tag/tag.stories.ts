import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { Tag } from './tag';

const meta: Meta<{ labels: string[] }> = {
  title: 'Display/Tag',
  decorators: [moduleMetadata({ imports: [Tag] })],
  args: { labels: ['Angular 22', 'Nx', 'Three.js', 'Spring Boot'] },
  render: (args) => ({
    props: args,
    template: `
      <ul class="ah-cluster" role="list" style="--gap: var(--space-2)">
        @for (label of labels; track label) {
          <li><ah-tag>{{ label }}</ah-tag></li>
        }
      </ul>
    `,
  }),
};
export default meta;

export const Stack: StoryObj<{ labels: string[] }> = {};
