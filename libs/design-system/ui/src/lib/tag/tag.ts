import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Small label for a technology or category. */
@Component({
  selector: 'ah-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tag.html',
  styleUrl: './tag.scss',
})
export class Tag {}
