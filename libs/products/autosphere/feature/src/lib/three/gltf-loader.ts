// Native Federation shares `three`, and esbuild treats every `three/...`
// subpath as part of that external, but the import map lists only the
// package root. The loaders are bundled with the scene by path (ADR-0014).
/* eslint-disable @nx/enforce-module-boundaries */
import type { GLTFLoader as GLTFLoaderType } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { DRACOLoader as DRACOLoaderType } from 'three/examples/jsm/loaders/DRACOLoader.js';

// @ts-expect-error three ships no internal type declarations for these paths
import { GLTFLoader as GLTFLoaderImpl } from '../../../../../../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
// @ts-expect-error three ships no internal type declarations for these paths
import { DRACOLoader as DRACOLoaderImpl } from '../../../../../../../node_modules/three/examples/jsm/loaders/DRACOLoader.js';

export const GLTFLoader = GLTFLoaderImpl as typeof GLTFLoaderType;
export const DRACOLoader = DRACOLoaderImpl as typeof DRACOLoaderType;
