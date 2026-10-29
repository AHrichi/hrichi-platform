import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { FlipCard } from './flip-card';

/**
 * 3D double-sided interactive card for flashcards, drill cards, and dual-state displays.
 */
const meta: Meta<FlipCard> = {
  title: 'Display/FlipCard',
  component: FlipCard,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 580px; padding: 2rem;">
        <ah-flip-card
          [flipped]="flipped"
          [accent]="accent"
          [ariaLabel]="ariaLabel"
        >
          <div flip-front>
            <p class="ah-eyebrow">JavaScript • Closures</p>
            <h3 style="margin-top: 1rem;">What is a lexical closure in V8/JavaScript?</h3>
            <p class="ah-lead" style="margin-top: auto; font-size: 0.875rem;">(Click or press Space to reveal answer)</p>
          </div>
          <div flip-back>
            <p class="ah-eyebrow">Model Explanation</p>
            <p class="ah-prose" style="margin-top: 1rem;">
              A closure is the combination of a function bundled together with references to its surrounding lexical environment.
            </p>
            <p class="ah-lead" style="margin-top: auto; font-size: 0.875rem;">(Click or press Space to flip back)</p>
          </div>
        </ah-flip-card>
      </div>
    `,
  }),
  args: {
    flipped: false,
    accent: 'intermediate',
    ariaLabel: 'Closures Flashcard',
  },
};
export default meta;

export const Default: StoryObj<FlipCard> = {};

export const Flipped: StoryObj<FlipCard> = {
  args: {
    flipped: true,
    accent: 'expert',
  },
};
