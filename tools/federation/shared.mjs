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
  .get();

/**
 * Only libraries that remotes may use are federated; page-level feature libs
 * stay inside the shell's own lazy chunks.
 */
export const sharedMappings = mappingsFromWorkspace({ singleton: true })
  .filter(['@ah/platform/*', '@ah/shared/*', '@ah/ui', '@ah/design-system/*'])
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
  // Only the shell's lazy Federation Inspector uses it; bundled there instead.
  'web-vitals',
  // The Orbit lab's own dependencies (ADR-0014). satellite.js runs in a Web
  // Worker, which has no import map, so it must be bundled, never shared.
  'satellite.js',
  'world-atlas',
  'topojson-client',
];

// https://native-federation.com/docs/v4/angular-adapter/configuration/
export const features = {
  denseChunking: true,
  denseExternals: true,
  strictImports: false,
};
