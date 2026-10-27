import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { constellation } from '@ah/three/constellation';
import { SceneHost } from './scene-host';

interface Args {
  highlight: string;
}

/**
 * `<ah-scene>` hosting the home page's constellation. Without WebGL (as in
 * the accessibility checks in CI) the projected fallback stays in place.
 */
const meta: Meta<Args> = {
  // Not '3D/…': Storybook names an element after the story id, and element
  // names can't start with a digit.
  title: 'Scenes/SceneHost',
  // A moving scene has no stable screenshot; axe still checks it (ADR-0015).
  tags: ['animated'],
  decorators: [moduleMetadata({ imports: [SceneHost] })],
  argTypes: {
    highlight: {
      control: 'select',
      options: constellation.nodes.map((node) => node.id),
    },
  },
  args: { highlight: 'shell' },
  render: (args) => ({
    props: {
      ...args,
      load: () =>
        import('@ah/three/scenes/constellation').then(
          (m) => m.constellationScene,
        ),
    },
    template: `
      <ah-scene
        essential
        [load]="load"
        [params]="{ highlight: highlight }"
        style="display: block; aspect-ratio: 4 / 3; max-inline-size: 40rem; border-radius: var(--radius-lg); background: var(--color-stage-bg)"
      >
        <p style="margin: 0; padding: var(--space-5); color: var(--color-stage-muted)">
          WebGL isn't available here, so the scene stays off and this text shows.
        </p>
      </ah-scene>
    `,
  }),
};
export default meta;

export const Constellation: StoryObj<Args> = {};
