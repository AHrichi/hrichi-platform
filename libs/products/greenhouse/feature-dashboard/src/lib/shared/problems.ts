import type { SetupProblem } from '@ah/products/greenhouse/domain';

/** A setup form's problems, by field. */
export type FieldProblems<F extends string> = Partial<Record<F, SetupProblem>>;

/** The values of a form, by input name, as text. */
export function formText(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    values[key] = typeof value === 'string' ? value : '';
  });
  return values;
}
