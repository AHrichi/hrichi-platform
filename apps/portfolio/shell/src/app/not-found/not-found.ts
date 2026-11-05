import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { SHELL_COPY } from '../shell-copy';

@Component({
  selector: 'ah-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => SHELL_COPY[this.preferences.language()].notFound,
  );
}
