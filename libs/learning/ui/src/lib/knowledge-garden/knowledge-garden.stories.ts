import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import type { GardenTheme } from '@ah/learning/domain';
import { type GardenPlant, KnowledgeGarden } from './knowledge-garden';

const plants: GardenPlant[] = [
  {
    key: 'econ',
    name: 'Economics',
    hidden: 0,
    wilting: 1,
    counts: '1 golden · 1 bloom · 1 leaf · 1 sprout · 1 seed',
    stemTop: 28,
    leaves: [
      {
        id: 'c1',
        title: 'Opportunity cost',
        tier: 'golden',
        wilting: false,
        x: 60,
        y: 116,
        side: -1,
      },
      {
        id: 'c2',
        title: 'Marginal utility',
        tier: 'bloom',
        wilting: false,
        x: 60,
        y: 100,
        side: 1,
      },
      {
        id: 'c3',
        title: 'Comparative advantage',
        tier: 'leaf',
        wilting: false,
        x: 60,
        y: 84,
        side: -1,
      },
      {
        id: 'c4',
        title: 'Sunk cost fallacy',
        tier: 'sprout',
        wilting: true,
        x: 60,
        y: 68,
        side: 1,
      },
      {
        id: 'c5',
        title: 'Deadweight loss',
        tier: 'seed',
        wilting: false,
        x: 60,
        y: 52,
        side: -1,
      },
    ],
  },
  {
    key: 'systems',
    name: 'Distributed Systems',
    hidden: 0,
    wilting: 0,
    counts: '1 bloom · 1 leaf',
    stemTop: 72,
    leaves: [
      {
        id: 's1',
        title: 'Consensus',
        tier: 'bloom',
        wilting: false,
        x: 60,
        y: 116,
        side: -1,
      },
      {
        id: 's2',
        title: 'Vector clocks',
        tier: 'leaf',
        wilting: false,
        x: 60,
        y: 100,
        side: 1,
      },
    ],
  },
];

interface Args {
  plants: GardenPlant[];
  theme: GardenTheme;
}

const meta: Meta<Args> = {
  title: 'Learning/Knowledge garden',
  decorators: [moduleMetadata({ imports: [KnowledgeGarden] })],
  parameters: { layout: 'padded' },
  argTypes: {
    theme: {
      control: 'inline-radio',
      options: ['meadow', 'autumn', 'night', 'aurora'],
    },
  },
  args: { plants, theme: 'meadow' },
  render: (args) => ({
    props: args,
    template: `<lrn-knowledge-garden [plants]="plants" [theme]="theme" />`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Meadow: Story = {};
export const Autumn: Story = { args: { theme: 'autumn' } };
export const Night: Story = { args: { theme: 'night' } };
export const Aurora: Story = { args: { theme: 'aurora' } };
export const Empty: Story = { args: { plants: [] } };
