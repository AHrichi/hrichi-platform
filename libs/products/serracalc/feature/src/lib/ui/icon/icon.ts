import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Line icons on a 24 × 24 grid, drawn with the text colour. */
const ICONS = {
  projects: [
    'M12 3 2.5 8 12 13l9.5-5L12 3Z',
    'M2.5 12.5 12 17.5l9.5-5',
    'M2.5 16.5 12 21.5l9.5-5',
  ],
  site: ['M3 5h18v14H3Z', 'M9 5v14', 'M15 5v14', 'M3 12h18'],
  calendar: [
    'M4 6h16v14H4Z',
    'M4 10h16',
    'M8 3v4',
    'M16 3v4',
    'M8 14h2',
    'M14 14h2',
    'M8 17h2',
  ],
  greenhouse: ['M3 20V10l4.5-5L12 10l4.5-5L21 10v10Z', 'M12 10v10', 'M3 15h18'],
  heating: [
    'M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.3 2.4-5 3.5-8 1.4 1.4 2 2.8 2 4.5 1.2-.8 2-2.2 2.2-4 2.6 2 5.3 4.6 5.3 7.5 0 3.4-2.6 6-6.5 6Z',
  ],
  cooling: ['M3 8h11a3 3 0 1 0-3-3', 'M3 12h16a3 3 0 1 1-3 3', 'M3 16h7'],
  water: ['M12 3.5c3.6 4.3 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.4-6.2 6-10.5Z'],
  air: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    'M12 2.5V5',
    'M12 19v2.5',
    'M2.5 12H5',
    'M19 12h2.5',
    'M5.3 5.3l1.8 1.8',
    'M16.9 16.9l1.8 1.8',
    'M5.3 18.7l1.8-1.8',
    'M16.9 7.1l1.8-1.8',
  ],
  energy: ['M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z'],
  economics: ['M4 20h16', 'M5 16l4.5-4.5 3 3L18 9', 'M14.5 9H18v3.5'],
  operations: [
    'M9 3.5h6V7H9Z',
    'M7 5.25H5V21h14V5.25h-2',
    'M8.5 13.5l2.2 2.2 4.8-4.8',
  ],
  data: ['M3 12h4l2.5-6 5 12 2.5-6h4'],
  climate: ['M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z', 'M12 9v8'],
  report: ['M6 3h9l3 3v15H6Z', 'M14.5 3v3.5H18', 'M9 12h6', 'M9 16h6'],
  guide: [
    'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Z',
    'M5 19.5A1.5 1.5 0 0 0 6.5 21H19',
  ],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  science: [
    'M9 3h6',
    'M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3',
    'M7 15h10',
  ],
  sunlight: [
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'M12 3v18',
    'M12 7h5',
    'M12 11h8',
    'M12 15h7',
  ],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z'],
  fog: ['M3 8h12', 'M18 8h3', 'M6 12h15', 'M3 16h10', 'M16 16h2'],
  alert: ['M12 3.5 2.5 20h19L12 3.5Z', 'M12 10v4.5', 'M12 17.5h.01'],
  check: ['M4.5 12.5l5 5 10-11'],
  chevron: ['M6 9.5l6 6 6-6'],
  globe: [
    'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
    'M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z',
    'M3.6 9h16.8',
    'M3.6 15h16.8',
  ],
  sigma: ['M18 5H6l6 7-6 7h12'],
  wave: [
    'M2.5 9c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2',
    'M2.5 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2',
  ],
  leaf: ['M5 19c0-8 5-14 15-14 0 10-6 15-14 15', 'M5 19l7-7'],
  offline: ['M12 20h.01', 'M8.5 16.5a5 5 0 0 1 7 0', 'M5 13a10 10 0 0 1 14 0'],
} as const;

export type IconName = keyof typeof ICONS;

/** A decorative line icon; the text beside it says what it means. */
@Component({
  selector: 'sc-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      inline-size: 1.25em;
      block-size: 1.25em;
    }

    svg {
      inline-size: 100%;
      block-size: 100%;
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  protected readonly paths = computed(() => ICONS[this.name()]);
}
