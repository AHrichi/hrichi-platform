import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { Tabs, type TabItem } from './tabs';

const DEMO_TABS: readonly TabItem[] = [
  { id: 'roadmap', label: 'Curriculum Roadmap', icon: '🗺️', count: 7 },
  { id: 'flashcards', label: '3D Flashcards', icon: '🃏', count: 42 },
  { id: 'quiz', label: 'Quiz Arena', icon: '🎯', count: 18 },
  { id: 'notes', label: 'Reference Notes', icon: '📝', disabled: true },
];

/**
 * WAI-ARIA tablist for multi-view workspaces, study suites, and dashboards.
 */
const meta: Meta<Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  render: (args) => ({
    props: {
      ...args,
      tabs: DEMO_TABS,
      selectedId: 'roadmap',
    },
    template: `
      <div style="padding: 1.5rem; max-width: 720px;">
        <ah-tabs
          [tabs]="tabs"
          [(selectedId)]="selectedId"
          [ariaLabel]="ariaLabel"
        />
        <div style="padding: 1.5rem 0;" class="ah-prose">
          <p>Active tab: <strong>{{ selectedId }}</strong></p>
        </div>
      </div>
    `,
  }),
  args: {
    tabs: DEMO_TABS,
    selectedId: 'roadmap',
    ariaLabel: 'Study Sections',
  },
};
export default meta;

export const Default: StoryObj<Tabs> = {};
