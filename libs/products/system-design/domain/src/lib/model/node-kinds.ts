import type { IconName } from './icons';
import type { Hue, NodeKind } from './scene';

export type NodeShape =
  'device' | 'cube' | 'cylinder' | 'stack' | 'globe' | 'person' | 'disk';

export interface NodeKindInfo {
  shape: NodeShape;
  hue: Hue;
  icon: IconName;
  /** The default label. */
  label: string;
}

/** How each kind of component is drawn. `red` is reserved for hot and down states. */
export const NODE_KINDS: Readonly<Record<NodeKind, NodeKindInfo>> = {
  client: { shape: 'device', hue: 'neutral', icon: 'laptop', label: 'Client' },
  phone: { shape: 'device', hue: 'neutral', icon: 'phone', label: 'Phone' },
  user: { shape: 'person', hue: 'neutral', icon: 'user', label: 'You' },
  external: {
    shape: 'globe',
    hue: 'neutral',
    icon: 'cloud',
    label: 'External API',
  },
  dns: { shape: 'cube', hue: 'amber', icon: 'globe', label: 'DNS resolver' },
  storage: {
    shape: 'disk',
    hue: 'amber',
    icon: 'file',
    label: 'Object storage',
  },
  cdn: { shape: 'globe', hue: 'teal', icon: 'globe', label: 'CDN' },
  'load-balancer': {
    shape: 'cube',
    hue: 'teal',
    icon: 'route',
    label: 'Load balancer',
  },
  gateway: { shape: 'cube', hue: 'teal', icon: 'shield', label: 'API gateway' },
  server: { shape: 'cube', hue: 'blue', icon: 'server', label: 'Web server' },
  service: { shape: 'cube', hue: 'blue', icon: 'layers', label: 'Service' },
  worker: { shape: 'cube', hue: 'blue', icon: 'gear', label: 'Worker' },
  scheduler: {
    shape: 'cube',
    hue: 'blue',
    icon: 'clock',
    label: 'Scheduler',
  },
  database: {
    shape: 'cylinder',
    hue: 'violet',
    icon: 'database',
    label: 'Database',
  },
  replica: {
    shape: 'cylinder',
    hue: 'violet',
    icon: 'database',
    label: 'Replica',
  },
  search: {
    shape: 'cylinder',
    hue: 'violet',
    icon: 'search',
    label: 'Search index',
  },
  cache: { shape: 'cylinder', hue: 'green', icon: 'bolt', label: 'Cache' },
  queue: { shape: 'stack', hue: 'rose', icon: 'queue', label: 'Queue' },
  stream: { shape: 'stack', hue: 'rose', icon: 'stack', label: 'Event stream' },
};
