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
  'lab-orbit': {
    eyebrow: 'Lab · Three.js, a Web Worker, Spring Boot and Orekit',
    heading: 'Every active satellite, right now',
    lead: "Positions are computed in your browser from CelesTrak's public orbit data. Pick a satellite to see its orbit and when it passes over you; the pass times come from a Spring Boot API running Orekit.",
  },
  'lab-hello': {
    eyebrow: 'Lab · Native Federation',
    heading: 'Hello from a federated remote',
    lead: 'This page is built and deployed separately from the shell and loaded at runtime through Native Federation. No zone.js: the counter below updates through signals only.',
  },
} as const satisfies Record<string, LabIntro>;
