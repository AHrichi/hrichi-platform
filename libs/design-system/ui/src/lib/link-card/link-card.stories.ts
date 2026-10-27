import { provideRouter } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { LinkCard } from './link-card';

/** The title is the only link, stretched over the card: one link for screen readers. */
const meta: Meta<LinkCard> = {
  title: 'Display/LinkCard',
  component: LinkCard,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  render: (args) => ({
    props: args,
    template: `
      <ul class="ah-grid" role="list" style="max-inline-size: 24rem">
        <li><ah-link-card [heading]="heading" [href]="href" [eyebrow]="eyebrow" [summary]="summary" [tags]="tags" /></li>
      </ul>
    `,
  }),
  args: {
    heading: 'A plug-and-play integration platform',
    href: '/work/schema-driven-integrations',
    eyebrow: 'Case study',
    summary:
      'JSON-schema forms and connectors that turned weeks of integration work into configuration.',
    tags: ['Angular', 'Nx', 'NestJS', 'JSON Schema'],
  },
};
export default meta;

export const Default: StoryObj<LinkCard> = {};
export const WithoutTags: StoryObj<LinkCard> = {
  args: { tags: [], eyebrow: undefined },
};
