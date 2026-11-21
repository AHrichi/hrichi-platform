import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.11: Files, Blobs & Media (`blob-storage`).
 * Scenario: Users upload 4K videos (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'blob-storage',
  learn: [
    'Why large media blobs do not belong inside a SQL database',
    'How to pair object storage with a compact metadata DB',
    'How pre-signed URLs keep big uploads off your app servers',
    'Why multipart uploads survive flaky mobile connections',
    'How queued transcoding and CDNs power smooth 4K playback',
  ],
  scene: {
    nodes: [
      {
        id: 'creator',
        kind: 'phone',
        at: { x: 1, y: 3 },
        label: 'Creator phone',
        sublabel: '500 MB 4K clip',
      },
      {
        id: 'api',
        kind: 'server',
        at: { x: 5, y: 3 },
        label: 'Video API',
        sublabel: 'App server',
      },
      {
        id: 'meta-db',
        kind: 'database',
        at: { x: 9, y: 3 },
        label: 'Metadata DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      { id: 'creator-api', from: 'creator', to: 'api', label: '500 MB PUT' },
      { id: 'api-db', from: 'api', to: 'meta-db', label: 'INSERT BLOB' },
    ],
    zones: [
      {
        id: 'backend-zone',
        from: { x: 8, y: 0 },
        to: { x: 13, y: 7 },
        hue: 'amber',
        label: 'Media cloud',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'api-bw', label: 'API bandwidth', icon: 'gauge', value: '4.0 GB/s' },
    { id: 'db-size', label: 'DB growth/d', icon: 'database', value: '50 TB' },
    { id: 'upload-ok', label: 'Upload rate', icon: 'check', value: '38%' },
    { id: 'playback', label: 'Start time', icon: 'timer', value: '4.2 s' },
  ],
  steps: [
    {
      id: 'db-bloat',
      label: 'DB bloat',
      kind: 'problem',
      title: '4K videos inside SQL choke your database',
      body: [
        'Creators upload **500 MB 4K videos** through your **Video API** directly into a `BYTEA` column in Postgres. At `100,000` clips a day, that adds **50 TB/day** to the primary database.',
        'Large blobs evict hot B-tree indexes from RAM, stall backups for days, and pin every app-server worker thread while bytes trickle over mobile links.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'hot', load: 0.94, badge: 'threads full' },
        },
        {
          op: 'update-node',
          id: 'meta-db',
          patch: { state: 'hot', load: 0.96, badge: '50 TB/day' },
        },
        {
          op: 'packet',
          edge: 'creator-api',
          kind: 'write',
          count: 3,
          label: '500 MB',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          count: 3,
          label: 'BLOB',
          wave: 1,
        },
        { op: 'set-metric', id: 'api-bw', value: '4.0 GB/s', tone: 'bad' },
        { op: 'set-metric', id: 'db-size', value: '50 TB', tone: 'bad' },
      ],
    },
    {
      id: 'split-storage',
      label: 'Object store',
      kind: 'technique',
      title: 'Keep metadata in SQL and bytes in object storage',
      body: [
        'Move video files out of SQL into **object storage** (like S3 or GCS), built for petabyte durability at a fraction of SSD cost.',
        'Keep only tiny structured rows in **Metadata DB** (`video_id`, `owner_id`, `status`, `object_key`—about `1 KB` each). Daily DB growth drops **500,000×** to **100 MB/day**!',
      ],
      changes: [
        { type: 'added', text: 'Object store node for raw media blobs' },
        { type: 'changed', text: 'DB daily growth drops from 50 TB to 100 MB' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'obj-store',
            kind: 'storage',
            at: { x: 9, y: 6 },
            label: 'Object store',
            sublabel: 'S3 / GCS',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-obj',
            from: 'api',
            to: 'obj-store',
            label: '500 MB',
          },
        },
        {
          op: 'update-node',
          id: 'meta-db',
          patch: { state: 'normal', load: 0.15, badge: '1 KB rows' },
        },
        {
          op: 'update-edge',
          id: 'api-db',
          patch: { label: '1 KB row' },
        },
        { op: 'packet', edge: 'api-db', kind: 'write', label: 'meta', wave: 0 },
        {
          op: 'packet',
          edge: 'api-obj',
          kind: 'write',
          label: 'blob',
          wave: 0,
        },
        { op: 'set-metric', id: 'db-size', value: '100 MB', tone: 'good' },
      ],
      learns: [0, 1],
    },
    {
      id: 'presigned-url',
      label: 'Pre-signed URL',
      kind: 'technique',
      title: 'Upload directly to storage with signed URLs',
      body: [
        'Video bytes still proxy through your **Video API** (`4.0 GB/s` wasted). Fix that with **pre-signed URLs**.',
        'The phone asks `Video API` for an upload slot; the API verifies auth, inserts a `pending` row, and signs a short-lived `PUT` URL (`15 min`). The phone streams `500 MB` straight to **Object store**!',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Keep your API as a tiny control plane (auth + signed URLs) and let object storage handle the heavy data plane.',
        },
      ],
      changes: [
        { type: 'added', text: 'Direct upload edge to Object store' },
        { type: 'changed', text: 'API bandwidth drops to 2 MB/s' },
      ],
      ops: [
        { op: 'remove-edge', id: 'api-obj' },
        {
          op: 'update-edge',
          id: 'creator-api',
          patch: { label: 'POST /slot' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'creator-obj',
            from: 'creator',
            to: 'obj-store',
            label: 'Pre-signed PUT',
            route: 'elbow-y',
          },
        },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'normal', load: 0.12, badge: 'control plane' },
        },
        {
          op: 'packet',
          edge: 'creator-api',
          kind: 'request',
          label: 'sign URL',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'creator-api',
          kind: 'response',
          reverse: true,
          label: 'signed PUT',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'creator-obj',
          kind: 'write',
          label: '500 MB direct',
          wave: 2,
        },
        { op: 'set-metric', id: 'api-bw', value: '2 MB/s', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'multipart',
      label: 'Multipart',
      kind: 'case',
      title: 'Split large uploads into resumable chunks',
      body: [
        'On a train, a single `500 MB` HTTP PUT drops at 85% and throws away 425 MB—leaving only **38%** mobile completion.',
        'Switch to **multipart (resumable) upload**: slice the file into fifty **10 MB parts**, upload 4 parts in parallel, retry only a dropped chunk, and finalize with `CompleteMultipart`. Completion jumps to **99.8%**.',
      ],
      changes: [
        { type: 'changed', text: 'Parallel 10 MB multipart uploads enabled' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'creator',
          patch: { state: 'focus', badge: '50 × 10 MB' },
        },
        {
          op: 'packet',
          edge: 'creator-obj',
          kind: 'write',
          count: 4,
          label: '10 MB parts',
          wave: 0,
        },
        { op: 'set-metric', id: 'upload-ok', value: '99.8%', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'trust-pitfall',
      label: 'Trust gap',
      kind: 'watch-out',
      title: 'Never trust clients to report upload completion',
      body: [
        'If a phone forgets to call `POST /complete`, or tampers with upload size or MIME type, you store orphaned garbage or break playback.',
        'Lock every pre-signed policy to an exact key, expiry, and byte ceiling—and trigger processing from **ObjectCreated** storage events, not client self-reports.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Always bind max bytes, content-type, and short expiry in pre-signed policies, and react to storage events.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'creator',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'obj-store',
          patch: { state: 'focus', badge: 'policy + event' },
        },
      ],
    },
    {
      id: 'async-transcode',
      label: 'Transcode Q',
      kind: 'technique',
      title: 'Transcode raw 4K into chunks via a queue',
      body: [
        'Raw 4K clips freeze slow connections. On `ObjectCreated`, **Object store** pushes a job into **Transcode Q** so upload requests never wait.',
        'Stateless **Transcoder** workers slice the video into 4-second **HLS/DASH** segments at `1080p`, `720p`, and `360p`, write them back, and mark `Metadata DB` ready.',
      ],
      changes: [
        { type: 'added', text: 'Transcode Queue and FFmpeg Worker pool' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'job-queue',
            kind: 'queue',
            at: { x: 12, y: 6 },
            label: 'Transcode Q',
            sublabel: 'Async jobs',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'worker',
            kind: 'worker',
            at: { x: 12, y: 3 },
            label: 'Transcoder',
            sublabel: '1080p·720p·360p',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'obj-queue',
            from: 'obj-store',
            to: 'job-queue',
            label: 'ObjectCreated',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'queue-worker',
            from: 'job-queue',
            to: 'worker',
            label: 'job',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'worker-obj',
            from: 'worker',
            to: 'obj-store',
            label: 'HLS chunks',
            route: 'straight',
          },
        },
        { op: 'packet', edge: 'obj-queue', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'queue-worker', kind: 'request', wave: 1 },
        {
          op: 'packet',
          edge: 'worker-obj',
          kind: 'write',
          label: 'segments',
          wave: 2,
        },
      ],
    },
    {
      id: 'cdn-delivery',
      label: 'CDN delivery',
      kind: 'technique',
      title: 'Serve immutable video segments from a CDN',
      body: [
        'Each transcoded segment gets a unique content-hashed path and `Cache-Control: public, max-age=31536000, immutable`.',
        'Viewers stream segments straight from nearby **Edge CDN** PoPs in **280 ms** instead of crossing continents to origin storage—slashing egress bills.',
      ],
      changes: [
        { type: 'added', text: 'Viewer and Edge CDN delivery path' },
        { type: 'changed', text: 'Playback start drops from 4.2 s to 280 ms' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'viewer',
            kind: 'client',
            at: { x: 1, y: 7 },
            label: 'Viewers',
            sublabel: 'Adaptive player',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'cdn',
            kind: 'cdn',
            at: { x: 5, y: 7 },
            label: 'Edge CDN',
            sublabel: 'immutable TTL',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'viewer-cdn', from: 'viewer', to: 'cdn', label: 'HLS' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'cdn-obj',
            from: 'cdn',
            to: 'obj-store',
            label: 'origin miss',
            style: 'dashed',
            route: 'elbow-x',
          },
        },
        {
          op: 'packet',
          edge: 'viewer-cdn',
          kind: 'response',
          reverse: true,
          count: 3,
          label: 'edge hit',
          wave: 0,
        },
        { op: 'set-metric', id: 'playback', value: '280 ms', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Keep control in SQL, heavy bytes in object + CDN',
      body: [
        'Great media pipelines separate tiny transactional metadata from giant immutable files: **pre-signed multipart uploads** bypass your API, **queues** absorb transcoding spikes, and **CDNs** serve edge-cached chunks.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'normal', load: null, badge: null },
        },
        {
          op: 'update-node',
          id: 'meta-db',
          patch: { load: null, badge: null },
        },
        {
          op: 'update-node',
          id: 'obj-store',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'worker',
          patch: { state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'cdn',
          patch: { state: 'normal' },
        },
        {
          op: 'add-note',
          note: {
            id: 'media-planes',
            anchor: { at: { x: 3.8, y: -1.2 } },
            text: 'Media Architecture Split',
            tone: 'good',
            icon: 'file',
            rows: [
              ['Control plane', 'SQL metadata + signed URL'],
              ['Upload plane', 'Direct multipart chunks'],
              ['Process plane', 'Queue + worker transcode'],
              ['Delivery plane', 'Immutable chunks on CDN'],
            ],
          },
        },
      ],
      takeaways: [
        'Keep large files out of SQL databases; store only compact metadata and object keys in SQL',
        'Use short-lived pre-signed URLs so clients upload directly to object storage',
        'Split large uploads into parallel resumable parts so dropped connections retry only one chunk',
        'Trigger asynchronous transcoding from storage events via a queue and serve immutable segments through a CDN',
      ],
    },
  ],
  checks: [
    {
      id: 'order-presigned-upload',
      kind: 'order',
      prompt:
        'Put the steps of a direct-to-storage video upload using a pre-signed URL in order.',
      items: [
        'Creator app calls Video API to request an upload slot',
        'Video API checks permissions and returns a short-lived pre-signed PUT URL',
        'Creator app uploads 10 MB multipart chunks directly to Object storage',
        'Object storage emits an ObjectCreated event to enqueue transcoding',
      ],
      explain:
        'The API acts only as a lightweight control plane issuing the signed URL; bytes flow directly to object storage, which triggers transcoding via storage events.',
      step: 'presigned-url',
    },
    {
      id: 'numeric-multipart-retry',
      kind: 'numeric',
      prompt:
        'A 400 MB video uses a resumable multipart upload with 8 MB parts. If one single part fails mid-flight due to a cellular handoff, how many megabytes must the client re-upload?',
      unit: 'MB',
      answer: 8,
      tolerance: 0.05,
      explain:
        'Multipart uploads isolate retries per part, so only the single failed 8 MB chunk is re-uploaded instead of all 400 MB.',
      step: 'multipart',
    },
    {
      id: 'choice-blobs-out-of-db',
      kind: 'choice',
      prompt:
        'Why should 500 MB 4K video files live in object storage instead of a BLOB column in your primary SQL database?',
      options: [
        'Storing large blobs in SQL bloats backups, evicts hot B-tree indexes from RAM, and ties up expensive transactional storage',
        'SQL databases cannot store binary data larger than 64 KB',
        'Object storage automatically transcodes 4K video into 720p on upload',
      ],
      answer: 0,
      explain:
        'Keeping only ~1 KB metadata rows in SQL preserves fast index caching and crisp backups while object storage scales media cheaply.',
      step: 'split-storage',
    },
    {
      id: 'choice-immutable-cdn',
      kind: 'choice',
      prompt:
        'Why do media pipelines store transcoded video segments under content-hashed keys with long Cache-Control: immutable headers?',
      options: [
        'CDN edge PoPs can cache segments for months with high hit ratios and never serve stale overwritten files',
        'It allows browsers to skip downloading video data altogether',
        'It keeps pre-signed upload URLs valid forever',
      ],
      answer: 0,
      explain:
        'New edits receive new keys, so existing segments never change—letting CDNs cache aggressively near viewers with zero invalidation bugs.',
      step: 'cdn-delivery',
    },
  ],
  cards: [
    {
      front: 'Why keep large blobs out of your relational database?',
      back: 'Blobs bloat backups, evict hot B-tree indexes from memory, and consume expensive database storage and connection threads. Store metadata in SQL and bytes in object storage.',
    },
    {
      front: 'How do pre-signed URLs reduce API server load?',
      back: 'The API verifies permissions and signs a temporary upload URL, then the client uploads the multi-megabyte file directly to object storage without proxying bytes through the API.',
    },
    {
      front: 'Why use multipart (resumable) uploads for large media?',
      back: 'Splitting a file into small chunks lets parts upload in parallel and means a dropped connection only retries the failed chunk rather than restarting from byte zero.',
    },
    {
      front: 'How do asynchronous transcoding and CDNs optimize playback?',
      back: 'Storage events trigger queue workers to encode adaptive bitrate segments (e.g. HLS) off the upload path, and immutable segment keys let CDN edge PoPs cache video close to viewers.',
    },
  ],
} satisfies Lesson;
