import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  OnInit,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AhButton, SegmentedControl, SegmentedOption, Tag } from '@ah/ui';

@Component({
  selector: 'ah-use-case-focus',
  standalone: true,
  imports: [SegmentedControl, Tag, AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './use-case-focus.component.html',
  styleUrl: './use-case-focus.component.scss',
})
export class UseCaseFocusComponent implements OnInit {
  readonly options = input.required<readonly SegmentedOption<string>[]>();
  readonly value = model.required<string>();
  readonly ariaLabel = input<string>('Filter use cases');
  readonly queryParamName = input<string>('case');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeLabel = computed(() => {
    const current = this.value();
    const match = this.options().find((opt) => opt.value === current);
    return match ? match.label : current;
  });

  constructor() {
    effect(() => {
      const val = this.value();
      const key = this.queryParamName();

      untracked(() => {
        const currentParamInUrl = this.route.snapshot.queryParamMap.get(key);
        const nextParamInUrl = val === 'all' ? null : val;

        if (currentParamInUrl !== nextParamInUrl) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { [key]: nextParamInUrl },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });
    });
  }

  ngOnInit(): void {
    // Listen for query parameter updates (including browser navigation)
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const caseParam = params.get(this.queryParamName());
        if (caseParam && this.options().some((o) => o.value === caseParam)) {
          if (this.value() !== caseParam) {
            this.value.set(caseParam);
          }
        } else if (!caseParam && this.value() !== 'all') {
          this.value.set('all');
        }
      });
  }

  resetToAll(): void {
    this.value.set('all');
  }
}
