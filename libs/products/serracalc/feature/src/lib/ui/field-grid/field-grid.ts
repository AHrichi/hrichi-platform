import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { SerraI18n } from '../../i18n/serra-i18n';
import { NumberField } from '../number-field/number-field';

/** One number field: its key in the inputs, unit and range. */
export interface FieldSpec<K extends string = string> {
  readonly key: K;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface FieldChange {
  key: string;
  value: number;
}

/**
 * A grid of number fields drawn from specs, labelled and hinted in the
 * reader's language (copy `fields` and `hints`, by key).
 */
@Component({
  selector: 'sc-field-grid',
  imports: [NumberField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (spec of specs(); track spec.key) {
      <sc-number-field
        [label]="t().fields[spec.key] ?? spec.key"
        [unit]="spec.unit"
        [hint]="t().hints[spec.key]"
        [min]="spec.min"
        [max]="spec.max"
        [step]="spec.step"
        [value]="valueOf(spec.key)"
        (valueChange)="changed.emit({ key: spec.key, value: $event })"
      />
    }
    <ng-content />
  `,
  styleUrl: './field-grid.scss',
})
export class FieldGrid {
  readonly specs = input.required<readonly FieldSpec[]>();
  /** The inputs object the fields read from. */
  readonly values = input.required<object>();
  readonly changed = output<FieldChange>();

  protected readonly t = inject(SerraI18n).t;

  protected valueOf(key: string): number {
    const value = (this.values() as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : 0;
  }
}
