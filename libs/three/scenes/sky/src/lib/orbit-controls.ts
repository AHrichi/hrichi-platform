// Native Federation shares `three`, and esbuild treats every `three/...`
// subpath as part of that external, but the import map lists only the
// package root, so `three/addons/...` can't be resolved at run time. The
// addon is bundled with the scene instead, by path; its own `import 'three'`
// still resolves to the shared copy (ADR-0014).
/* eslint-disable @nx/enforce-module-boundaries -- the path import into node_modules is the point (see above) */
import type { OrbitControls as OrbitControlsType } from 'three/addons/controls/OrbitControls.js';
// @ts-expect-error three ships no type declarations; @types/three types the addon path above.
import { OrbitControls as Controls } from '../../../../../../node_modules/three/examples/jsm/controls/OrbitControls.js';

export const OrbitControls = Controls as typeof OrbitControlsType;
