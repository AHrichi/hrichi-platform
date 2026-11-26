import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Coachmark } from './coachmark';

/**
 * One step of a guided tour. The tour host places it next to what it points
 * at; here it sits in a padded frame so its pointer shows.
 */
const meta: Meta<Coachmark> = {
  title: 'Feedback/Coachmark',
  component: Coachmark,
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="padding: 1.5rem; max-inline-size: 26rem">${story}</div>`,
    ),
  ],
  args: {
    heading: 'Your projects',
    body: 'Each greenhouse is a project: its house, climate and crop, and every result you save from the tools.',
    step: 2,
    total: 8,
    progress: 'Step 2 of 8',
    side: 'block-end',
    arrow: 48,
    next: fn(),
    back: fn(),
    dismiss: fn(),
  },
};
export default meta;

type Story = StoryObj<Coachmark>;

/** Below its target: the pointer on the top edge. */
export const Below: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(args.next).toHaveBeenCalled();
    await expect(
      canvas.getByRole('dialog', { name: 'Your projects Step 2 of 8' }),
    ).toBeInTheDocument();
  },
};

export const Above: Story = { args: { side: 'block-start', arrow: 200 } };

export const Beside: Story = { args: { side: 'inline-end', arrow: 40 } };

/** The first step has no Back; there is no target, so no pointer. */
export const Welcome: Story = {
  args: {
    heading: 'Welcome to SerraCalc',
    body: 'A two-minute tour of the app: projects, the tools, saving results and working offline.',
    step: 1,
    progress: 'Step 1 of 8',
    side: 'center',
  },
};

/** The last step says Finish. */
export const LastStep: Story = {
  args: {
    heading: 'Take the tour again',
    body: 'The wand in the header starts this tour whenever you like.',
    step: 8,
    progress: 'Step 8 of 8',
    side: 'block-end',
    arrow: 300,
  },
};

/** Right to left, the pointer and the buttons follow the reading side. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator(
      (story) => `<div dir="rtl" lang="ar">${story}</div>`,
    ),
  ],
  args: {
    heading: 'مشاريعك',
    body: 'كل بيت محمي مشروع: هيكله ومناخه ومحصوله وكل نتيجة تحفظها من الأدوات.',
    progress: 'الخطوة 2 من 8',
    labels: {
      next: 'التالي',
      back: 'السابق',
      finish: 'إنهاء',
      close: 'إغلاق الجولة',
    },
  },
};
