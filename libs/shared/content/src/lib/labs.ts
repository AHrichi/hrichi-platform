/** What opens a lab's page, before the remote that runs it arrives. */
export interface LabIntro {
  eyebrow: string;
  heading: string;
  lead: string;
}

/**
 * The shell prerenders each lab's intro around the remote (ADR-0014), so a
 * lab's first paint never waits for its micro-frontend. A remote's standalone
 * mode shows the same intro.
 */
export const labs = {
  'lab-sky': {
    eyebrow: 'Lab · Three.js, custom shaders and astronomy in the browser',
    heading: 'The sky above any campsite, any night',
    lead: 'Pick a place on the globe, dive down to the ground and look up: 5,000 real stars, the constellations, the Moon in its true phase, the planets, the Milky Way and meteor showers, for any date and time.',
  },
  'lab-hello': {
    eyebrow: 'Lab · Native Federation',
    heading: 'Hello from a federated remote',
    lead: 'This page is built and deployed separately from the shell and loaded at runtime through Native Federation. No zone.js: the counter below updates through signals only.',
  },
  'lab-rxjs': {
    eyebrow: 'Lab · Reactive Streams & Signals',
    heading: 'RxJS Practice Pad',
    lead: 'Interactive laboratory for reactive stream patterns, multicast subjects, error handling strategies, caching architectures, and Angular signal interoperability in zoneless Angular.',
  },
} as const satisfies Record<string, LabIntro>;
