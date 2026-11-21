# System Design course: technical design

Sections 9 (lesson authoring) and 10 (curriculum) live in [lesson-authoring.md](lesson-authoring.md).

Decisions: [ADR-0025](../adr/0025-system-design-course.md). How to write lessons: [lesson-authoring.md](lesson-authoring.md). State and next steps: [AI_HANDOFF.md](AI_HANDOFF.md).

## Context

The owner wants an app that teaches system design and software architecture, in the spirit of https://designed-to-scale.vercel.app (studied in the browser on 2026-11-20). That site teaches each concept as a lesson of about 10 steps. Each step changes an animated isometric SVG diagram, updates a row of metric chips, and explains itself in a side panel. A course sidebar, a step timeline and a "You'll learn" checklist frame it. It uses a warm paper look in monospace type, with dark mode and keyboard shortcuts. Its Practice, Design Lab and Cheatsheets tabs are "coming soon" there; **here they are built for real**.

What matters most to the owner:

- **Scalability:** adding lesson #45 must be as cheap as lesson #5.
- **Use the platform's existing architecture and extend it** instead of inventing a parallel one.
- **A plan detailed enough for a low-level AI agent** to execute one phase at a time.

**Decisions taken with the owner (2026-11-20):**

1. New standalone product remote (not a StudyLM course).
2. A new **paper look** added to the design-system tokens.
3. English first, with all copy in typed files.
4. All extras: Learning Engine review cards, Practice quizzes, Design Lab simulator, Cheatsheets.

**Originality rule:** the reference is UX inspiration only. Never copy its text, scenarios, step sequences, colours, icons or code. All lesson content, scenes and palettes here are original.

## 0. Hard rules for every agent (read before any phase)

- **Architecture:** follow `docs/architecture.md` and ADRs 0001–0024. The rules most often broken:
  - Zoneless only.
  - Standalone OnPush components with signal `input()` and `output()`.
  - `inject()`, not constructor injection.
  - Built-in control flow (`@if`/`@for`).
- **Module boundaries** (`eslint.config.mjs`): `scope:product-system-design` may import only its own scope plus `scope:shared`, `scope:platform`, `scope:design-system` and `scope:learning-client`. **Never import StudyLM or any other product.**
  - Layers point down: app → feature → ui / data-access / domain → util.
  - `type:domain` imports only `type:util`.
  - `type:data-access` can't import `@ah/platform/*`, so the feature resolves the database name and passes it in.
  - `type:ui` can't import `@ah/learning/client`, so `<ah-learn-this>` lives in feature templates.
  - `runtime:agnostic` libs never import `@angular/*` or `@ngrx/*`.
- **Styles:** semantic tokens only (`var(--color-…)`), no hex, logical properties only, no `transition: all`. These paths are stylelint-STRICT from day one.
  - Stylelint checks only `.scss` files, so every component keeps its styles in a `.scss` file (no inline `styles:`).
  - SVG colours come from classes in that `.scss` (`.face-top { fill: var(--color-scene-blue-top) }`), never from `fill=` or `stroke=` attributes in templates.
- **Copy:** all user-visible strings live in `copy/*.ts` files (typed `as const`; ADR-0018 style) or in lesson content. No runtime i18n library.
- **Rendering:**
  - No `innerHTML`: rich text renders as `[textContent]` spans.
  - No `@angular/animations`: use CSS or the Web Animations API (WAAPI).
  - Respect `prefers-reduced-motion`.
- **Accessibility:** every screen passes axe, keyboard first, visible focus. The diagram has a text alternative.
- **Tests:** specs sit next to code. Pass the file filter after `--` (`--testFile` doesn't work). Before a phase is done, run `pnpm nx format:write`, then lint, test and build the touched projects.
- **Git:**
  - Branch per phase: `feat/system-design-pN-<slug>`.
  - Conventional commits.
  - Merge commits, not squash.
  - `main` is protected (required checks: "Lint, test, build, e2e" and "Storybook (axe, visual regression)").
- **When in doubt, copy the Learning Engine.** `apps/products/learning/web` and `libs/learning/*` are the template for every file shape here.

## 1. Names and locations

| Thing                 | Value                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Product name (UI)     | **System Design** (brand line "Scale Lab · learn how systems grow")                                    |
| Nx app                | `product-system-design` at `apps/products/system-design/web`, dev port **4312**                        |
| Portfolio route / key | `/apps/system-design`, `PortfolioAppKey` `'system-design'` (aliases `sysdesign`, `scale-lab`)          |
| Prod origin           | `https://product-system-design.ahmed-hrichi.workers.dev`                                               |
| Scope tag             | `scope:product-system-design`                                                                          |
| Component prefix      | `sd` (e.g. `sd-iso-scene`)                                                                             |
| Dexie DB              | `databaseName(mode, 'system-design', 'system_design_db_v1')`, so the demo gets `ah-demo-system-design` |
| ADR                   | `docs/adr/0025-system-design-course.md`                                                                |
| Docs                  | `docs/system-design/{technical-design.md, lesson-authoring.md, AI_HANDOFF.md}`                         |

**Libs** (all under `libs/products/system-design/`; alias `@ah/products/system-design/<lib>`; Nx name `product-system-design-<lib>`):

| Lib           | Tags                                  | Holds                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`      | `type:domain`, `runtime:agnostic`     | `model/` types, `engine/` (scene replay, iso math, inline text, search, progress rules, quiz marking), `lab/` (simulator and challenges), `validate/` (semantic checks), `content/` (curriculum registry, lessons, cheatsheets, lab catalog). Content lives here because `type:domain` can't import another domain lib (same reason StudyLM's `lessons` lib holds its golden lessons). |
| `data-access` | `type:data-access`, `runtime:browser` | `class SystemDesignDatabase extends Dexie { constructor(name: string) }` and repositories. It can't import `@ah/platform/*`; the feature calls `databaseName(mode, 'system-design', 'system_design_db_v1')` and passes the name in, as `libs/learning/feature/src/lib/store/learning-runtime.ts` does.                                                                                 |
| `ui`          | `type:ui`, `runtime:browser`          | Presentational components: iso scene, glyphs, HUD, step panel, timeline, checklist, quiz widgets, lab pieces, icons. Has stories.                                                                                                                                                                                                                                                      |
| `feature`     | `type:feature`, `runtime:browser`     | Routes, shell, screens, `SystemDesignStore` (SignalStore), keyboard, search dialog, `copy/`                                                                                                                                                                                                                                                                                            |

**Platform additions** ("add to what we have"):

| Addition                                                                                                                                                                                                                                                 | Why                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `@ah/shared/steps` (`libs/shared/steps`, Nx `shared-steps`, `scope:shared`, `type:util`, `runtime:agnostic`): the `upTo` step fold, moved out of StudyLM                                                                                                 | Both apps replay "state at step n" the same way                               |
| `StepTimeline`, `Clock`, `realClock`, `STEP_MS`, `SPEEDS`, `injectReducedMotion` moved from StudyLM's `learn/player` into `@ah/ui` (plain files at `ui/src/lib/`), plus an optional `stepMs` option                                                      | One tested stepping/autoplay/reduced-motion implementation                    |
| Paper look in `libs/design-system/tokens`: `[data-look='paper']` overrides the semantic tokens and adds `color.scene.*` tokens (look-only) for isometric faces                                                                                           | The owner's chosen look, reusable by any app; contrast-gated like every theme |
| `@fontsource-variable/jetbrains-mono`, pinned exactly in the root `package.json` like Inter, and loaded by the app **and the shell's** `styles` (a remote's styles never load inside the portfolio; the CSS is about 1 KB and the font downloads lazily) | The monospace face of the paper look, also when embedded                      |
| Learning Engine inbox `APP_NAMES` gains `'system-design': 'System Design'`                                                                                                                                                                               | Captures from this app show a proper name                                     |

## 2. Architecture

```
apps/products/system-design/web  (remote + standalone PWA, port 4312)
  └─ remote.routes.ts → @ah/products/system-design/feature  SYSTEM_DESIGN_ROUTES
        feature ──► ui ──► domain ──► @ah/shared/steps
           │        └──► @ah/ui (StepTimeline, injectReducedMotion, Button, Modal…)
           ├──► data-access (Dexie class, takes its DB name) ──► domain
           ├──► @ah/platform/{app-mode,storage}  (feature resolves databaseName())
           ├──► @ah/shared/{state,content}
           └──► @ah/learning/client (<ah-learn-this>, only in feature templates)
content: domain/src/lib/content/** (TS files, lazy-imported per lesson)
```

- **No backend.** Everything is static and local-first; progress lives in IndexedDB on this device.
- **The Learning Engine hand-off** is a URL fragment (no API).
- **Lazy content:** the curriculum registry imports only lesson _metadata_. Each lesson body is a dynamic `import()`, so it becomes its own chunk, and the initial bundle stays flat whether there are 5 lessons or 50.
- **The state of the diagram at step n is a pure function**, `sceneAt(lesson, n)`, built on `upTo`, the same principle as StudyLM's engines. The UI never mutates a scene; it renders `sceneAt` and animates only the current step's packets.

## 3. Domain contracts (`libs/products/system-design/domain/src/lib/model/`)

These types are the contract every phase builds on. Write them exactly; add fields only through an ADR note.

```ts
// model/course.ts
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ModuleId =
  | 'foundations'
  | 'scaling'
  | 'data'
  | 'communication'
  | 'reliability'
  | 'architecture'
  | 'security'
  | 'shipping'
  | 'case-studies';
export interface CourseModule {
  id: ModuleId;
  number: number /* 1-based */;
  title: string;
  hue: Hue;
  lessons: readonly LessonMeta[];
}
export interface LessonMeta {
  id: string; // kebab-case, unique; route segment and file name
  module: ModuleId;
  title: string; // ≤ 32 chars
  summary: string; // ≤ 110 chars, shown under the title
  level: Level;
  minutes: number; // 5–15
  keywords: readonly string[]; // 3–10, for search
  ready: boolean; // false → sidebar shows "soon"; load() returns the shared stub lesson
  load: () => Promise<Lesson>; // () => import('./lessons/<module>/<id>').then(m => m.lesson)
}

// model/lesson.ts
export interface Lesson {
  id: string; // must equal meta.id
  learn: readonly string[]; // 3–6 "You'll learn" items, ≤ 60 chars
  scene: SceneSpec; // baseline before step 1
  hud: readonly HudMetric[]; // 0–5 chips; initial value usually '—'
  steps: readonly LessonStep[]; // 6–12; first kind 'problem', last kind 'recap'
  checks: readonly Check[]; // 3–8 practice questions
  cards: readonly ReviewCard[]; // 3–6 cards for the Learning Engine
}
export type StepKind = 'problem' | 'technique' | 'case' | 'watch-out' | 'recap';
export interface LessonStep {
  id: string; // kebab, unique in lesson
  label: string; // ≤ 14 chars, timeline label and "Next: <label>"
  kind: StepKind;
  title: string; // ≤ 48 chars
  body: readonly string[]; // 1–3 paragraphs, ≤ 80 words total, inline marks
  callouts?: readonly Callout[]; // ≤ 2
  changes?: readonly Change[]; // the "What changed" list, ≤ 4
  ops: readonly SceneOp[]; // ≤ 12
  learns?: readonly number[]; // indices into lesson.learn ticked by this step
  takeaways?: readonly string[]; // recap only, 3–5
}
export interface Callout {
  kind: 'key-idea' | 'good-to-know' | 'watch-out' | 'coming-up';
  text: string;
}
export interface Change {
  type: 'added' | 'changed' | 'removed';
  text: string;
}
export interface ReviewCard {
  front: string;
  back: string;
}

// model/scene.ts
export type Hue =
  'neutral' | 'amber' | 'blue' | 'violet' | 'green' | 'rose' | 'teal' | 'red';
export interface GridPoint {
  x: number;
  y: number;
} // iso grid cells; halves allowed
export type NodeKind =
  | 'client'
  | 'phone'
  | 'user'
  | 'dns'
  | 'cdn'
  | 'load-balancer'
  | 'gateway'
  | 'server'
  | 'service'
  | 'worker'
  | 'database'
  | 'replica'
  | 'cache'
  | 'queue'
  | 'stream'
  | 'storage'
  | 'search'
  | 'external'
  | 'scheduler';
export type NodeState = 'normal' | 'focus' | 'hot' | 'down' | 'dim';
export interface SceneNode {
  id: string;
  kind: NodeKind;
  at: GridPoint;
  label: string;
  sublabel?: string;
  state?: NodeState;
  load?: number | null /* 0–1+, draws a load chip */;
  badge?: string | null;
}
export interface SceneEdge {
  id: string;
  from: string;
  to: string;
  label?: string | null;
  style?: 'solid' | 'dashed';
  state?: 'normal' | 'dim' | 'broken';
  route?: 'elbow-x' | 'elbow-y' | 'straight';
}
export interface SceneZone {
  id: string;
  from: GridPoint;
  to: GridPoint;
  hue: Hue;
  label?: string;
}
export type NoteAnchor =
  { node: string } | { edge: string } | { at: GridPoint };
export interface SceneNote {
  id: string;
  anchor: NoteAnchor;
  text: string;
  tone?: 'plain' | 'good' | 'bad' | 'info';
  icon?: IconName;
  rows?: readonly (readonly [string, string])[];
  total?: readonly [string, string]; // table panel
}
export interface SceneSpec {
  nodes: readonly SceneNode[];
  edges: readonly SceneEdge[];
  zones: readonly SceneZone[];
  notes: readonly SceneNote[];
}
export interface HudMetric {
  id: string;
  label: string;
  icon: IconName;
  value: string;
}
export type PacketKind =
  'request' | 'response' | 'handshake' | 'write' | 'event' | 'error';
export type SceneOp =
  | { op: 'add-node'; node: SceneNode }
  | {
      op: 'update-node';
      id: string;
      patch: Partial<Omit<SceneNode, 'id' | 'kind'>>;
    }
  | { op: 'remove-node'; id: string } // also removes its edges and anchored notes
  | { op: 'add-edge'; edge: SceneEdge }
  | {
      op: 'update-edge';
      id: string;
      patch: Partial<Omit<SceneEdge, 'id' | 'from' | 'to'>>;
    }
  | { op: 'remove-edge'; id: string }
  | { op: 'add-zone'; zone: SceneZone }
  | { op: 'remove-zone'; id: string }
  | { op: 'add-note'; note: SceneNote }
  | { op: 'update-note'; id: string; patch: Partial<Omit<SceneNote, 'id'>> }
  | { op: 'remove-note'; id: string }
  | {
      op: 'set-metric';
      id: string;
      value: string;
      tone?: 'normal' | 'good' | 'bad';
    }
  | {
      op: 'packet';
      edge: string;
      kind: PacketKind;
      reverse?: boolean;
      count?: 1 | 2 | 3 | 4 | 5;
      label?: string;
      wave?: number; /* 0-based; same wave plays together */
    };

// model/checks.ts
export type Check =
  | {
      id: string;
      kind: 'choice';
      prompt: string;
      options: readonly string[] /* 2–5 */;
      answer: number;
      explain: string;
      step?: string;
    }
  | {
      id: string;
      kind: 'numeric';
      prompt: string;
      unit: string;
      answer: number;
      tolerance: number /* relative, 0.05–0.5 */;
      explain: string;
      step?: string;
    }
  | {
      id: string;
      kind: 'order';
      prompt: string;
      items: readonly string[] /* correct order, 3–6 */;
      explain: string;
      step?: string;
    };

// model/cheatsheet.ts
export interface Cheatsheet {
  module: ModuleId;
  intro: string;
  sections: readonly CheatSection[];
}
export type CheatSection =
  | {
      kind: 'numbers';
      title: string;
      rows: readonly (readonly [string, string, string?])[];
    } // label, value, note
  | {
      kind: 'table';
      title: string;
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    }
  | { kind: 'list'; title: string; items: readonly string[] }
  | {
      kind: 'pattern';
      title: string;
      when: string;
      how: string;
      watch: string;
      lesson?: string;
    };

// model/icons.ts: the closed set the ui lib draws (original line icons, 24×24, 1.75 stroke)
export type IconName =
  | 'laptop'
  | 'phone'
  | 'user'
  | 'globe'
  | 'server'
  | 'database'
  | 'bolt'
  | 'queue'
  | 'lock'
  | 'key'
  | 'shield'
  | 'chart'
  | 'clock'
  | 'cloud'
  | 'file'
  | 'search'
  | 'gear'
  | 'hash'
  | 'mail'
  | 'route'
  | 'layers'
  | 'gauge'
  | 'warning'
  | 'check'
  | 'timer'
  | 'download'
  | 'link'
  | 'stack';
```

**`NODE_KINDS` catalog** (`model/node-kinds.ts`): `Record<NodeKind, { shape: 'device' | 'cube' | 'cylinder' | 'stack' | 'globe' | 'person' | 'disk'; hue: Hue; icon: IconName; label: string }>`.

| Hue     | Kinds                              | Shape                         |
| ------- | ---------------------------------- | ----------------------------- |
| neutral | client, phone, user, external      | device, device, person, globe |
| amber   | dns, storage                       | cube, disk                    |
| teal    | cdn, load-balancer, gateway        | globe, cube, cube             |
| blue    | server, service, worker, scheduler | cube                          |
| violet  | database, replica, search          | cylinder                      |
| green   | cache                              | cylinder                      |
| rose    | queue, stream                      | stack                         |

`red` is reserved for `state: 'hot'` and `'down'`.

**Inline text marks** (`engine/inline.ts`): `**bold**`, `` `code` ``, `_term_` (emphasis). `parseInline(text): { kind: 'text' | 'bold' | 'code' | 'em'; text: string }[]`. Unknown or unbalanced marks stay literal text. No HTML ever.

## 4. Engines (pure, in `domain`; unit-tested with `environment: 'node'`)

| Function                                                                                              | Contract                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sceneAt(lesson, n): SceneState` (`engine/scene.ts`)                                                  | `n` is a 0-based step index; −1 = baseline. Starts from `lesson.scene` and `lesson.hud`, then folds steps 0..n with `upTo`. Returns `{ nodes, edges, zones, notes: ordered arrays; metrics: Record<id, { value; tone }>; packets: PacketPlay[] (step n only, sorted by wave); learned: ReadonlySet<number> (union of learns 0..n); fresh: ReadonlySet<string> (ids added or updated at step n) }`. Unknown ids throw in dev; the validator catches them first. |
| `iso(p, z = 0)` (`engine/iso.ts`)                                                                     | 2:1 dimetric: `x = (p.x − p.y) · 32`, `y = (p.x + p.y) · 16 − z · 24` (tile 64×32). Also `sceneBounds(state, pad = 48)` → viewBox, `edgePoints(from, to, route)` → screen polyline through an elbow in grid space, `anchorOf(node)` (top centre of the glyph), `pathLength(points)`.                                                                                                                                                                           |
| `parseInline(text)` (`engine/inline.ts`)                                                              | As above.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `markCheck(check, response)` (`engine/checks.ts`)                                                     | `choice`: index equality. `numeric`: `abs(r − a) ≤ tolerance · abs(a)`. `order`: exact sequence. Returns `{ correct, expected }`.                                                                                                                                                                                                                                                                                                                              |
| `courseProgress(curriculum, progress)`, `nextLesson(...)`, `moduleCounts(...)` (`engine/progress.ts`) | Pure progress rules: a lesson is **complete** when its recap step has been shown; **started** when any step beyond the first has been shown.                                                                                                                                                                                                                                                                                                                   |
| `searchCourse(query, curriculum, cheatsheets)` (`engine/search.ts`)                                   | Case-insensitive token match. Score: title prefix 5, title 3, keyword 2, summary or module 1, cheatsheet term 1. Top 12 results.                                                                                                                                                                                                                                                                                                                               |
| `pickPractice(checks, attempts, n = 10)` (`engine/practice.ts`)                                       | Order: last answer wrong first, then never seen, then oldest seen. Ties broken by a seeded shuffle, so results are deterministic in tests.                                                                                                                                                                                                                                                                                                                     |
| `validateLesson(meta, lesson): string[]` (`validate/lesson.ts`)                                       | Returns problems (empty = valid). See the checks list in [lesson-authoring.md](lesson-authoring.md) §9.                                                                                                                                                                                                                                                                                                                                                        |
| `simulate(design, traffic)` and `checkChallenge(challenge, design, traffic)` (`lab/`)                 | See §8.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## 5. Screens and UX

**Routes** (`SYSTEM_DESIGN_ROUTES`, all relative: the remote is mounted under `/apps/system-design` and standalone at `/`):

```
''                        → redirect 'learn'
'learn'                   → resolves nextLesson() → redirect 'learn/<id>/1'
'learn/:lessonId'         → redirect ':lessonId/1'
'learn/:lessonId/:step'   → LessonScreen (step is 1-based, clamped; unknown lesson → 'learn')
'practice'                → PracticeHome          'practice/mix' → MixedPractice     'practice/:lessonId' → LessonPractice
'lab'                     → LabHome (challenges + free sandbox)      'lab/:challengeId' → LabScreen ('free' = sandbox)
'cheatsheets'             → CheatsheetIndex       'cheatsheets/:module' → CheatsheetScreen (printable)
'guide'                   → GuideScreen (how to use, keys, what's saved, Learning Engine)
'**'                      → redirect 'learn'
```

Navigate relative to the remote root, never with absolute `/learn`. Copy StudyLM's `StudyLmScreens.go()` idea: a `SdNav` service that resolves paths against the shell route.

**Shell layout** (`sd-shell`, host carries `data-look="paper"`):

- **Desktop (≥ 1200px):**
  - **Top bar:** brand mark and name; tabs Learn · Practice · Design Lab · Cheatsheets (`ah-tabs`-like nav links with `aria-current`); a search button "Search lessons & concepts… Ctrl K"; a theme toggle (`PreferencesStore.setTheme`).
  - **Left sidebar (260px):** "Course · 44 lessons", then module folders (coloured folder glyph, `01. Foundations`, `n/m`, collapsible), then lessons (current highlighted, complete ✓). A **Progress** card pinned at the bottom shows "x / 44" and expands to per-module bars (`ah-progress-bar`).
  - **Main column:**
    - lesson header card: breadcrumb `01. Foundations / Lesson 1 of 4`, title, chips (⏱ minutes · level · n steps), summary;
    - stage card: HUD chips top-left, Replay and Pause tools top-right, the scene, packet legend bottom-left;
    - timeline card: "In this lesson", numbered dots with labels, "Step n of N".
  - **Right column (340px):**
    - step panel: `STEP n / N`, kind badge, title, body, callouts, "What changed" (+ added, ~ changed, − removed), Back and "Next: <label>" buttons, key hints;
    - "You'll learn" checklist, ticked from `sceneAt().learned`.
- **Tablet (768–1199px):** the sidebar becomes a drawer (menu button, `inert` when closed, Esc closes, focus returns), and the right column is 320px.
- **Phone (< 768px), stacked:**
  - order: lesson header, stage (`height: clamp(300px, min(76vw, 68dvh), 580px)` plus an expand-to-fullscreen tool), step text, timeline (horizontal scroll), "You'll learn";
  - Back/Next live in a fixed bottom bar with `env(safe-area-inset-bottom)`, standalone only; inside the portfolio they sit inline;
  - tabs move into the drawer and search becomes an icon.
  - Copy the learning shell's `is-standalone` pattern.
- **Recap step:** takeaways as a ✓ list, a "coming up" callout linking the next lesson, `<ah-learn-this>` "Add to my daily reviews" (§7), and "Practice this lesson →".
- **Keyboard** (`feature/keyboard.ts`, ignored while focus is in a field or the dialog is open):
  - ← / → step;
  - Home / End: first / last step;
  - R replays the current step's packets;
  - Space pauses or resumes the animation;
  - Ctrl/⌘ K opens search; Esc closes overlays.

  The hint row under the buttons shows these.

- **Search dialog:**
  - native `<dialog>` inside the shell host, so it inherits the paper look;
  - a combobox input, results grouped Lessons / Cheatsheets;
  - ↑↓ move, ↵ open, Esc close.
- **Diagram accessibility:**
  - the scene SVG is `role="img"` with an `aria-label` of the step title;
  - a visually hidden list beside it ("Diagram: DNS resolver, Web server; connections: you → DNS…") updates per step;
  - the step panel's title region is `aria-live="polite"`.
- **Motion:**
  - Packets travel along the edge polyline with WAAPI (`translate` keyframes at each vertex, offsets proportional to length), 900 ms per edge at 1×. Waves play in order; `count > 1` staggers by 150 ms.
  - Nodes and notes that are `fresh` fade and rise over 240 ms.
  - With reduced motion: no travel; the edge flashes its packet colour once and steps change instantly.
- **Progress saving:** `SystemDesignStore.visit(lessonId, stepIndex)` runs on every step change, debounced 300 ms. Opening `/learn` resumes at the last lesson and step.

## 6. Visual system: paper look and isometric glyphs

**Tokens** (phase P1B):

- New primitives in `primitives.json`:
  - `color.paper.{50…950}` (a warm off-white to ink ramp);
  - fuller ramps for the scene hues (existing ramps have only 4 steps, and there is no `rose`: add `color.rose.*`).
- **New `color.scene.*` tokens, defined only in the look files** (keeps the base Storybook token story and its baselines unchanged; scene components are only used under the paper look):

  | Token                                         | Use                                 |
  | --------------------------------------------- | ----------------------------------- |
  | `color.scene.grid`, `color.scene.grid-strong` | Grid lines                          |
  | `color.scene.edge`, `color.scene.label-bg`    | Edges and label chips               |
  | `color.scene.<hue>.{top,left,right,ink}`      | Face colours for each of the 8 hues |
  | `color.scene.packet.<kind>`                   | One per packet kind                 |
  | `color.scene.zone.<hue>`                      | Ground tiles                        |

- **Paper look files** (`tokens/look.paper.light.json`, `look.paper.dark.json`) override existing semantic tokens:
  - `color.bg.*`, `color.text.*`, `color.border.*`, `color.accent.*` (a soft green "Next" button with ink text), `color.focus.ring`, `color.success|warning|info|danger.*` where needed;
  - `font.family.mono`, with `'JetBrains Mono Variable'` first (the Fontsource variable family name);
  - plus the `color.scene.*` tokens.

  Values reference primitives only, and each group sets `$type`. Don't override `overlay.scrim`.

- **`build.mjs` changes** (verified against the current file):
  1. **Load and tag tokens.** `loadTokens(files)` takes a file list and tags each token `tier: 'look' | 'semantic' | 'primitive'` from its `filePath` (`look.` / `semantic.` / else). Today's `filePath.includes('semantic.')` test would wrongly treat look files as primitives.
     - Base themes load `[primitives, semantic.X]`.
     - Each look loads `[primitives, semantic.X, look.paper.X]`; the last file wins on a collision.
  2. **Stop the build if:**
     - the light and dark look files don't define exactly the same keys;
     - a look key is neither an existing token nor `color-scene-*`;
     - any base semantic token references another semantic token. A scoped override couldn't reach it, because `var()` resolves where it is declared.
  3. **Emit only the look's tokens**, after the base blocks inside `@layer tokens`:

     ```css
     [data-look='paper'] {
       /* paper light */
     }
     @media (prefers-color-scheme: dark) {
       :root:not([data-theme='light'])[data-look='paper'],
       :root:not([data-theme='light']) [data-look='paper'] {
         /* paper dark */
       }
     }
     :root[data-theme='dark'][data-look='paper'],
     :root[data-theme='dark'] [data-look='paper'] {
       /* paper dark */
     }
     ```

     Specificity is (0,1,0) for light and (0,3,0) for dark, so dark wins under both triggers. Values set on the element beat values inherited from `:root`.

  4. **`tokens.ts`** gains `export const looks = { paper: { light: {…}, dark: {…} } } as const; export type LookToken = keyof typeof looks.paper.light;`.
  5. **The contrast gate** iterates `light`, `dark`, `paper light` and `paper dark`. Each paper theme is the merged base record plus overrides; it runs the existing pairs plus look pairs:
     - `color-scene-<hue>-ink` on `color-scene-<hue>-top` ≥ 4.5;
     - `color-scene-<hue>-ink` on `color-bg-canvas` ≥ 3;
     - each `color-scene-packet-*` and `color-scene-edge` on `color-bg-surface` ≥ 3.

     Gated colours must be opaque hex or `rgb()` (no `color-mix`). Grid lines aren't gated.

  6. Stylelint's `ah/known-tokens` reads every `--name:` in `tokens.css`, so new tokens are accepted once `tokens.css` is regenerated and committed.
- **Applying the look:**
  - The `sd-shell` host sets `data-look="paper"`, `lang="en"` and `dir="ltr"` (it pins left-to-right even when the visitor chose Arabic: `PreferencesStore` sets `dir` on `<html>`).
  - The host also sets its own `background: var(--color-bg-canvas); color: var(--color-text-default); font-family: var(--font-family-mono)`. `_base.scss` resolves these on `html`, and descendants would otherwise inherit the non-paper values.
  - The standalone `index.html` is `<html lang="en" dir="ltr" data-look="paper">`, so the whole page is paper.
  - When embedded, the portfolio's header and footer keep their look.
  - `ah-modal` (native `<dialog>`) and `ah-select` (Popover API) stay in the host's DOM subtree, so they inherit the look.
- **Starting palette (original; tune until the gate passes):**

  | Token       | Light     | Dark      |
  | ----------- | --------- | --------- |
  | canvas      | `#F2EADD` | `#1E1B17` |
  | surface     | `#F8F1E6` | `#26221D` |
  | raised      | `#FCF8F2` | `#2E2A24` |
  | ink         | `#1F1C18` | `#EEE5D5` |
  | muted       | `#655F56` | `#A79D8F` |
  | line        | `#DCD1C1` | `#3A342C` |
  | line-strong | `#BFB3A2` | `#554C41` |
  | accent fill | `#BBD9A0` | `#4F6E38` |
  | accent text | `#3B6E2A` | `#A6D486` |

  For each hue the top face is the lightest, left the middle and right the darkest, with ink a deep tone of the same hue.

- **Type:** JetBrains Mono on the shell host (above), loaded by the app's and the shell's `styles` arrays. Tabular numbers in the HUD.
- **Surfaces:** cards have a 12px radius, a 1px `border.default` and a soft shadow (`shadow.raised`); buttons get a 1.5px ink offset shadow ("pop") in the paper look. Ground grid: SVG `<pattern>` of iso rhombi in `scene.grid`.

**Glyphs** (`ui/src/lib/scene/glyphs/`, one component each, all drawn from `iso()` geometry, size 1 = one tile):

| Glyph      | Drawing                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `cube`     | Top rhombus plus left and right faces, height 1.1 tiles; icon on the top face; label chip under it |
| `cylinder` | Ellipse top, body and bottom arc; a shard "load chip" sits above it                                |
| `device`   | Laptop or phone on a raised plinth                                                                 |
| `stack`    | Three thin slabs (queue / stream)                                                                  |
| `globe`    | Sphere with meridians (CDN / external)                                                             |
| `person`   | Pill label with the user icon ("you")                                                              |
| `disk`     | Short, wide cylinder                                                                               |

States:

- `focus`: an accent outline;
- `hot`: red faces, with a warning badge when `badge` is set;
- `down`: desaturated with a ✕;
- `dim`: 40% opacity.

`load` draws a small chip, "■■■□ 72%", above the glyph (red ≥ 90%).

**Edges** have 2px `scene.edge` lines (dashed when `style: dashed`), an arrowhead at `to`, and a label chip at the midpoint. **Packets** are 9px dots coloured by kind (a hollow ring for `handshake`, a square for `write`); `label` shows as a chip trailing the packet.

**Draw order:** zones → grid emphasis → edges → nodes sorted by `x + y` (back to front) → notes → packets.

## 7. Learning Engine, Practice and Cheatsheets

**Learning Engine:**

- The recap step shows `<ah-learn-this>` from `@ah/learning/client` ("Add to my daily reviews"). The ui lib can't import it, so `sd-step-panel` has an `<ng-content select="[sdRecapActions]">` slot and `LessonScreen` (feature) projects the button into it.
- Items: `{ text: card.front + '\n' + card.back, source: { app: 'system-design', objectType: 'lesson-card', objectId: `${lesson.id}:${textKey(card.front)}`, deepLink: <page URL if http(s), else null>, excerpt: meta.title } }`, at most 10. `textKey` comes from `@ah/learning/client`. A deep link that isn't absolute `https?://` is dropped by the engine.
- A full "linked host" (answers reported to FSRS, as StudyLM does) would need `HOST_APPS`, `HOST_ORIGINS`, API CORS and `--site-config`. That is out of scope.
- This is a copy of StudyLM's `lessonCardItems()` in `libs/products/studylm/feature/src/lib/services/studylm-reviews.service.ts`. Reuse its shape, but write our own function, since products can't import each other.
- Pass `label`, `demoLabel`, `standaloneHint` and `sentLabel` from our copy file, as `lesson-screen.ts` there does.
- Show it when `learningOn = (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone' || isAppEnabled('learning')`, the same rule StudyLM uses.
- Practice summaries offer the same button for missed questions: `text: prompt + '\n' + explain`, `objectType: 'check'`, `objectId: lessonId:checkId`.
- Add `'system-design': 'System Design'` to `APP_NAMES` in `libs/learning/feature/src/lib/screens/inbox/inbox-screen.ts`, with a spec line.

**Practice:**

- **PracticeHome:** modules → lessons, each with its best score, "Practice" and "Review lesson" links. A "Mixed practice · 10 questions" card draws from the checks of completed lessons through `pickPractice`; it is disabled with a hint until one lesson is complete.
- **Question widgets** (`ui`):
  - `sd-check-choice`: radio group;
  - `sd-check-numeric`: input plus unit, with "within ±25%" shown after answering;
  - `sd-check-order`: a list with up/down buttons, keyboard accessible, with no drag needed.
- After answering: correct or not, `explain`, and "See it in the lesson" (`learn/<lessonId>/<index of step>`).
- **End summary:** score, missed list, "Add missed to my daily reviews", "Practice again".
- Every answer is saved to `attempts`.

**Cheatsheets:**

- One per module in `content/cheatsheets/<module>.ts`.
- **Index:** module cards. **Sheet:** sections rendered by kind; `pattern` links its lesson.
- A print stylesheet (`@media print`) hides the chrome and fits A4.
- Search includes cheatsheet section titles and table first-columns.

## 8. Design Lab (simulator)

**Model** (`lab/model.ts`):

```ts
export type LabKind =
  | 'client'
  | 'cdn'
  | 'load-balancer'
  | 'server'
  | 'cache'
  | 'database'
  | 'replica'
  | 'queue'
  | 'worker'
  | 'storage';
export interface LabNode {
  id: string;
  kind: LabKind;
  instances: number /* 1–20 */;
  hitRatio?: number /* cache 0–0.99 */;
  down?: boolean;
}
export interface LabDesign {
  nodes: LabNode[];
  links: { from: string; to: string }[];
}
export interface Traffic {
  rps: number /* 10–200000 */;
  readRatio: number /* 0–1 */;
  staticRatio: number; /* 0–1 */
}
export interface NodeResult {
  id: string;
  inRps: number;
  capacity: number;
  utilization: number;
  p50: number;
  dropped: number;
}
export interface SimResult {
  nodes: NodeResult[];
  p50: number;
  p95: number;
  errorRate: number;
  throughput: number;
  cost: number;
  problems: string[]; /* plain-English warnings */
}
```

**Catalogue** (`content/lab/catalog.ts`; per instance):

| Kind          | Capacity                   | Base latency | Cost     | Notes                 |
| ------------- | -------------------------- | ------------ | -------- | --------------------- |
| client        | source                     | –            | –        |                       |
| cdn           | ∞                          | 15 ms        | 2 (flat) | Serves `staticRatio`  |
| load-balancer | 50k rps                    | 1 ms         | 1        |                       |
| server        | 1,000 rps                  | 20 ms        | 2        |                       |
| cache         | 50k rps                    | 1 ms         | 2        | Default hit ratio 0.8 |
| database      | 3,000 reads / 1,000 writes | 8 ms         | 4        |                       |
| replica       | 3,000 reads                | 8 ms         | 3        |                       |
| queue         | 100k rps                   | 2 ms         | 1        |                       |
| worker        | 400 msg/s                  | 30 ms        | 1        |                       |
| storage       | ∞                          | 40 ms        | 1        |                       |

**Rules** (`lab/simulate.ts`; deterministic, documented in the code and the Guide as approximations):

1. **Validate shape:** exactly one client; links form a DAG from it; unknown links are listed in `problems`. The client links to exactly one entry node; if it links to more, report "Clients reach one entry point: add a load balancer".
2. **Flow:**
   - `client` sends `rps`;
   - `cdn` absorbs `staticRatio`, the rest goes on;
   - a `load-balancer` splits evenly across its up downstream servers;
   - a `server` splits its input into reads (`readRatio`) and writes;
   - reads go to `cache` if linked (hits are served there; misses continue), then evenly across linked replicas, falling back to the database;
   - writes go to `queue` if linked (async: the user-visible path ends at the queue), otherwise to the database;
   - `queue` → `worker` → `database` writes are capped at worker capacity (excess = "backlog grows" in `problems`, not errors).
3. **Per node:**
   - `capacity = perInstance × instances` (0 when `down`);
   - `ρ = λ / capacity`;
   - a database uses `ρ = readsIn / readCap + writesIn / writeCap`;
   - `p50 = base / (1 − min(ρ, 0.95))`;
   - if `ρ > 1`: the node drops the fraction `1 − 1/ρ` of everything through it, and p50 = base × 20.
4. **End to end:**
   - **Path classes and their shares:**

     | Class       | Share                       |
     | ----------- | --------------------------- |
     | static      | `s`                         |
     | read-hit    | `(1−s)·r·h`                 |
     | read-miss   | `(1−s)·r·(1−h)`             |
     | write-sync  | `(1−s)·(1−r)`, no queue     |
     | write-async | `(1−s)·(1−r)`, with a queue |

     `h = 0` without a cache.

   - **Per path class:** a path's `p50` is the sum of its nodes' p50s, and its `p95 = 2.5 × p50 + 50 ms × (path nodes with ρ > 0.8)`.
   - **Overall:** `p50` and `p95` are the share-weighted averages of the path values.
   - **Errors:** `errorRate` = share-weighted fraction dropped on synchronous path nodes. Writes past a queue never count as errors; worker or database overload behind a queue is reported as "backlog grows" in `problems`.
   - **Worked example** (the first spec case): `client → server×1 → database×1` at 800 rps, r = 0.8, s = 0:
     - server ρ = 0.8, p50 = 100 ms;
     - database ρ = 640/3000 + 160/1000 = 0.373, p50 = 12.76 ms;
     - p50 = 112.76, p95 = 281.9 ms, cost 6.

     Adding a load balancer and a second server gives:
     - server ρ = 0.4, p50 = 33.33;
     - load balancer ≈ 1.02;
     - p50 ≈ 47.1, p95 ≈ 117.8, cost 9.
5. **Cost:** `cost = Σ instances × unit cost`.
6. **Problems:** plain-English warnings such as "Single point of failure: database".

**Challenges** (`content/lab/challenges.ts`): `{ id, title, brief, traffic, goals: { maxP95?, maxErrorRate?, maxCost?, survivesAnySingleFailure?: LabKind[] }, starter: LabDesign, hint }`.

1. **first-users:** 800 rps, 80% reads, p95 ≤ 150 ms, cost ≤ 10. The starter is the worked example's single server, which fails; the solution adds a load balancer and a second server.
2. **launch-day:** 6,000 rps, 90% reads, p95 ≤ 120 ms, errors ≤ 0.1%.
3. **global-images:** 20,000 rps, 70% static, cost ≤ 30.
4. **write-storm:** 4,000 rps, 50% writes, p95 ≤ 100 ms.
5. **no-single-failure:** 3,000 rps; survives losing any one server or the load balancer (requires 2 load balancers).
6. **budget-hero:** 15,000 rps, p95 ≤ 120 ms, cost ≤ 36.

`checkChallenge` re-runs `simulate` with each eligible node `down` for the survival goals.

The numbers in challenges 2–6 are starting points. Tune them so the starter fails and a documented solution passes, and record both designs in `challenges.spec.ts`. Every challenge must have a passing solution.

**UI** (`lab-screen`):

- **Left:** palette buttons (add component).
- **Centre:** the iso scene, auto-laid out by tier columns (client 0, cdn 1, lb 2, server 3, cache and queue 4, database, replica and worker 5; rows stacked), reusing `sd-iso-scene` with `load` chips and `hot` states from the result. Animated packets are proportional to traffic (at most 6 per edge).
- **Right:** the inspector for the selected node: instances stepper, hit-ratio slider, "Connect to…" select, link list with remove, "Simulate failure" switch, delete.
- **Bottom:** traffic controls: an RPS slider on a log scale, read %, static %.
- **Results HUD:** throughput, p50, p95, errors, cost.
- **Challenge panel:** goals that tick live, a hint, and "Reset to starter".
- Designs autosave to `designs` per challenge. Everything is operable without a pointer.

## 11. Phases (one branch and PR each; ✱ = can run in parallel)

Each phase lists its goal, what to change, and when it's done. Run the listed commands before calling it done.

**Order:**

1. P0.
2. P1A (PR 1), P1B and P2, in parallel.
3. P3 → P4 → P5 → P6.
4. Then P7, P8, P9, P10 and P11 in parallel. P10 can start right after P5.
5. P12 last.

P1A (PR 2) lands any time after PR 1 has deployed. Each phase ends by updating `docs/system-design/AI_HANDOFF.md` ("What is live", "Next steps").

### P0: Docs and ADR

- **Write:**
  - `docs/adr/0025-system-design-course.md` (context, decisions §1/§2, consequences), plus a row in `docs/adr/README.md` and the decision log in `docs/architecture.md` §16;
  - `docs/system-design/technical-design.md` (§2–§8 of this plan);
  - `docs/system-design/lesson-authoring.md` (§9 lesson authoring and §10 curriculum);
  - `docs/system-design/AI_HANDOFF.md` (state, code map, hard rules §0, commands, next steps).
- **Done when:** `pnpm nx format:check` passes.

### P1A ✱: Promote the step helpers (two PRs, in order)

`@ah/ui` is a federation singleton: embedded remotes use the **shell's** copy. A StudyLM build that imports `StepTimeline` from `@ah/ui` would break inside the portfolio if it deployed before the shell. So the move happens in two PRs: add first, switch later.

**PR 1 (add, no StudyLM change):**

1. **Create `libs/shared/steps`** by copying `libs/shared/ai-schema`'s setup (project.json, eslint, three tsconfigs, node-environment `vitest.config.mts`, README).
   - Name `shared-steps`, tags `["scope:shared","type:util","runtime:agnostic"]`.
   - `src/lib/replay.ts`: `export interface OpStep<TOp> { readonly ops: readonly TOp[] }` and `export function upTo<TOp>(steps: readonly OpStep<TOp>[], n: number, apply: (op: TOp, current: boolean) => void): void`, with the body copied from `libs/products/studylm/lessons/src/lib/engines/steps.ts`.
   - Add a spec (a new lib with no tests fails `nx test`).
   - Add `"@ah/shared/steps"` to `tsconfig.base.json`.
2. **Copy into `@ah/ui`:**
   - `libs/products/studylm/learn/src/lib/player/step-timeline.ts`, its `.spec.ts`, and `reduced-motion.ts` go to `libs/design-system/ui/src/lib/` as **plain files** (the Storybook coverage guard only checks directories).
   - Add an optional constructor option `{ stepMs?: number }`, defaulting to `STEP_MS`, with a spec.
   - Export both files from `libs/design-system/ui/src/index.ts`.
   - Add a "Helpers" section to the ui README.

**PR 2 (switch StudyLM, after PR 1 has deployed the shell):**

- In `steps.ts`, replace the `upTo` function with `export { upTo } from '@ah/shared/steps';` and keep `StepList`. The seven engine imports and the barrel keep working.
- Rewrite three imports to `@ah/ui`:
  - `player/stepped-visual.ts` (`injectReducedMotion`, `StepTimeline`);
  - `player/step-controls.ts` (`SPEEDS`, `type StepTimeline`);
  - `lesson/lesson-view.ts` (`injectReducedMotion`).
- Delete the three player files from StudyLM `learn` and the `export * from './lib/player/step-timeline'` line in its `src/index.ts`. Nothing imports it through the barrel.

- **Done when:**
  - `pnpm nx run-many -t lint test build -p shared-steps design-system-ui product-studylm-learn product-studylm-lessons product-studylm-feature product-studylm` passes;
  - `pnpm nx e2e shell-e2e -- studylm` passes;
  - lint shows the dependency rules hold (all new edges are allowed).

### P1B ✱: Paper look tokens and font

- **Tokens:** implement the token changes in §6 ("`build.mjs` changes" 1–6), the new primitives, and the two look files. Then run `pnpm nx run design-system-tokens:build-tokens` and commit `tokens.css` and `tokens.ts`.
- **Font:** pin `@fontsource-variable/jetbrains-mono` in the root `package.json` and `pnpm install`. Add `node_modules/@fontsource-variable/jetbrains-mono/index.css` to the **shell's** `esbuild` `styles`, after Inter.
- **Docs:** a "Looks" section in `libs/design-system/tokens/README.md` (how to add a look, the selectors, the gate).
- **Storybook:** a story "Foundations/Paper look" in a `<div data-look="paper">`, showing surfaces, text, a primary button and the eight scene hue swatches (top, left, right, ink), in light and dark. It must be deterministic. Baselines come from CI's Linux image (`nx run design-system-e2e:update-baselines`).
- **Done when:**
  - the build passes the gate for all four themes;
  - CI's tokens diff is clean;
  - existing story baselines are unchanged (paper is opt-in);
  - the shell builds within its budgets (check the CSS size).

### P2 ✱: App skeleton and registration (hidden)

There is no app generator (the workspace plugin in architecture §4.4 doesn't exist). Copy `apps/products/learning/web` and `libs/learning/{domain,data-access,ui,feature}` and rename them. The learning engine's commits `cc37476`, `fdd5a0e` and `1be2863` show every registration touch.

1. **App** `apps/products/system-design/web/` (copied from learning web, with every `learning` and `4311` renamed):
   - `project.json`: name `product-system-design`, tags `scope:product-system-design`, `type:app`, `runtime:browser`, port 4312;
   - targets `build` (ngsw-config) → `build-federation` → `esbuild`, plus `serve`, `serve-original`, `serve-static`, `serve-cloudflare` and `deploy` with `prepare-hosting.mjs … --app product-system-design --cors`. No `--site-config` or `--microphone`; this app calls no API;
   - `styles`: add `node_modules/@fontsource-variable/jetbrains-mono/index.css` after Inter (installed by P1B; if P1B hasn't merged yet, add this line in whichever PR lands second);
   - `federation.config.mjs` (name `product-system-design`), `wrangler.jsonc` (name `product-system-design`, SPA not-found handling), `ngsw-config.json`, `eslint.config.mjs` (the app keeps `angularProject({ prefix: 'ah' })` like learning's; the libs use `sd`);
   - `tsconfig{,.app,.federation}.json`: copy learning's strict ones, not StudyLM's (`strict: false`), and add `angularCompilerOptions.strictTemplates: true`;
   - `src/main.ts`, `bootstrap.ts`, `index.html` (`<html lang="en" dir="ltr" data-look="paper">`, `viewport-fit=cover`);
   - `app/app.ts` (calls `PreferencesStore.restore()` in `afterNextRender`, as learning's does), `app.config.ts` (zoneless, `provideAppMode('standalone')`, service worker), `app.routes.ts`, `remote.routes.ts` (→ `SYSTEM_DESIGN_ROUTES`), `remote.meta.ts` (`{ id: 'product-system-design', title: 'System Design', version: '0.1.0', capabilities: ['indexeddb'] }`);
   - `serve-cloudflare` is optional (only the labs have it);
   - icons and manifest: add `APPS['system-design']` (`dir`, `name`, `shortName`, `description`, `bg`/`fg`/`theme` hex, `glyph`) to `tools/scripts/generate-app-icons.mjs`. Once `index.html` exists, run `node tools/scripts/generate-app-icons.mjs system-design`; it writes the icons and the manifest and edits `<head>`.
2. **Libs:** the 4 libs, copied from `libs/learning/{domain,data-access,ui,feature}` (one more `../` in paths):
   - `project.json` tags (§1); `eslint.config.mjs` `angularProject({ prefix: 'sd' })` with **no `legacy` flag**; `"prefix": "sd"`;
   - node `vitest.config.mts` for domain and data-access (Dexie runs on `fake-indexeddb` in node);
   - Analog + jsdom and `src/test-setup.ts` for ui and feature;
   - each `src/index.ts` exports a placeholder (`SYSTEM_DESIGN_ROUTES` with a "Coming soon" shell), with at least one spec per lib (no empty test runs).
3. **`tsconfig.base.json`:** paths `@ah/products/system-design/{domain,data-access,ui,feature}`.
4. **Root `eslint.config.mjs`:** a `depConstraint` for `scope:product-system-design` allowing its own scope plus `scope:shared`, `scope:platform`, `scope:design-system` and `scope:learning-client`.
5. **`tools/federation/remotes.json`:** `"product-system-design": { "development": "http://localhost:4312", "production": "https://product-system-design.ahmed-hrichi.workers.dev" }`. Add the same dev entry to `apps/portfolio/shell/public/federation.manifest.json`.
6. **Shell route** in `apps/portfolio/shell/src/app/app.routes.ts`, next to `apps/learning`:

   ```ts
   { path: 'apps/system-design', canMatch: [appAvailableGuard('system-design')], loadChildren: federatedRoutes('product-system-design'), title: 'System Design · Interactive Course · Ahmed Hrichi' }
   ```

   `app.routes.server.ts` needs no change: product remotes aren't listed, and `**` covers them.

7. **`libs/shared/content/src/lib/app-visibility.ts`:** add `'system-design'` to `PortfolioAppKey`, `PORTFOLIO_APPS_CONFIG['system-design'] = false` (hidden until P12), and `aliasMap` entries `system-design`, `sysdesign` and `scale-lab`.
   - **The alias is required:** without it, `isRouteEnabled` treats the hidden route as enabled.
   - Spec: `isRouteEnabled('/apps/system-design')` is `false`.
8. **`libs/portfolio/feature-apps/src/lib/apps-page.ts`:**
   - one `AppItem` (`id: 'system-design'`, `route: '/apps/system-design'`) in each of the five `productionApps()` arrays (ar, fr, it, de, en);
   - a `STANDALONE_APP_ORIGINS['system-design']` entry `{ dev: 'http://localhost:4312', prod: 'https://product-system-design.ahmed-hrichi.workers.dev' }`;
   - spec asserts for `resolveStandaloneAppUrl('system-design', …)`.

   The card stays hidden while the flag is false.

9. **Hero:**
   - `nodeLinks` in `libs/three/constellation/src/lib/view.ts` for `product-system-design`, `product-system-design-feature` and `product-system-design-domain` → `/apps/system-design`;
   - `linkLabels['product-system-design'] = 'System Design · Interactive course'` in `libs/portfolio/feature-home/src/lib/constellation/constellation-figure.ts`;
   - links are filtered by `isRouteEnabled`, so they stay hidden until P12;
   - then `node tools/scripts/export-graph.mjs` and commit `libs/three/constellation/src/generated/graph.json` (CI diffs it).
10. **E2E plumbing:**
    - `apps/portfolio/shell-e2e/playwright.config.mts`: a `webServer` for `nx run product-system-design:serve-static`, waiting on `http://localhost:4312/remoteEntry.json`;
    - add the project to `shell-e2e/project.json` `implicitDependencies`;
    - `src/system-design.spec.ts`: **standalone** tests against `http://localhost:4312/` now (as `whatsapp.spec.ts` does), and **embedded** tests guarded by `appIsPublic('system-design')`.
11. **Odds and ends:**
    - `stylelint.config.mjs` STRICT: `'libs/products/system-design/**/*.scss'` and `'apps/products/system-design/**/*.scss'`;
    - the Storybook `.storybook/main.ts` stories glob for `libs/products/system-design/ui`, plus `implicitDependencies: ["product-system-design-ui"]` in the Storybook `project.json`;
    - README project and remotes tables (that table is stale after 4308; add the missing rows while there);
    - `.claude/launch.json` static preview "system-design (static build)" on 4312.
12. **Not needed:** `tools/hosting/environments.json` and `--site-config` (no API calls).
13. **CSP header budget:** `prepare-hosting.mjs` fails the build if the shell's CSP header passes Cloudflare's 2,000 characters. Each remote adds about 110 characters, and this one probably leaves room for only one more. If it fails, stop and report; don't trim the policy by hand.

- **Done when:**
  - `pnpm nx run-many -t lint test build -p product-system-design product-system-design-domain product-system-design-data-access product-system-design-ui product-system-design-feature shell shared-content portfolio-feature-apps learning-feature` passes;
  - `serve` shows a placeholder shell at :4312;
  - the hero graph is regenerated;
  - the visibility flag is **false**.

### P3: Domain core (after P1A PR 1 and P2)

- **Build:**
  - the `model/` types (§3) and `NODE_KINDS`;
  - the `engine/` functions (§4) with full specs;
  - `validate/lesson.ts` with one failing fixture per rule;
  - `content/curriculum.ts` with the 9 modules and the **44 metas**, where `load` points at a shared `pending` stub lesson for lessons not yet written (the stub has 6 steps and validates; `ready: false` makes the sidebar show "soon");
  - `content/content.spec.ts`, which runs `validateLesson` on every ready lesson.
- The domain barrel (`src/index.ts`) exports the model, engines, validators, `CURRICULUM`, `CHEATSHEETS` (loaded lazily the same way), lab and challenges. It **never** exports lesson files: they are reached only through `meta.load()`, so each becomes its own lazy chunk (the app's initial budget warns at 1 MB).
- **Done when:** domain coverage ≥ 90% on `engine/`; every rule has a test.

### P4: UI kit (after P1B and P3)

- **Build:**
  - `sd-icon`;
  - glyph components;
  - `sd-iso-scene` (inputs: `state: SceneState`, `playing`, `speed`, `reducedMotion`; outputs: `packetsDone`; exposes `replay()`);
  - `sd-hud`, `sd-legend`, `sd-step-panel`, `sd-timeline`, `sd-learn-list`, `sd-inline-text`;
  - the three check widgets;
  - `sd-progress-card`.
- Stories for each (a `system-design-ui.stories.ts`), wrapped in `<div data-look="paper">` and deterministic (animations paused or finished), registered in the Storybook `main.ts` glob.
- Component specs (jsdom) with WAAPI stubbed.
- **Accessibility:** Storybook runs `a11y: 'error'`. The diagram is `role="img"` and its nodes are not interactive in lessons. In the Design Lab, selectable nodes are `<g role="button" tabindex="0">` with Enter/Space handlers and an `aria-label`.
- **Done when:** Storybook e2e passes axe in both themes under the paper look; new baselines are committed.

### P5: Feature shell and lesson player (after P4)

- **Build:**
  - the `data-access` Dexie DB (`constructor(name)`) and repositories (tables below); the feature's `SystemDesignRuntime` resolves the name with `databaseName(inject(APP_MODE), …)`;
  - `SystemDesignStore` (`withState`, `withComputed`, `withMethods`, `withHooks` loading on init);
  - `SdNav`;
  - the shell (three layouts, drawer, theme toggle);
  - `LessonScreen` (StepTimeline from `@ah/ui` drives the index; URL ↔ index sync; `sceneAt` memoised per index);
  - keyboard;
  - the search dialog;
  - `GuideScreen`.
- **Dexie tables:**

  | Table      | Key                 | Fields                                                 |
  | ---------- | ------------------- | ------------------------------------------------------ |
  | `progress` | `lessonId`          | `furthestStep`, `lastStep`, `completedAt`, `updatedAt` |
  | `attempts` | `++id`              | `lessonId+checkId` index, `correct`, `answer`, `at`    |
  | `designs`  | `id` (challenge id) |                                                        |
  | `meta`     | `key`               |                                                        |

- Store specs run against a real Dexie (`fake-indexeddb/auto`), copying `learning.store.spec.ts`.
- **Done when:** the stub lessons are navigable end to end on desktop, tablet and phone; keys work; reload resumes.

### P6: Foundations content plus e2e (after P5)

- **Write:** the 4 Foundations lessons in full (golden: `request-journey`), the Foundations cheatsheet, and `apps/portfolio/shell-e2e/src/system-design.spec.ts`:
  - the catalog opens the app;
  - stepping by keyboard updates the URL and HUD;
  - reload resumes;
  - the recap shows takeaways;
  - search finds "DNS";
  - axe is clean on the lesson, practice and guide screens;
  - phone viewport: the bottom bar works.
- **Done when:** e2e passes locally (`pnpm nx e2e shell-e2e -- system-design`).

### P7 ✱: Learning Engine hand-off (after P6)

- `<ah-learn-this>` on the recap and on practice summaries; the inbox `APP_NAMES` entry; an e2e that follows the hand-off into the learning app's Inbox (copy StudyLM's hand-off test in `learning.spec.ts`).

### P8 ✱: Practice (after P6)

- `PracticeHome`, `LessonPractice`, `MixedPractice`; attempts persistence; specs and an e2e path.

### P9 ✱: Cheatsheets (after P6)

- The index and sheet screens, print CSS, the remaining 8 module cheatsheets (they can fill in as module content lands), search integration.

### P10 ✱: Design Lab (after P5)

- `lab/` engine with table-driven specs (each rule in §8 has a test; each challenge has a known passing and failing design); `LabHome` and `LabScreen`; autosave; e2e: solve `first-users`.

### P11 ✱: Content waves (after P6; one agent per module, in parallel)

- Modules 02–09, following `lesson-authoring.md`; flip `ready: true` per lesson.
- Each module PR: its lessons, its cheatsheet, 3–8 checks per lesson, 3–6 cards per lesson.
- **Done when:** the domain content spec is green and the module was stepped through by hand at both widths.

### P12: Go live (after P6–P10)

- Set the `system-design` flag to true. The hub card, hero links and embedded e2e tests then switch on by themselves.
- Re-check the hub card copy in all 5 languages.
- Run Lighthouse on the standalone build manually (Performance ≥ 90, A11y 100).
- Update the README and `AI_HANDOFF.md` status.
- CI deploys `product-system-design` on merge to `main`.

## 12. Verification (end to end)

1. `pnpm check:zoneless && pnpm nx format:check && pnpm lint:styles`.
2. `pnpm nx run design-system-tokens:build-tokens && git diff --exit-code libs/design-system/tokens/src/generated`.
3. `node tools/scripts/export-graph.mjs && git diff --exit-code libs/three/constellation/src/generated`.
4. `pnpm nx run-many -t lint test build -p product-system-design product-system-design-domain product-system-design-data-access product-system-design-ui product-system-design-feature product-studylm product-studylm-learn product-studylm-lessons design-system-ui design-system-tokens shared-steps shared-content portfolio-feature-apps learning-feature shell`.
5. `pnpm nx e2e shell-e2e -- system-design studylm learning`, plus the Storybook e2e in CI.
6. **Manual:**
   - `pnpm nx run product-system-design:serve-static`, then preview :4312;
   - step through a lesson with the keyboard;
   - toggle dark mode;
   - phone width;
   - reduced motion (DevTools rendering emulation);
   - solve a lab challenge;
   - send cards to the Learning Engine.
7. In the portfolio (`pnpm nx run-many -t serve-static -p shell product-system-design product-learning`): `/apps/system-design` renders inside the shell; the shell header keeps its own look.

## 13. Not in scope (possible later)

French and Arabic copy; push reminders (would need `PUSH_APPS` and `ALLOWED_ORIGINS` additions); AI-generated lessons or an AI tutor (local Ollama); a free-form drag canvas in the Design Lab; syncing progress across devices through the API; promoting `sd-iso-scene` to `@ah/ui` once a second app needs isometric diagrams.
