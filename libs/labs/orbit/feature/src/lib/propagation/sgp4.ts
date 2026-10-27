// satellite.js 7's package entry also re-exports its WebAssembly build,
// whose Node-only branches import `node:` modules that a browser bundle
// can't resolve (and the worker's build ignores externalDependencies). The
// package exports nothing else, so the worker imports the plain JavaScript
// modules by path.
/* eslint-disable @nx/enforce-module-boundaries -- the path import into node_modules is the point (see above) */
export { json2satrec } from '../../../../../../../node_modules/satellite.js/dist/io.js';
export { propagate } from '../../../../../../../node_modules/satellite.js/dist/propagation.js';
export { eciToGeodetic } from '../../../../../../../node_modules/satellite.js/dist/transforms.js';
export type { SatRec } from '../../../../../../../node_modules/satellite.js/dist/propagation/SatRec.js';
