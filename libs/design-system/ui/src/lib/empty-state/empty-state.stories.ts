import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { EmptyState } from './empty-state';
import { AhButton } from '../button/button';

/**
 * Standardized empty / unpopulated state container for empty tables, search results, and workspaces.
 */
const meta: Meta<EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  decorators: [moduleMetadata({ imports: [AhButton] })],
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 680px; padding: 2rem;">
        <ah-empty-state
          [icon]="icon"
          [eyebrow]="eyebrow"
          [title]="title"
          [description]="description"
        >
          <div empty-actions>
            <button type="button" ahButton="primary" size="sm">Create Subject</button>
            <button type="button" ahButton="secondary" size="sm">Browse Catalog</button>
          </div>
        </ah-empty-state>
      </div>
    `,
  }),
  args: {
    icon: '🗺️',
    eyebrow: 'Curriculum Roadmap',
    title: 'No Software Engineering Roadmap Generated',
    description: 'Enter a topic like JavaScript, Angular Signals, or PostgreSQL to generate a structured branch roadmap.',
  },
};
export default meta;

export const Default: StoryObj<EmptyState> = {};
