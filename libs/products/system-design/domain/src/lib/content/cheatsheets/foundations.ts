import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 01 (Foundations) cheatsheet:
 * Latency numbers, powers of two, nines table, RPS conversion, and core patterns.
 */
export const cheatsheet = {
  module: 'foundations',
  intro:
    'Quick-reference numbers for back-of-the-envelope sizing, request latency breakdown, queueing headroom, and availability math.',
  sections: [
    {
      kind: 'numbers',
      title: 'Latency Numbers by Order of Magnitude',
      rows: [
        ['L1 / L2 cache reference', '1 – 4 ns', 'On-core CPU cache'],
        ['Main memory (RAM) read', '100 ns (0.1 µs)', 'Fast in-memory lookup'],
        ['TLS 1.3 / TCP handshake', '1 – 2 × RTT', 'Pure network round trips'],
        [
          'Random read from NVMe SSD',
          '100 µs (0.1 ms)',
          '1,000× slower than RAM',
        ],
        ['Same-datacentre round trip', '0.5 ms (500 µs)', 'Private LAN hop'],
        ['Indexed SQL point query', '1 – 5 ms', 'Warm buffer pool + index'],
        ['Cross-continent round trip', '150 ms', 'US ↔ Europe / Asia fiber'],
      ],
    },
    {
      kind: 'table',
      title: 'Powers of Two & Storage Units',
      columns: ['Power', 'Exact value', 'Approx', 'Unit'],
      rows: [
        ['2¹⁰', '1,024', '10³ (thousand)', '1 KB (Kilobyte)'],
        ['2²⁰', '1,048,576', '10⁶ (million)', '1 MB (Megabyte)'],
        ['2³⁰', '1,073,741,824', '10⁹ (billion)', '1 GB (Gigabyte)'],
        ['2⁴⁰', '1.099 × 10¹²', '10¹² (trillion)', '1 TB (Terabyte)'],
        ['2⁵⁰', '1.125 × 10¹⁵', '10¹⁵ (quadrillion)', '1 PB (Petabyte)'],
      ],
    },
    {
      kind: 'table',
      title: 'Availability & the Nines Table',
      columns: [
        'Availability',
        'Downtime / year',
        'Downtime / month',
        'Downtime / day',
      ],
      rows: [
        ['99% (2 nines)', '3.65 days', '7.31 hours', '14.4 minutes'],
        ['99.9% (3 nines)', '8.76 hours', '43.8 minutes', '1.44 minutes'],
        ['99.95%', '4.38 hours', '21.9 minutes', '43.2 seconds'],
        ['99.99% (4 nines)', '52.6 minutes', '4.38 minutes', '8.64 seconds'],
        ['99.999% (5 nines)', '5.26 minutes', '26.3 seconds', '0.86 seconds'],
      ],
    },
    {
      kind: 'numbers',
      title: 'Daily Volume to RPS Conversion (÷ 100,000 s/day)',
      rows: [
        ['86,400 seconds / day', '≈ 100,000 (10⁵) s', 'Mental-math divisor'],
        ['100,000 requests / day', '≈ 1 RPS', 'Peak (×3) ≈ 3 RPS'],
        ['1,000,000 (1M) / day', '≈ 10 RPS', 'Peak (×3) ≈ 30 RPS'],
        ['10,000,000 (10M) / day', '≈ 100 RPS', 'Peak (×3) ≈ 300 RPS'],
        ['100,000,000 (100M) / day', '≈ 1,000 RPS', 'Peak (×3) ≈ 3,000 RPS'],
        ['1,000,000,000 (1B) / day', '≈ 10,000 RPS', 'Peak (×3) ≈ 30,000 RPS'],
      ],
    },
    {
      kind: 'pattern',
      title: 'Connection Reuse & Edge Placement',
      when: 'Cold requests spend more time in DNS and TCP/TLS handshakes than on the server.',
      how: 'Cache DNS with sensible TTLs, enable HTTP keep-alive and HTTP/2 multiplexing, and terminate TLS at an edge PoP close to the user.',
      watch:
        'Idle keep-alive sockets still consume server file descriptors; set idle timeouts.',
      lesson: 'request-journey',
    },
    {
      kind: 'pattern',
      title: 'Headroom Below the Queueing Knee',
      when: 'p95 and p99 latencies spike during traffic peaks even though single-request CPU work is unchanged.',
      how: 'Keep average server utilisation around 50–70% and size connection pools with Little’s law (L = λ × W).',
      watch:
        'Never capacity-plan for 95–100% utilisation; queueing delay scales with 1 / (1 − ρ).',
      lesson: 'latency-throughput',
    },
  ],
} satisfies Cheatsheet;
