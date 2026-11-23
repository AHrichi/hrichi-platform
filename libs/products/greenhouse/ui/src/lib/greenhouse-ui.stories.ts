import {
  applicationConfig,
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { GhAppBar } from './app-bar/app-bar';
import { GhBadgeScanner } from './badge-scanner/badge-scanner';
import { provideGreenhouseBrand } from './brand';
import { GhButton } from './button/button';
import { GhLangSwitch } from './lang-switch/lang-switch';
import { GhStatusChip } from './status-chip/status-chip';
import { GhStepper } from './stepper/stepper';

/** Every story renders under the greenhouse look, as the apps do. */
const wrap = (inner: string) =>
  `<div data-look="greenhouse" style="padding: var(--space-5); background: var(--color-bg-canvas); color: var(--color-text-default); display: grid; gap: var(--space-4); max-inline-size: 40rem;">${inner}</div>`;

const LANGUAGES = [
  { id: 'ar', label: 'ع' },
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
];

/** A made-up farm's white wordmark, standing in for a brand pack's logo. */
const EXAMPLE_LOGO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="3"/><circle cx="20" cy="20" r="5" fill="#fff"/><text x="44" y="27" textLength="148" lengthAdjust="spacingAndGlyphs" fill="#fff" font-family="sans-serif" font-size="18" font-weight="700">Example Farms</text></svg>`,
)}`;

const meta: Meta = {
  title: 'Greenhouse/UI Kit',
  decorators: [
    moduleMetadata({
      imports: [
        GhAppBar,
        GhBadgeScanner,
        GhButton,
        GhLangSwitch,
        GhStatusChip,
        GhStepper,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj;

export const AppBar: Story = {
  render: () => ({
    props: { languages: LANGUAGES, current: 'fr' },
    template: wrap(`
      <gh-app-bar product="Carnet de terrain" tagline="Suivi du travail en serre">
        <gh-lang-switch label="Langue" [languages]="languages" [current]="current" (selected)="current = $event" />
      </gh-app-bar>`),
  }),
};

export const AppBarWithAFarmLogo: Story = {
  decorators: [
    applicationConfig({
      providers: [
        provideGreenhouseBrand({
          id: 'example',
          organisation: 'Example Farms',
          logo: EXAMPLE_LOGO,
          logoAlt: 'Example Farms',
        }),
      ],
    }),
  ],
  render: () => ({
    props: { languages: LANGUAGES, current: 'ar' },
    template: wrap(`
      <gh-app-bar product="Field log">
        <gh-lang-switch label="Language" [languages]="languages" [current]="current" (selected)="current = $event" />
      </gh-app-bar>`),
  }),
};

export const Buttons: Story = {
  render: () => ({
    template: wrap(`
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
        <button type="button" ghButton>Save</button>
        <button type="button" ghButton="secondary">Cancel</button>
        <button type="button" ghButton="danger">Delete</button>
        <button type="button" ghButton="ghost">Edit</button>
        <button type="button" ghButton disabled>Saving…</button>
      </div>
      <button type="button" ghButton size="field" block>Save, field size</button>
      <button type="button" ghButton="secondary" size="field" block>Cancel, field size</button>`),
  }),
};

export const Stepper: Story = {
  render: () => ({
    props: { crates: 26, rejected: 4, hours: 8 },
    template: wrap(`
      <gh-stepper label="Crates picked" lessLabel="Less" moreLabel="More" [(value)]="crates" hint="About 312 kg accepted" />
      <gh-stepper label="Rejected crates" lessLabel="Less" moreLabel="More" [(value)]="rejected" error="More than the crates picked" />
      <gh-stepper label="Hours worked" lessLabel="Less" moreLabel="More" [(value)]="hours" [step]="0.5" [max]="12" [decimal]="true" />`),
  }),
};

export const StatusChips: Story = {
  render: () => ({
    template: wrap(`
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
        <gh-status-chip status="pending" label="Not sent yet" />
        <gh-status-chip status="synced" label="Sent · 14:05" />
        <gh-status-chip status="rejected" label="Refused" />
      </div>`),
  }),
};

export const FormCard: Story = {
  render: () => ({
    template: wrap(`
      <form class="gh-card" (submit)="$event.preventDefault()">
        <label class="gh-label" for="story-badge">Badge code</label>
        <input id="story-badge" class="gh-input" type="text" value="GH-0042" />
        <label class="gh-label" for="story-email">Email</label>
        <input id="story-email" class="gh-input" type="email" aria-invalid="true" aria-describedby="story-email-error" value="supervisor@" />
        <p id="story-email-error" class="gh-error">Enter a full email address.</p>
        <button type="submit" ghButton size="field" block>Find</button>
      </form>`),
  }),
};

export const BadgeScanner: Story = {
  render: () => ({
    template: wrap(`
      <gh-badge-scanner scanLabel="Scan badge" stopLabel="Stop camera" hint="Point the camera at the badge" />`),
  }),
};
