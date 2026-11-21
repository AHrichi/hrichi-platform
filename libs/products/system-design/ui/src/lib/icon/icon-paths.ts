import type { IconName } from '@ah/products/system-design/domain';

/**
 * Original 24×24 line-icon path definitions (1.75 stroke, round caps/joins).
 * Colours are applied via CSS classes (`stroke: currentColor; fill: none`),
 * never via inline SVG `fill` or `stroke` attributes.
 */
export const ICON_PATHS: Readonly<Record<IconName, readonly string[]>> = {
  laptop: ['M4 6h16v10H4z', 'M2 18h20'],
  phone: [
    'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M11 18h2',
  ],
  user: ['M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M5 20a7 7 0 0 1 14 0'],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M3.5 12h17',
    'M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z',
  ],
  server: ['M4 5h16v5H4z', 'M4 14h16v5H4z', 'M7 7.5h1.5', 'M7 16.5h1.5'],
  database: [
    'M12 8c4.42 0 8-1.34 8-3s-3.58-3-8-3-8 1.34-8 3 3.58 3 8 3z',
    'M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5',
    'M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3',
  ],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
  queue: ['M3 7h15v10H3z', 'M8 7v10', 'M13 7v10', 'M18 12h3'],
  lock: ['M8 11V7a4 4 0 0 1 8 0v4', 'M5 11h14v10H5z', 'M12 15v2'],
  key: ['M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 11h9v3', 'M17 11v3'],
  shield: ['M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z'],
  chart: ['M4 4v16h16', 'M7 16l4-5 3 3 5-7'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  cloud: [
    'M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.8 8.5 3.5 3.5 0 0 0 7 18z',
  ],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M16.5 16.5L21 21'],
  gear: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M12 2v3',
    'M12 19v3',
    'M2 12h3',
    'M19 12h3',
    'M4.9 4.9l2.1 2.1',
    'M17 17l2.1 2.1',
    'M19.1 4.9L17 7',
    'M7 17l-2.1 2.1',
  ],
  hash: ['M5 9h14', 'M5 15h14', 'M10 4L8 20', 'M16 4l-2 16'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  route: ['M4 12h6l4-6h6', 'M10 12l4 6h6', 'M18 4l2 2-2 2', 'M18 16l2 2-2 2'],
  layers: [
    'M12 3l9 4.5-9 4.5-9-4.5L12 3z',
    'M3 12l9 4.5 9-4.5',
    'M3 16.5L12 21l9-4.5',
  ],
  gauge: ['M4 17a8 8 0 1 1 16 0', 'M12 17l4-6', 'M9 17h6'],
  warning: ['M12 3l9.5 17h-19L12 3z', 'M12 10v4', 'M12 17h.5'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  timer: [
    'M12 21a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z',
    'M10 3h4',
    'M12 10v4l2.5 1.5',
  ],
  download: ['M12 4v11', 'M8 11l4 4 4-4', 'M4 19h16'],
  link: [
    'M10 14a4 4 0 0 1 0-6l2-2a4 4 0 0 1 5.66 5.66l-1 1',
    'M14 10a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-5.66-5.66l1-1',
  ],
  stack: ['M4 6h16v3H4z', 'M4 11h16v3H4z', 'M4 16h16v3H4z'],
};
