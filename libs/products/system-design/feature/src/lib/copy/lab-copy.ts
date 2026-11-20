/** The Design Lab's words (ADR-0018: typed copy, English only for now). */
export const LAB_COPY = {
  homeHeading: 'Design Lab',
  homeIntro:
    'Wire up components, send traffic through them and watch where it hurts. Each challenge sets a goal; the sandbox has none.',
  challengesHeading: 'Challenges',
  sandboxHeading: 'Sandbox',
  sandboxBody:
    'An empty bench with your own traffic: try any design and see how it copes.',
  openSandbox: 'Open the sandbox',
  openChallenge: 'Open',
  status: {
    new: 'Not started',
    started: 'In progress',
    solved: 'Solved',
  },
  approximations:
    'The numbers are teaching approximations: simple queueing rules, not a benchmark.',

  breadcrumb: 'Design Lab',
  backToLab: 'All challenges',
  sandboxTitle: 'Sandbox',
  sandboxBrief:
    'No goals here. Change the traffic below and see how your design copes.',
  notFoundHeading: 'Challenge not found',
  notFoundBody: 'That challenge does not exist. Pick one from the list.',

  paletteHeading: 'Add a component',
  paletteHint: 'New parts wire themselves in where they usually go.',
  addPrefix: 'Add',

  stageLabel: 'Your design. Select a component to inspect it.',
  hud: {
    throughput: 'Throughput',
    p50: 'p50',
    p95: 'p95',
    errors: 'Errors',
    cost: 'Cost',
  },

  inspectorHeading: 'Inspector',
  inspectorEmpty:
    'Select a component in the diagram (Tab to it, then Enter) to change it.',
  instances: 'Instances',
  fewer: 'Fewer instances',
  more: 'More instances',
  fixedInstances: 'A managed service: it scales by itself.',
  hitRatio: 'Hit ratio',
  connectTo: 'Connect to…',
  connectPlaceholder: 'Choose a component',
  connect: 'Connect',
  nothingToConnect: 'Nothing left to connect to.',
  linksHeading: 'Links',
  noLinks: 'No links yet.',
  linkTo: 'to',
  linkFrom: 'from',
  removeLink: 'Remove',
  removeLinkLabel: (direction: string, other: string) =>
    `Remove link ${direction} ${other}`,
  failure: 'Simulate failure',
  delete: 'Delete',

  trafficHeading: 'Traffic',
  trafficFixed: 'Set by the challenge.',
  rps: 'Requests a second',
  reads: 'Reads',
  statics: 'Static files',

  goalsHeading: 'Goals',
  goalMet: 'Met',
  goalNotMet: 'Not met',
  solved: 'Solved: every goal is met.',
  unsolved: 'Not solved yet.',
  hint: 'Hint',
  resetStarter: 'Reset to starter',
  resetSandbox: 'Reset the sandbox',
  problemsHeading: 'What the simulator noticed',
  noProblems: 'Nothing to report.',
} as const;
