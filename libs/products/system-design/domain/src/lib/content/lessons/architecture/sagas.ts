import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 06.03: Sagas & Distributed Transactions (`sagas`).
 * Scenario: Booking flight + hotel + car (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'sagas',
  learn: [
    'Why microservices cannot share one local ACID transaction',
    'Why two-phase commit (2PC) blocks and holds locks',
    'How sagas pair local transactions with compensations',
    'When to choose orchestration vs event choreography',
    'How transactional outbox prevents lost database events',
  ],
  scene: {
    nodes: [
      {
        id: 'traveler',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Traveler',
        sublabel: 'Trip bundle',
      },
      {
        id: 'trip-api',
        kind: 'service',
        at: { x: 5, y: 4 },
        label: 'Trip API',
        sublabel: 'Bundle checkout',
      },
      {
        id: 'flights',
        kind: 'service',
        at: { x: 10, y: 1 },
        label: 'Flights',
        sublabel: 'Seat DB',
      },
      {
        id: 'hotels',
        kind: 'service',
        at: { x: 10, y: 4 },
        label: 'Hotels',
        sublabel: 'Room DB',
      },
      {
        id: 'cars',
        kind: 'service',
        at: { x: 10, y: 7 },
        label: 'Cars',
        sublabel: 'Fleet DB',
      },
    ],
    edges: [
      {
        id: 'trav-trip',
        from: 'traveler',
        to: 'trip-api',
        label: 'POST /book',
      },
      {
        id: 'trip-flights',
        from: 'trip-api',
        to: 'flights',
        label: 'Reserve',
      },
      {
        id: 'trip-hotels',
        from: 'trip-api',
        to: 'hotels',
        label: 'Reserve',
      },
      {
        id: 'trip-cars',
        from: 'trip-api',
        to: 'cars',
        label: 'Reserve',
      },
    ],
    zones: [
      {
        id: 'vendors-zone',
        from: { x: 9, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'amber',
        label: 'Independent services',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'state', label: 'Trip state', icon: 'layers', value: 'Init' },
    { id: 'locks', label: 'Held locks', icon: 'lock', value: 'None' },
    { id: 'consistency', label: 'Data state', icon: 'check', value: 'Clean' },
    { id: 'style', label: 'Pattern', icon: 'route', value: 'None' },
  ],
  steps: [
    {
      id: 'no-global-tx',
      label: 'Half-booked',
      kind: 'problem',
      title: 'Flight and hotel confirm, then car fails',
      body: [
        'A traveler books a holiday bundle: **Flight + Hotel + Car**. Because each vendor owns its own service and private database, there is no single `BEGIN ... COMMIT` wrapping all three.',
        '**Flights** and **Hotels** commit locally, then **Cars** rejects ("sold out"). The traveler is left paying for a flight and room without a car!',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'focus', badge: 'Committed' },
        },
        {
          op: 'update-node',
          id: 'hotels',
          patch: { state: 'focus', badge: 'Committed' },
        },
        {
          op: 'update-node',
          id: 'cars',
          patch: { state: 'down', badge: 'Sold out' },
        },
        { op: 'packet', edge: 'trav-trip', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'trip-flights',
          kind: 'write',
          label: 'OK',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'trip-hotels',
          kind: 'write',
          label: 'OK',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'trip-cars',
          kind: 'error',
          label: 'Sold out',
          wave: 1,
        },
        { op: 'set-metric', id: 'state', value: 'Broken!', tone: 'bad' },
        {
          op: 'set-metric',
          id: 'consistency',
          value: 'Half-booked',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'two-phase-commit',
      label: 'Why not 2PC',
      kind: 'case',
      title: 'Two-phase commit locks rows and stalls',
      body: [
        'Could **two-phase commit (2PC)** make all three atomic? First the coordinator sends `PREPARE`, forcing every database to lock rows and promise durability; then it sends `COMMIT`.',
        'If `Trip API` crashes after `PREPARE`, every vendor stays stuck holding locks—blocking other buyers and impossible across external partner APIs.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: '2PC sacrifices availability for global atomicity: one coordinator crash freezes every participant.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'trip-api',
          patch: { state: 'down', badge: 'Coord crash' },
        },
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'hot', badge: 'Locked!' },
        },
        {
          op: 'update-node',
          id: 'hotels',
          patch: { state: 'hot', badge: 'Locked!' },
        },
        {
          op: 'update-node',
          id: 'cars',
          patch: { state: 'hot', badge: 'Locked!' },
        },
        {
          op: 'packet',
          edge: 'trip-flights',
          kind: 'handshake',
          label: 'PREPARE',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'trip-hotels',
          kind: 'handshake',
          label: 'PREPARE',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'trip-cars',
          kind: 'handshake',
          label: 'PREPARE',
          wave: 0,
        },
        { op: 'set-metric', id: 'locks', value: 'Held open!', tone: 'bad' },
        { op: 'set-metric', id: 'style', value: '2PC blocked', tone: 'bad' },
      ],
      learns: [0, 1],
    },
    {
      id: 'saga-forward',
      label: 'Saga steps',
      kind: 'technique',
      title: 'A saga splits work into local ACID steps',
      body: [
        'Use a **saga**: a chain of local ACID transactions (`T1`, `T2`, `T3`) that commit immediately and release database locks right away.',
        'While steps are running, show the booking as **Pending** to the user instead of pretending the whole trip is instantly atomic.',
      ],
      changes: [
        { type: 'changed', text: 'Replaced 2PC locks with sequential local steps' },
        { type: 'changed', text: 'Trip state marked Pending during execution' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'trip-api',
          patch: { state: 'focus', label: 'Orchestrator', badge: 'Pending' },
        },
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'focus', badge: 'T1: Booked' },
        },
        {
          op: 'update-node',
          id: 'hotels',
          patch: { state: 'focus', badge: 'T2: Booked' },
        },
        {
          op: 'update-node',
          id: 'cars',
          patch: { state: 'normal', badge: 'T3: Pending' },
        },
        {
          op: 'packet',
          edge: 'trip-flights',
          kind: 'write',
          label: 'T1 commit',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'trip-hotels',
          kind: 'write',
          label: 'T2 commit',
          wave: 1,
        },
        { op: 'set-metric', id: 'state', value: 'Pending' },
        { op: 'set-metric', id: 'locks', value: 'None', tone: 'good' },
        { op: 'set-metric', id: 'consistency', value: 'In flight' },
        { op: 'set-metric', id: 'style', value: 'Saga' },
      ],
      learns: [2],
    },
    {
      id: 'compensations',
      label: 'Compensate',
      kind: 'technique',
      title: 'Undo earlier steps with compensating actions',
      body: [
        'Committed steps cannot `ROLLBACK`, so every forward step `Tᵢ` needs a semantic undo **compensation** `Cᵢ`: cancel room (`C2`), refund seat (`C1`).',
        'When `T3` (Cars) fails, run compensations in **reverse order**. Place irreversible actions—like non-refundable tickets—last in the sequence.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Compensations run over unreliable networks too—every Cᵢ must be idempotent and safely retryable.',
        },
      ],
      changes: [
        { type: 'changed', text: 'Cars failure triggers reverse C2 and C1 undos' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cars',
          patch: { state: 'down', badge: 'T3 failed' },
        },
        {
          op: 'update-node',
          id: 'hotels',
          patch: { state: 'normal', badge: 'C2: Cancelled' },
        },
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'normal', badge: 'C1: Refunded' },
        },
        {
          op: 'update-node',
          id: 'trip-api',
          patch: { badge: 'Compensated' },
        },
        {
          op: 'packet',
          edge: 'trip-cars',
          kind: 'error',
          label: 'T3 fail',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'trip-hotels',
          kind: 'event',
          label: 'C2 cancel',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'trip-flights',
          kind: 'event',
          label: 'C1 refund',
          wave: 2,
        },
        { op: 'set-metric', id: 'state', value: 'Cancelled' },
        {
          op: 'set-metric',
          id: 'consistency',
          value: 'Consistent',
          tone: 'good',
        },
      ],
      learns: [2],
    },
    {
      id: 'orchestration',
      label: 'Orchestrator',
      kind: 'technique',
      title: 'Orchestration: one coordinator commands flow',
      body: [
        'In **orchestration**, one central coordinator (`Orchestrator`) tracks the saga state machine, sends commands to Flights, Hotels, and Cars, enforces timeouts, and triggers compensations.',
        'The whole workflow lives in **one visible place**, making complex branching easy to monitor—at the cost of coupling the coordinator to every participant.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cars',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'flights', patch: { badge: null } },
        { op: 'update-node', id: 'hotels', patch: { badge: null } },
        {
          op: 'update-node',
          id: 'trip-api',
          patch: { badge: 'State machine' },
        },
        {
          op: 'add-note',
          note: {
            id: 'orch-note',
            anchor: { node: 'trip-api' },
            text: '1. Flight -> 2. Hotel -> 3. Car',
            tone: 'info',
            icon: 'route',
          },
        },
        { op: 'set-metric', id: 'style', value: 'Orchestration' },
        { op: 'set-metric', id: 'state', value: 'Confirmed', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'choreography',
      label: 'Choreography',
      kind: 'technique',
      title: 'Choreography: services react to domain events',
      body: [
        'In **choreography**, there is no central coordinator. `Flights` books a seat and publishes `FlightBooked` to an **Event Bus**; `Hotels` reacts, reserves a room, and emits `HotelBooked`.',
        'Services stay loosely coupled and easy to extend—though long workflows become implicit and harder to trace across repositories.',
      ],
      changes: [
        { type: 'added', text: 'Event Bus connecting Trip API, Flights, Hotels, Cars' },
        { type: 'changed', text: 'Switched from central orchestrator to event reactions' },
      ],
      ops: [
        { op: 'remove-note', id: 'orch-note' },
        { op: 'remove-edge', id: 'trip-flights' },
        { op: 'remove-edge', id: 'trip-hotels' },
        { op: 'remove-edge', id: 'trip-cars' },
        {
          op: 'add-node',
          node: {
            id: 'bus',
            kind: 'stream',
            at: { x: 5, y: 7 },
            label: 'Event Bus',
            sublabel: 'Pub/Sub topics',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'trip-api',
          patch: { label: 'Trip API', sublabel: 'Starts saga', badge: null },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'trip-bus',
            from: 'trip-api',
            to: 'bus',
            label: 'TripRequested',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'bus-flights',
            from: 'bus',
            to: 'flights',
            label: 'FlightBooked',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'bus-hotels',
            from: 'bus',
            to: 'hotels',
            label: 'HotelBooked',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'bus-cars',
            from: 'bus',
            to: 'cars',
            label: 'CarBooked',
          },
        },
        { op: 'packet', edge: 'trip-bus', kind: 'event', wave: 0 },
        { op: 'set-metric', id: 'style', value: 'Choreography' },
      ],
      learns: [3],
    },
    {
      id: 'dual-write-trap',
      label: 'Dual write',
      kind: 'watch-out',
      title: 'DB commit and event publish are not atomic',
      body: [
        'Suppose **Flights** commits a seat in `Seat DB`, then crashes before publishing `FlightBooked` to the Event Bus. The seat is gone, Hotels never hears about it, and the saga hangs forever!',
        'Writing to a database and a separate message broker without coordination is the **dual-write problem**.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never assume a DB commit and a broker publish will both succeed together across a process crash.',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'seat-db',
            kind: 'database',
            at: { x: 13, y: 1 },
            label: 'Seat DB',
            sublabel: 'Committed!',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'flights-db',
            from: 'flights',
            to: 'seat-db',
            label: 'Local TX',
          },
        },
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'down', badge: 'Crash pre-pub' },
        },
        {
          op: 'update-edge',
          id: 'bus-flights',
          patch: { state: 'broken', label: 'Event lost!' },
        },
        {
          op: 'packet',
          edge: 'flights-db',
          kind: 'write',
          label: 'Seat saved',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'bus-flights',
          kind: 'error',
          reverse: true,
          label: 'Never sent',
          wave: 1,
        },
        {
          op: 'set-metric',
          id: 'consistency',
          value: 'Stuck saga!',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'transactional-outbox',
      label: 'Outbox',
      kind: 'technique',
      title: 'Outbox pairs DB write and event atomically',
      body: [
        'Solve dual writes with a **transactional outbox**: in the _same_ local `Seat DB` transaction, `Flights` writes the seat row **and** appends `FlightBooked` to an `outbox` table.',
        'Either both commit or neither does. A background **Outbox Relay** reads the outbox (polling or WAL tailing) and publishes to the bus at least once—so consumers stay **idempotent**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'The outbox piggybacks event durability onto your database’s own ACID commit.',
        },
      ],
      changes: [
        { type: 'added', text: 'Outbox table + Outbox Relay publishing to Event Bus' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'flights',
          patch: { state: 'normal', badge: 'Atomic TX' },
        },
        {
          op: 'update-node',
          id: 'seat-db',
          patch: { sublabel: 'Seats + Outbox table', state: 'focus' },
        },
        {
          op: 'update-edge',
          id: 'bus-flights',
          patch: { state: 'normal', label: 'FlightBooked' },
        },
        {
          op: 'add-node',
          node: {
            id: 'relay',
            kind: 'worker',
            at: { x: 13, y: 4 },
            label: 'Outbox Relay',
            sublabel: 'Reads outbox',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'db-relay',
            from: 'seat-db',
            to: 'relay',
            label: 'Poll / CDC',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'relay-bus',
            from: 'relay',
            to: 'bus',
            label: 'Publish',
          },
        },
        {
          op: 'packet',
          edge: 'flights-db',
          kind: 'write',
          label: 'Seat + Outbox',
          wave: 0,
        },
        { op: 'packet', edge: 'db-relay', kind: 'event', wave: 1 },
        {
          op: 'packet',
          edge: 'relay-bus',
          kind: 'event',
          label: 'Guaranteed',
          wave: 2,
        },
        {
          op: 'set-metric',
          id: 'consistency',
          value: 'Outbox safe',
          tone: 'good',
        },
        { op: 'set-metric', id: 'state', value: 'Confirmed', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Trade global locks for sagas and an outbox',
      body: [
        'Distributed workflows stay consistent without holding locks across services when you design idempotent forward and compensating steps and back event emission with a transactional outbox.',
      ],
      ops: [
        { op: 'update-node', id: 'seat-db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'relay', patch: { state: 'normal' } },
        { op: 'update-node', id: 'bus', patch: { state: 'normal' } },
        { op: 'update-node', id: 'flights', patch: { badge: null } },
        {
          op: 'add-note',
          note: {
            id: 'saga-summary',
            anchor: { at: { x: 2, y: 8 } },
            text: 'Distributed workflow patterns',
            tone: 'info',
            icon: 'check',
            rows: [
              ['2PC', 'Blocks on crash · holds locks'],
              ['Orchestration', 'Central coordinator · visible'],
              ['Choreography', 'Event bus · loose coupling'],
              ['Outbox', 'DB row + event in 1 local TX'],
            ],
          },
        },
      ],
      takeaways: [
        'Two-phase commit holds locks across services and stalls if the coordinator crashes',
        'Sagas commit local transactions right away and undo failures using idempotent reverse compensations',
        'Use orchestration for complex visible workflows and choreography for simple, loosely coupled events',
        'Write domain changes and outbox events in one local transaction so crashes never lose messages',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-2pc-flaw',
      kind: 'choice',
      prompt:
        'Why do microservice architectures rarely use two-phase commit (2PC) across independent services?',
      options: [
        'Participants hold locks after PREPARE, stalling the system if the coordinator crashes',
        '2PC cannot roll back changes inside a single SQL table',
        'Two-phase commit works only with NoSQL document stores',
      ],
      answer: 0,
      explain:
        '2PC holds database locks while waiting for the coordinator’s COMMIT decision; a coordinator crash blocks participants and external APIs rarely support 2PC.',
      step: 'two-phase-commit',
    },
    {
      id: 'order-saga-compensation',
      kind: 'order',
      prompt:
        'A booking saga runs Flight (T1), Hotel (T2), and Car (T3), and Car fails. Put the full execution and compensation sequence in order.',
      items: [
        'T1: Reserve Flight (commits locally)',
        'T2: Reserve Hotel (commits locally)',
        'T3: Reserve Car (fails — sold out)',
        'C2: Cancel Hotel reservation',
        'C1: Refund Flight ticket',
      ],
      explain:
        'Sagas commit each local step immediately and, on failure, execute compensating actions in reverse order (C2 then C1).',
      step: 'compensations',
    },
    {
      id: 'choice-transactional-outbox',
      kind: 'choice',
      prompt:
        'How does the transactional outbox pattern solve the dual-write problem between a database and an event bus?',
      options: [
        'It writes both the business change and the event row in one local DB transaction, then a relay publishes from the outbox',
        'It wraps the database and the Kafka broker inside one two-phase commit lock',
        'It publishes to the event bus first and skips saving to the database if busy',
      ],
      answer: 0,
      explain:
        'One local ACID transaction guarantees the event is recorded if and only if the business state commits; the relay delivers it at least once afterward.',
      step: 'transactional-outbox',
    },
    {
      id: 'numeric-saga-actions',
      kind: 'numeric',
      prompt:
        'A trip checkout saga has 4 forward steps: 3 reversible reservations plus 1 final non-refundable charge placed last. How many total actions (forward + compensating) must you implement?',
      unit: 'actions',
      answer: 7,
      tolerance: 0.05,
      explain:
        'You implement 4 forward steps and 3 compensations for the reversible steps (the irreversible charge runs last with no compensation): 4 + 3 = 7 actions.',
      step: 'compensations',
    },
  ],
  cards: [
    {
      front: 'Why are sagas preferred over two-phase commit (2PC) across microservices?',
      back: '2PC holds database locks between prepare and commit and blocks on coordinator crashes. Sagas release locks immediately via local ACID commits and handle failures with compensating actions.',
    },
    {
      front: 'What rules govern saga compensations?',
      back: 'Every reversible step needs an idempotent, retryable compensation executed in reverse order on failure; irreversible steps should run last; expose intermediate "Pending" state.',
    },
    {
      front: 'Compare saga orchestration vs choreography.',
      back: 'Orchestration uses a central coordinator (clear visibility and timeouts, tighter coupling). Choreography reacts to domain events on a bus (loose coupling, harder to trace end-to-end).',
    },
    {
      front: 'How does the transactional outbox pattern prevent lost events?',
      back: 'The service writes the state update and an outbox event row in the same local database transaction; a relay reads the outbox and publishes at least once to the broker.',
    },
  ],
} satisfies Lesson;
