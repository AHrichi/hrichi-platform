import { RenderMode, ServerRoute } from '@angular/ssr';
import { caseStudies, isAppEnabled } from '@ah/shared/content';

/**
 * Static-first SSR (ADR-0003): Static pages like the home page, case studies,
 * experience, services, contact, CV, and the apps catalog are rendered into
 * full static HTML ahead of time using Angular's SSR engine (@angular/ssr).
 * They are served with 0ms compute latency from Cloudflare edge storage and
 * hydrated with event replay on the client.
 */
const enabledOptionalRoutes: ServerRoute[] = [];
if (isAppEnabled('alarm-engine')) {
  enabledOptionalRoutes.push({
    path: 'apps/alarm-engine',
    renderMode: RenderMode.Prerender,
  });
}
if (isAppEnabled('sky')) {
  enabledOptionalRoutes.push({
    path: 'labs/sky',
    renderMode: RenderMode.Prerender,
  });
}
if (isAppEnabled('rxjs')) {
  enabledOptionalRoutes.push({
    path: 'labs/rxjs',
    renderMode: RenderMode.Prerender,
  });
}
if (isAppEnabled('ngrx')) {
  enabledOptionalRoutes.push({
    path: 'labs/ngrx',
    renderMode: RenderMode.Prerender,
  });
}

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'work', renderMode: RenderMode.Prerender },
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      caseStudies.map((study) => ({ slug: study.slug })),
  },
  { path: 'experience', renderMode: RenderMode.Prerender },
  { path: 'services', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'cv', renderMode: RenderMode.Prerender },
  { path: 'apps', renderMode: RenderMode.Prerender },
  ...enabledOptionalRoutes,
  { path: '**', renderMode: RenderMode.Prerender },
];
