import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GREENHOUSE_BRAND } from '../brand';
import { GhMark } from '../mark/mark';

/**
 * The top of every screen: the farm's logo (or the default mark), the
 * product's name, and whatever actions are projected into it (the language
 * switch). It sits on the accent colour, so a brand's white logo reads.
 */
@Component({
  selector: 'gh-app-bar',
  imports: [NgTemplateOutlet, RouterLink, GhMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-bar.html',
  styleUrl: './app-bar.scss',
})
export class GhAppBar {
  readonly product = input.required<string>();
  readonly tagline = input<string | null>(null);
  /** A router link for the brand area, usually the home screen. */
  readonly home = input<string | null>(null);

  protected readonly brand = inject(GREENHOUSE_BRAND);
}
