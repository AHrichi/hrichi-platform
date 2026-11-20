import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AhButton } from '../lib/button/button';

const hues = [
  'neutral',
  'amber',
  'blue',
  'violet',
  'green',
  'rose',
  'teal',
  'red',
] as const;
const faces = ['top', 'left', 'right', 'ink'] as const;
const packets = [
  'request',
  'response',
  'handshake',
  'write',
  'event',
  'error',
] as const;

/**
 * The paper look (`data-look="paper"`): warm surfaces, monospace type, a soft
 * green primary button, and the look-only `color-scene-*` tokens the
 * isometric diagrams draw with. Static, so its screenshots are deterministic.
 */
@Component({
  selector: 'ah-paper-look',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AhButton],
  templateUrl: './paper-look.stories.html',
  styleUrl: './paper-look.stories.scss',
})
class PaperLook {
  protected readonly surfaces = ['canvas', 'surface', 'raised'] as const;
  protected readonly hues = hues;
  protected readonly faces = faces;
  protected readonly packets = packets;

  protected scene(...parts: string[]): string {
    return `var(--color-scene-${parts.join('-')})`;
  }
}

const meta: Meta = {
  title: 'Foundations/Paper look',
  parameters: { layout: 'padded' },
};
export default meta;

export const Overview: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [PaperLook] },
    template: `<div data-look="paper"><ah-paper-look /></div>`,
  }),
};
