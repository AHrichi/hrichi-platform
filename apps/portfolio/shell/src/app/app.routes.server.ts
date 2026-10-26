import { RenderMode, ServerRoute } from '@angular/ssr';
import { caseStudies } from '@ah/shared/content';

/**
 * Static-first (ADR-0003): content routes are prerendered at build time,
 * federated routes render in the browser only.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      caseStudies.map((study) => ({ slug: study.slug })),
  },
  { path: 'labs/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
