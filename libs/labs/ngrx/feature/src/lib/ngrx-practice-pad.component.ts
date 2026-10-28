import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgrxNavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'ah-ngrx-practice-pad',
  imports: [RouterOutlet, NgrxNavigationComponent],
  templateUrl: './ngrx-practice-pad.component.html',
  styleUrl: './ngrx-practice-pad.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxPracticePadComponent {}
