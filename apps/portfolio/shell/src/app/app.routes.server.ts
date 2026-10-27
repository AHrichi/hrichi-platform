import { RenderMode, ServerRoute } from '@angular/ssr';
import { caseStudies } from '@ah/shared/content';

/**
 * Static-first (ADR-0003): every route is prerendered at build time. A lab's
 * page is prerendered with its intro only; its remote renders in the browser
 * (ADR-0014).
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      caseStudies.map((study) => ({ slug: study.slug })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
