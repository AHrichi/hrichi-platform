import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectNgrxLabCopy } from '../i18n/ngrx-lab-copy';

@Component({
  selector: 'ah-ngrx-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxNavigationComponent {
  private readonly labCopy = injectNgrxLabCopy();
  readonly copy = computed(() => this.labCopy().navigation);
}
