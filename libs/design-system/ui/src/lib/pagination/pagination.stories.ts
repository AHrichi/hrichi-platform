import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { Pagination } from './pagination';

interface Args {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  compact: boolean;
}

const meta: Meta<Args> = {
  title: 'Navigation/Pagination',
  decorators: [moduleMetadata({ imports: [Pagination] })],
  args: { totalItems: 248, pageSize: 25, currentPage: 4, compact: false },
  render: (args) => ({
    props: args,
    template: `
      <ah-pagination
        [totalItems]="totalItems"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        [compact]="compact"
        itemLabel="poles"
        (pageChange)="currentPage = $event"
        (pageSizeChange)="pageSize = $event"
      />
    `,
  }),
};
export default meta;

export const Default: StoryObj<Args> = {};

export const Compact: StoryObj<Args> = { args: { compact: true } };

export const SinglePage: StoryObj<Args> = { args: { totalItems: 8 } };
