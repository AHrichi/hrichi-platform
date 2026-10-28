import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { Modal } from './modal';
import { AhButton } from '../button/button';

/**
 * Modal dialog with accessible backdrop, ARIA attributes, escape key
 * listener, and responsive size configurations.
 */
const meta: Meta<Modal> = {
  title: 'Layout/Modal',
  component: Modal,
  decorators: [moduleMetadata({ imports: [AhButton] })],
  render: (args) => ({
    props: {
      ...args,
      open: true,
    },
    template: `
      <div>
        <p class="ah-prose" style="padding: 2rem;">
          Background content behind the modal. When the modal is open,
          the backdrop dims the viewport and traps focus.
        </p>

        <ah-modal
          [open]="true"
          [title]="title"
          [eyebrow]="eyebrow"
          [size]="size"
          [closeOnBackdrop]="closeOnBackdrop"
        >
          <p class="ah-prose">
            Confirm dispatch assignment for Van #4 (Driver: Tariq Ali) covering
            Central London hotels (Savoy, Dorchester, Rosewood).
          </p>

          <div modal-actions>
            <button type="button" ahButton="secondary" size="sm">Cancel</button>
            <button type="button" ahButton="primary" size="sm">Confirm Dispatch</button>
          </div>
        </ah-modal>
      </div>
    `,
  }),
  args: {
    title: 'Confirm Fleet Route',
    eyebrow: 'Driver Dispatch',
    size: 'md',
    closeOnBackdrop: true,
  },
};
export default meta;

export const Default: StoryObj<Modal> = {};

export const SmallConfirmation: StoryObj<Modal> = {
  args: {
    title: 'Prune Completed Orders?',
    eyebrow: 'Database Quota Guard',
    size: 'sm',
  },
};

export const LargeDataEntry: StoryObj<Modal> = {
  args: {
    title: 'Record Proof of Delivery (POD)',
    eyebrow: 'Hospitality Check-in',
    size: 'lg',
  },
};
