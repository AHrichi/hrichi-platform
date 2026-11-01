import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { ScrollHint } from './scroll-hint';

/**
 * A sideways-scrolling row that says so: a fading edge and a chevron on each
 * side with more to see, and one small nudge when it first comes into view.
 */
const meta: Meta<ScrollHint> = {
  title: 'Navigation/ScrollHint',
  component: ScrollHint,
  // The nudge moves the row once, so screenshots would never settle.
  tags: ['animated'],
  decorators: [moduleMetadata({ imports: [ScrollHint] })],
  render: () => ({
    template: `
      <nav aria-label="Sections" style="max-inline-size: 22rem">
        <ul
          ahScrollHint
          role="list"
          style="display: flex; gap: var(--space-2); overflow-x: auto;
            scrollbar-width: none; margin: 0; padding: var(--space-1);
            list-style: none"
        >
          @for (item of items; track item) {
            <li style="flex: none">
              <a href="#" class="ah-button ah-button--secondary ah-button--sm">{{ item }}</a>
            </li>
          }
        </ul>
      </nav>
    `,
    props: {
      items: [
        'Projects',
        'Calculators',
        'Camera',
        'Plumb check',
        'Concrete',
        'Map',
        'Standards',
        'Materials',
      ],
    },
  }),
};
export default meta;

export const OverflowingRow: StoryObj<ScrollHint> = {};
