import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import type { Driver } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-driver-dispatch',
  imports: [CommonModule],
  templateUrl: './driver-dispatch.component.html',
  styleUrl: './driver-dispatch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverDispatchComponent {
  readonly store = inject(DispatchStore);
  readonly Math = Math;
  readonly callingDriver = signal<Driver | null>(null);

  callDriver(driver: Driver): void {
    this.callingDriver.set(driver);
  }
}
