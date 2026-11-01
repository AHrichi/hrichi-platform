import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { HeatmapGrid } from './heatmap-grid';

const hours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

/**
 * Accessible 2D activity heatmap matrix with 5-level intensity scaling
 * and live cell readout.
 */
const meta: Meta<HeatmapGrid> = {
  title: 'Display/HeatmapGrid',
  component: HeatmapGrid,
  args: {
    colLabels: hours,
    cornerLabel: 'Day \\ Hr',
    unitLabel: 'msgs',
    rows: [
      {
        label: 'Monday',
        shortLabel: 'Mon',
        values: [
          0, 0, 0, 0, 0, 0, 1, 3, 8, 12, 6, 4, 9, 5, 3, 6, 8, 11, 14, 19, 24,
          18, 9, 2,
        ],
      },
      {
        label: 'Tuesday',
        shortLabel: 'Tue',
        values: [
          1, 0, 0, 0, 0, 0, 0, 2, 6, 9, 7, 5, 8, 6, 4, 5, 9, 13, 17, 22, 28, 15,
          7, 3,
        ],
      },
      {
        label: 'Wednesday',
        shortLabel: 'Wed',
        values: [
          0, 0, 0, 0, 0, 0, 1, 4, 7, 10, 8, 6, 7, 4, 5, 7, 10, 12, 16, 20, 25,
          19, 11, 4,
        ],
      },
      {
        label: 'Thursday',
        shortLabel: 'Thu',
        values: [
          2, 0, 0, 0, 0, 0, 0, 3, 5, 8, 6, 7, 11, 8, 6, 8, 12, 15, 19, 26, 31,
          22, 14, 5,
        ],
      },
      {
        label: 'Friday',
        shortLabel: 'Fri',
        values: [
          3, 1, 0, 0, 0, 0, 0, 2, 4, 7, 5, 8, 10, 9, 7, 10, 14, 18, 24, 30, 36,
          29, 18, 9,
        ],
      },
      {
        label: 'Saturday',
        shortLabel: 'Sat',
        values: [
          6, 3, 1, 0, 0, 0, 0, 0, 2, 5, 9, 14, 16, 15, 12, 14, 17, 21, 25, 29,
          34, 27, 19, 11,
        ],
      },
      {
        label: 'Sunday',
        shortLabel: 'Sun',
        values: [
          4, 2, 0, 0, 0, 0, 0, 1, 3, 6, 10, 13, 15, 12, 11, 13, 16, 20, 26, 32,
          38, 24, 12, 3,
        ],
      },
    ],
  },
};
export default meta;

export const Default: StoryObj<HeatmapGrid> = {};
