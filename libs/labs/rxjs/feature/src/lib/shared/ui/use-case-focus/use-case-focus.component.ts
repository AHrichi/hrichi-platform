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
  template: `
    <div class="focus-toolbar" role="region" [attr.aria-label]="ariaLabel()">
      <div class="control-wrapper">
        <ah-segmented-control
          [options]="options()"
          [(value)]="value"
          [label]="ariaLabel()"
        />
      </div>

      @if (value() !== 'all') {
        <div class="active-badge-group">
          <ah-tag>Focused: {{ activeLabel() }}</ah-tag>
          <button
            type="button"
            ahButton="ghost"
            size="sm"
            (click)="resetToAll()"
            title="Show all use cases in parallel"
          >
            Show All
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--space-5);
    }

    .focus-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-raised);
    }

    .control-wrapper {
      display: flex;
      align-items: center;
      overflow-x: auto;
      max-width: 100%;
      padding-block: var(--space-1);

      &::-webkit-scrollbar {
        height: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--color-border-default);
        border-radius: var(--radius-pill);
      }
    }

    .active-badge-group {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
  `,
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
