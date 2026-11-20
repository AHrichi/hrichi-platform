import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 01.03: Back-of-the-Envelope Math (`napkin-math`).
 * Scenario: Sizing a photo-sharing app (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'napkin-math',
  learn: [
    'The latency ladder from RAM nanoseconds to WAN milliseconds',
    'How to convert DAU into average and peak RPS (÷ 100,000 s)',
    'How to estimate annual database and blob storage from writes',
    'How bandwidth and read/write ratios shape the architecture',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: '10M DAU',
        sublabel: 'Photo app',
      },
      {
        id: 'api',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Photo API',
        sublabel: 'How many?',
      },
    ],
    edges: [{ id: 'users-api', from: 'users', to: 'api', label: 'HTTPS' }],
    zones: [
      {
        id: 'app-zone',
        from: { x: 5, y: 2 },
        to: { x: 12, y: 7 },
        hue: 'amber',
        label: 'Capacity worksheet',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'dau', label: 'DAU', icon: 'user', value: '10M' },
    { id: 'avg-rps', label: 'Avg RPS', icon: 'gauge', value: '—' },
    { id: 'peak', label: 'Peak', icon: 'bolt', value: '—' },
    { id: 'storage-yr', label: 'Storage/yr', icon: 'database', value: '—' },
  ],
  steps: [
    {
      id: 'photo-pitch',
      label: 'The prompt',
      kind: 'problem',
      title: 'One server or a hundred? One disk or a petabyte?',
      body: [
        'You are designing a photo-sharing app for **10 million daily active users** (`10M DAU`). Before drawing boxes, you need to know whether the load fits on one database or demands a fleet.',
        'Back-of-the-envelope math turns user counts into **requests per second**, **storage**, and **bandwidth** in two minutes using rounded powers of ten.',
      ],
      ops: [{ op: 'update-node', id: 'api', patch: { state: 'focus' } }],
    },
    {
      id: 'latency-orders',
      label: 'Latency tiers',
      kind: 'technique',
      title: 'Memorise the four latency orders of magnitude',
      body: [
        'Exact benchmarks shift, but the tiers stay fixed: **RAM** takes `~100 ns`, **SSD read** takes `~100 µs` (`0.1 ms`), a **same-datacentre hop** takes `~0.5 ms`, and a **cross-continent round trip** takes `~150 ms`.',
        'Reading from memory is roughly **1,000× faster** than local SSD and **1,000,000× faster** than crossing an ocean.',
      ],
      changes: [{ type: 'added', text: 'Latency ladder note (ns → µs → ms)' }],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'latency-ladder',
            anchor: { at: { x: 2, y: 1 } },
            text: 'Latency ladder',
            tone: 'info',
            icon: 'timer',
            rows: [
              ['RAM read', '0.1 µs'],
              ['SSD read', '0.1 ms'],
              ['Same-DC hop', '0.5 ms'],
              ['Cross-region', '150 ms'],
            ],
          },
        },
      ],
      learns: [0],
    },
    {
      id: 'dau-to-rps',
      label: 'DAU to RPS',
      kind: 'technique',
      title: 'Divide daily actions by 100,000 seconds',
      body: [
        'A day has `86,400` seconds—round it to **`100,000` (`10⁵`)** for mental math. Suppose each of our `10M DAU` views **20 photos** (`200M reads/day`) and uploads **1 photo** (`10M writes/day`).',
        'Dividing by `100,000` gives **`2,000` read RPS** and **`100` write RPS**: **2,100 Avg RPS** with a **20:1 read/write ratio**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: '100,000 requests/day ≈ 1 RPS. 10M actions/day ≈ 100 RPS.',
        },
      ],
      ops: [
        {
          op: 'packet',
          edge: 'users-api',
          kind: 'request',
          count: 3,
          label: '2,000 R / 100 W',
          wave: 0,
        },
        { op: 'set-metric', id: 'avg-rps', value: '2,100' },
      ],
      learns: [1],
    },
    {
      id: 'peak-headroom',
      label: 'Peak factor',
      kind: 'technique',
      title: 'Multiply average RPS by 3× for daily peaks',
      body: [
        'Users do not upload evenly at 4:00 AM. Evening prime time and weekend spikes typically reach **2× to 5×** the daily average; use **3×** as a standard baseline.',
        'At `2,100 × 3 = 6,300 Peak RPS`, one app server (~1,000 RPS ceiling) is not enough: place a **load balancer** in front of an 8–10 server pool.',
      ],
      changes: [
        { type: 'added', text: 'Load balancer in front of the Photo API pool' },
        { type: 'changed', text: 'Peak metric set to 6,300 RPS' },
      ],
      ops: [
        { op: 'remove-edge', id: 'users-api' },
        {
          op: 'add-node',
          node: {
            id: 'lb',
            kind: 'load-balancer',
            at: { x: 4, y: 4 },
            label: 'Load balancer',
            sublabel: '6,300 peak RPS',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'api',
          patch: {
            at: { x: 7, y: 4 },
            sublabel: '10 instances',
            state: 'normal',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'users-lb', from: 'users', to: 'lb', label: '6.3k RPS' },
        },
        {
          op: 'add-edge',
          edge: { id: 'lb-api', from: 'lb', to: 'api', label: '630 RPS ea' },
        },
        { op: 'packet', edge: 'users-lb', kind: 'request', count: 3, wave: 0 },
        { op: 'packet', edge: 'lb-api', kind: 'request', count: 3, wave: 1 },
        { op: 'set-metric', id: 'peak', value: '6,300 RPS' },
      ],
    },
    {
      id: 'storage-year',
      label: 'Storage math',
      kind: 'technique',
      title: 'Size storage from writes: metadata vs blobs',
      body: [
        'Only writes add new data. With **10M uploads/day**:',
        '• **Metadata row** (`~1 KB` each): `10M × 1 KB = 10 GB/day ≈ 3.6 TB/year`—easily fits on one relational **Database**.\n• **Photo file** (`~2 MB` each): `10M × 2 MB = 20 TB/day ≈ 7.3 PB/year`—belongs in distributed **Object storage**.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Metadata DB (3.6 TB/yr) and Object storage (7.3 PB/yr)',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'meta-db',
            kind: 'database',
            at: { x: 10, y: 3 },
            label: 'Metadata DB',
            sublabel: '3.6 TB/yr',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'blob-store',
            kind: 'storage',
            at: { x: 10, y: 6 },
            label: 'Photo blobs',
            sublabel: '7.3 PB/yr',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'api-db', from: 'api', to: 'meta-db', label: '1 KB row' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-blobs',
            from: 'api',
            to: 'blob-store',
            label: '2 MB file',
          },
        },
        { op: 'packet', edge: 'api-db', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'api-blobs', kind: 'write', wave: 0 },
        { op: 'set-metric', id: 'storage-yr', value: '7.3 PB' },
      ],
      learns: [2],
    },
    {
      id: 'bandwidth',
      label: 'Bandwidth',
      kind: 'case',
      title: '1.8 GB/s of photo reads demands a CDN',
      body: [
        'Multiply RPS by payload size to get **bandwidth**. Peak uploads are `300 RPS × 2 MB = 600 MB/s` ingress. Peak views of `300 KB` compressed thumbnails are `6,000 RPS × 300 KB = 1.8 GB/s` (`14.4 Gbps`) egress.',
        'Serving `1.8 GB/s` straight from origin servers is expensive and slow; adding a **CDN** offloads 90% of photo reads at the edge.',
      ],
      changes: [
        {
          type: 'added',
          text: 'CDN edge cache absorbing 1.8 GB/s of photo reads',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'cdn',
            kind: 'cdn',
            at: { x: 4, y: 6 },
            label: 'Edge CDN',
            sublabel: '1.8 GB/s egress',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'users-cdn',
            from: 'users',
            to: 'cdn',
            label: '300 KB img',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'cdn-blobs',
            from: 'cdn',
            to: 'blob-store',
            label: 'misses',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'users-cdn',
          kind: 'response',
          reverse: true,
          count: 3,
          label: '90% hit',
          wave: 0,
        },
      ],
      learns: [3],
    },
    {
      id: 'sanity-check',
      label: 'Sanity checks',
      kind: 'watch-out',
      title: 'Watch your units: Bytes vs bits and powers',
      body: [
        'Two slips ruin more estimates than bad formulas: mixing **Bytes (`B`)** with **bits (`b`, divide by 8)**, and losing three zeros between **MB (`10⁶`)**, **GB (`10⁹`)**, **TB (`10¹²`)**, and **PB (`10¹⁵`)**.',
        'Keep numbers in scientific notation or named tiers (`10M × 2 MB = 20 × 10¹² B = 20 TB`), and round to one or two significant figures.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: '1 GB/s of payload is 8 Gbps on a network card. Always label B (Bytes) vs b (bits).',
        },
      ],
      ops: [
        { op: 'update-node', id: 'lb', patch: { state: 'normal' } },
        { op: 'update-node', id: 'meta-db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'blob-store', patch: { state: 'normal' } },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Numbers turn guesses into architecture',
      body: [
        'In five lines of arithmetic we proved why metadata fits on one SQL database (`3.6 TB/yr`), why photos belong in object storage (`7.3 PB/yr`), and why a `20:1` read-heavy media workload needs a CDN.',
      ],
      ops: [
        { op: 'remove-note', id: 'latency-ladder' },
        { op: 'update-node', id: 'cdn', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'napkin-summary',
            anchor: { at: { x: 2, y: 1 } },
            text: '10M DAU photo app',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Avg / Peak RPS', '2,100 / 6,300'],
              ['Read : Write', '20 : 1'],
              ['Metadata / yr', '3.6 TB (SQL)'],
              ['Blobs / yr', '7.3 PB (Object)'],
            ],
            total: ['Peak egress', '1.8 GB/s → CDN'],
          },
        },
      ],
      takeaways: [
        'Use 100,000 seconds/day (10⁵) to convert daily actions into average RPS, then multiply by ~3× for peak',
        'Size storage from daily writes × item size × 365 days, separating small metadata rows from large media blobs',
        'Compute bandwidth as RPS × payload size and watch Bytes (B) vs bits (b = B × 8)',
        'Let the read/write ratio and latency ladder guide where caches and CDNs sit',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-dau-to-rps',
      kind: 'numeric',
      prompt:
        'A service has 5 million DAU, and each user makes 20 requests per day. Using 100,000 seconds/day, what is the average RPS?',
      unit: 'RPS',
      answer: 1000,
      tolerance: 0.16,
      explain:
        '5,000,000 × 20 = 100,000,000 requests/day. Divided by 100,000 s/day = 1,000 RPS (exact 86,400 s/day gives ~1,157 RPS).',
      step: 'dau-to-rps',
    },
    {
      id: 'numeric-annual-storage',
      kind: 'numeric',
      prompt:
        'Users create 2 million records per day, each 5 KB in size. Roughly how many gigabytes (GB) are written per day?',
      unit: 'GB/day',
      answer: 10,
      tolerance: 0.05,
      explain: '2 × 10⁶ records × 5 × 10³ B = 10 × 10⁹ B = 10 GB per day.',
      step: 'storage-year',
    },
    {
      id: 'order-latency-tiers',
      kind: 'order',
      prompt:
        'Order these operations from fastest (lowest latency) to slowest.',
      items: [
        'Read from main memory (RAM)',
        'Random read from local NVMe SSD',
        'Round trip inside the same data centre',
        'Cross-continent internet round trip',
      ],
      explain:
        'RAM is ~100 ns, local SSD is ~100 µs (0.1 ms), same-DC network is ~0.5 ms, and cross-continent fiber is ~150 ms.',
      step: 'latency-orders',
    },
    {
      id: 'choice-storage-split',
      kind: 'choice',
      prompt:
        'Why did the back-of-the-envelope estimate split metadata (3.6 TB/yr) from photo files (7.3 PB/yr)?',
      options: [
        'Small structured rows fit a fast indexed database, while multi-petabyte immutable blobs belong in object storage behind a CDN',
        'Relational databases cannot store numbers larger than 1 MB',
        'Object storage automatically compresses 2 MB files down to 1 KB',
      ],
      answer: 0,
      explain:
        'Keeping multi-megabyte blobs out of the relational database keeps indexes compact in RAM and lets object storage + CDN serve high-bandwidth media.',
      step: 'storage-year',
    },
  ],
  cards: [
    {
      front:
        'What shortcut converts daily requests into average requests per second (RPS)?',
      back: 'Divide daily requests by 100,000 seconds/day (86,400 rounded to 10⁵). 100,000/day ≈ 1 RPS; 10M/day ≈ 100 RPS.',
    },
    {
      front: 'What are the four key latency numbers by order of magnitude?',
      back: '• RAM read: ~100 ns (0.1 µs)\n• Local SSD read: ~100 µs (0.1 ms)\n• Same-datacentre round trip: ~0.5 ms\n• Cross-continent round trip: ~150 ms',
    },
    {
      front: 'How do you estimate annual storage growth?',
      back: 'Daily writes × average item size × 365 days (separating small database metadata rows from large blob/media files).',
    },
    {
      front:
        'How do you convert payload bandwidth in MB/s to network link speed in Gbps?',
      back: 'Multiply Bytes by 8 to get bits (1 GB/s = 8 Gbps; 125 MB/s = 1 Gbps).',
    },
  ],
} satisfies Lesson;
