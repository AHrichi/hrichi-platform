import {
  fromPackageJson,
  mappingsFromWorkspace,
} from '@angular-architects/native-federation/config';

/**
 * One sharing policy for the shell and every remote (ADR-0002), so shared
 * versions can't drift between independently deployed apps.
 */
export const shared = fromPackageJson({
  singleton: true,
  strictVersion: true,
  requiredVersion: 'auto',
  build: 'package',
})
  .patch(['@angular/*'], { includeSecondaries: { keepAll: true } })
  .patch(['@ngrx/*'], { includeSecondaries: { keepAll: true } })
  .get();

/**
 * Only libraries that remotes may use are federated; page-level feature libs
 * stay inside the shell's own lazy chunks.
 *
 * The platform's libs are named one by one: federation ships a scope's libs
 * as one bundle, and a remote whose bundle holds a lib the shell's lacks
 * loads its own copy of all of them, so it would get its own APP_MODE token
 * and run as if standalone. Libs only remotes use, like `@ah/platform/maps`,
 * stay out and are bundled into each remote.
 */
export const sharedMappings = mappingsFromWorkspace({ singleton: true })
  .filter([
    '@ah/platform/app-mode',
    '@ah/platform/federation',
    '@ah/platform/inspector',
    '@ah/shared/*',
    '@ah/ui',
    '@ah/design-system/*',
  ])
  .get();

export const skip = [
  'rxjs/ajax',
  'rxjs/fetch',
  'rxjs/testing',
  'rxjs/webSocket',
  // keepAll publishes these too, but they import @angular/animations, an
  // optional peer we don't install (deprecated in favour of animate.enter/leave).
  '@angular/platform-browser/animations',
  '@angular/platform-browser/animations/async',
  // Build-time config and standalone worker scripts, never imported by app code.
  '@angular/service-worker/config',
  '@angular/service-worker/ngsw-worker.js',
  '@angular/service-worker/safety-worker.js',
  '@angular/cdk/schematics',
  // Only the shell's lazy Federation Inspector uses it; bundled there instead.
  'web-vitals',
  // The Sky lab's own dependencies (ADR-0016), bundled into the remote so
  // esbuild can tree-shake them; nothing else uses them.
  'astronomy-engine',
  'world-atlas',
  'topojson-client',
  // StrategyApp's own dependencies, bundled into the remote so
  // esbuild can tree-shake them; nothing else uses them.
  'dexie',
  'chart.js',
  'ng2-charts',
  'canvas-confetti',
  'jspdf',
  'html2canvas',
  'xlsx',
  // LuxPath's own dependencies, bundled into the remote so esbuild bundles it cleanly
  'leaflet',
  // StudyLM's lesson contracts: bundled into the remote, where esbuild tree-shakes them.
  'valibot',
  // StudyLM's JavaScript tracer: an interpreter and its parser, used only there.
  'sval',
  'acorn',
];

// https://native-federation.com/docs/v4/angular-adapter/configuration/
export const features = {
  denseChunking: true,
  denseExternals: true,
  strictImports: false,
};
