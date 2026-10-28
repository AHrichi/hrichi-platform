import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import { AhButton, Badge } from '@ah/ui';

@Component({
  selector: 'ah-shift-header',
  imports: [CommonModule, AhButton, Badge],
  templateUrl: './shift-header.component.html',
  styleUrl: './shift-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftHeaderComponent {
  readonly store = inject(DispatchStore);
}
