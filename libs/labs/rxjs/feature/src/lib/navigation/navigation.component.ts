import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tag } from '@ah/ui';
import { injectRxjsLabCopy } from '../i18n/rxjs-lab-copy';

export interface LabExerciseItem {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export interface LabCategory {
  readonly id: string;
  readonly title: string;
  readonly badge: string;
  readonly exercises: readonly LabExerciseItem[];
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Tag],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  readonly isOpen = input.required<boolean>();
  readonly copy = injectRxjsLabCopy();
  readonly categories = computed<readonly LabCategory[]>(
    () => this.copy().nav.categories,
  );
}
