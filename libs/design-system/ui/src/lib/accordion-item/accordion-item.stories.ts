import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { AccordionItem } from './accordion-item';
import { Badge } from '../badge/badge';
import { AhButton } from '../button/button';

/**
 * Accordion item disclosure container for branching curriculum roadmaps,
 * FAQ sections, or collapsible audit cards.
 */
const meta: Meta<AccordionItem> = {
  title: 'Layout/AccordionItem',
  component: AccordionItem,
  decorators: [moduleMetadata({ imports: [Badge, AhButton] })],
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 720px; padding: 1.5rem;">
        <ah-accordion-item
          [title]="title"
          [subtitle]="subtitle"
          [icon]="icon"
          [expanded]="expanded"
          [disabled]="disabled"
        >
          <div accordion-meta>
            <ah-badge variant="success" [dot]="true">4 Sections</ah-badge>
          </div>
          <div accordion-actions>
            <button type="button" ahButton="secondary" size="sm">Action</button>
          </div>
          <p class="ah-prose">
            Detailed content inside the accordion region. Expands smoothly with accessible
            WAI-ARIA aria-expanded and region attributes.
          </p>
        </ah-accordion-item>
      </div>
    `,
  }),
  args: {
    title: 'Branch 1: JavaScript Fundamentals',
    subtitle: 'Scope, Types, Closures, Execution Context & Primitives',
    icon: '⚡',
    expanded: true,
    disabled: false,
  },
};
export default meta;

export const Default: StoryObj<AccordionItem> = {};

export const Collapsed: StoryObj<AccordionItem> = {
  args: {
    expanded: false,
  },
};

export const Disabled: StoryObj<AccordionItem> = {
  args: {
    title: 'Branch 4: Advanced Metaprogramming (Locked)',
    subtitle: 'Complete Branch 1–3 to unlock this branch',
    disabled: true,
    expanded: false,
    icon: '🔒',
  },
};
