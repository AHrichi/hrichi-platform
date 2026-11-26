import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SerraI18n } from '../../i18n/serra-i18n';
import {
  type FieldInfo,
  fieldInfo,
  injectScreenTopics,
} from '../../science/screen-topics';
import { controlFor, type FieldControl } from '../number-field/field-control';
import { NumberField } from '../number-field/number-field';

/** One number field: its key in the inputs, unit, range and control. */
export interface FieldSpec<K extends string = string> {
  readonly key: K;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Chosen from the unit and range (`controlFor`) unless set. */
  readonly control?: FieldControl;
}

export interface FieldChange {
  key: string;
  value: number;
}

/**
 * A grid of number fields drawn from specs, labelled and hinted in the
 * reader's language (copy `fields` and `hints`, by key), each with its ⓘ:
 * how to get the value, and the phenomenon behind it.
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
        [control]="controlOf(spec)"
        [value]="valueOf(spec.key)"
        [info]="infos()[spec.key]"
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
  private readonly topics = injectScreenTopics();

  protected readonly infos = computed(() => {
    const t = this.t();
    const fallback = this.topics()[0];
    const out: Record<string, FieldInfo | null> = {};
    for (const spec of this.specs()) {
      out[spec.key] = fieldInfo(
        t,
        spec.key,
        t.fields[spec.key] ?? spec.key,
        fallback,
      );
    }
    return out;
  });

  protected controlOf(spec: FieldSpec): FieldControl {
    return controlFor(spec);
  }

  protected valueOf(key: string): number {
    const value = (this.values() as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : 0;
  }
}
