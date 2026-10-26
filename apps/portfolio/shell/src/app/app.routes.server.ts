import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Static-first (ADR-0003): content routes are prerendered at build time,
 * federated routes render in the browser only.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'labs/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
