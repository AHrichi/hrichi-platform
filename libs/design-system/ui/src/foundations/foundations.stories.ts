import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { darkTheme, lightTheme, primitives } from '@ah/design-system/tokens';

type Theme = 'light' | 'dark';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio, the same formula as the token build's gate. */
function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** What each foreground colour is drawn on; surfaces and borders have no pair. */
function backgroundFor(name: string): string | null {
  if (name === 'color-text-inverse') return 'color-bg-inverse';
  if (name === 'color-accent-on') return 'color-accent-default';
  if (
    name.startsWith('color-data-') ||
    name === 'color-stage-text' ||
    name === 'color-stage-muted'
  ) {
    return 'color-stage-bg';
  }
  if (/^color-(text|accent-(default|hover)|success|focus)/.test(name)) {
    return 'color-bg-canvas';
  }
  return null;
}

/** Semantic colours, with each one's contrast against what it sits on. */
@Component({
  selector: 'ah-colour-tokens',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foundations.stories.html',
  styleUrl: './foundations.stories.scss',
})
class ColourTokens {
  readonly theme = input<Theme>('light');

  protected readonly rows = computed(() => {
    const tokens: Record<string, string> =
      this.theme() === 'light' ? lightTheme : darkTheme;
    return Object.entries(tokens)
      .filter(([name]) => name.startsWith('color-'))
      .map(([name, value]) => {
        const background = backgroundFor(name);
        return {
          name,
          value,
          on: background ? background.replace('color-', '') : '—',
          contrast: background
            ? `${contrast(value, tokens[background]).toFixed(2)}:1`
            : '—',
        };
      });
  });
}

/** The fluid type scale, rendered at the current viewport. */
@Component({
  selector: 'ah-type-scale',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (step of steps; track step) {
      <p [style.font-size]="'var(--font-size-' + step + ')'">
        <code>--font-size-{{ step }}</code> Angular, 3D and integration work
      </p>
    }
  `,
  styles: `
    p {
      margin-block: var(--space-2);
    }
    code {
      font-size: var(--font-size-100);
      color: var(--color-text-muted);
      margin-inline-end: var(--space-3);
    }
  `,
})
class TypeScale {
  protected readonly steps = [100, 200, 300, 400, 500, 600, 700];
}

/** The spacing scale. */
@Component({
  selector: 'ah-spacing-scale',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (step of steps; track step.name) {
      <div class="row">
        <code>--{{ step.name }}</code>
        <span
          class="bar"
          [style.inline-size]="'var(--' + step.name + ')'"
        ></span>
        <span class="value">{{ step.value }}</span>
      </div>
    }
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: 7rem auto 1fr;
      align-items: center;
      gap: var(--space-3);
      margin-block: var(--space-1);
      font-size: var(--font-size-100);
    }
    .bar {
      block-size: 0.75rem;
      background: var(--color-accent-default);
      border-radius: var(--radius-sm);
    }
    .value {
      color: var(--color-text-muted);
    }
  `,
})
class SpacingScale {
  protected readonly steps = Object.entries(primitives)
    .filter(([name]) => name.startsWith('space-') && name !== 'space-0')
    .map(([name, value]) => ({ name, value }));
}

const meta: Meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'padded' },
};
export default meta;

export const Colours: StoryObj = {
  render: (_, context) => ({
    props: { theme: context.globals['theme'] },
    moduleMetadata: { imports: [ColourTokens] },
    template: `<ah-colour-tokens [theme]="theme" />`,
  }),
};

export const Typography: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [TypeScale] },
    template: `<ah-type-scale />`,
  }),
};

export const Spacing: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [SpacingScale] },
    template: `<ah-spacing-scale />`,
  }),
};
