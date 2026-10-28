import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { Tooltip } from './tooltip';

/**
 * Concept and formula tooltip with keyboard tab focus, ARIA tooltip bindings,
 * and high contrast dark/light theme elevation.
 */
const meta: Meta<Tooltip> = {
  title: 'Display/Tooltip',
  component: Tooltip,
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 4rem 2rem; display: flex; justify-content: center;">
        <p class="ah-prose">
          The monthly variance is measured against the
          <ah-tooltip
            [title]="title"
            [body]="body"
            [formula]="formula"
            [meaning]="meaning"
            [position]="position"
          >
            Planned Budget Target
          </ah-tooltip>
          set during quarterly allocation.
        </p>
      </div>
    `,
  }),
  args: {
    title: 'Planned Budget Target',
    body: 'The agreed ceiling or baseline spend allocated at the start of each fiscal month.',
    formula: 'Variance = Actual Spend - Planned Spend',
    meaning: 'Negative variance on expenses indicates favorable savings.',
    position: 'top',
  },
};
export default meta;

export const Default: StoryObj<Tooltip> = {};

export const TechnicalDefinition: StoryObj<Tooltip> = {
  args: {
    title: 'withEntities() Normalization',
    body: 'Pre-packaged NgRx SignalStore extension managing a normalized state collection with entity IDs.',
    formula: '{ ids: EntityId[], entities: Record<EntityId, Entity> }',
    meaning:
      'Guarantees O(1) lookups and prevents duplicated entity instances in memory.',
    position: 'top',
  },
};

export const BottomPlacement: StoryObj<Tooltip> = {
  args: {
    title: 'FIFO Ring Buffer',
    body: 'Fixed-size rolling buffer discarding the oldest item when capacity is reached.',
    formula: 'Buffer Size <= 30 Messages',
    meaning: 'Guarantees the free-tier MongoDB database is never overloaded.',
    position: 'bottom',
  },
};
